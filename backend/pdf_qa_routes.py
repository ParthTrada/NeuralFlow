"""
PDF Q&A Routes - RAG-based chatbot for PDF documents
Uses Groq (Llama 3.3) for text generation
Uses simple TF-IDF for embeddings (no external API needed)
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
import os
import re
import math
from datetime import datetime, timezone
from collections import Counter
import PyPDF2
import io
from groq import Groq

# Initialize Groq client
def get_groq_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured. Please add it to your environment.")
    return Groq(api_key=api_key)

# Simple TF-IDF based embeddings (no external API needed!)
class SimpleEmbeddings:
    """Simple TF-IDF based text similarity - runs locally, no API needed"""
    
    def __init__(self):
        self.vocabulary = {}
        self.idf = {}
        self.documents = []
        self.doc_vectors = []
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization"""
        text = text.lower()
        # Remove special characters, keep alphanumeric and spaces
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        # Split into words
        words = text.split()
        # Remove very short words
        words = [w for w in words if len(w) > 2]
        return words
    
    def _compute_tf(self, tokens: List[str]) -> dict:
        """Compute term frequency"""
        tf = Counter(tokens)
        total = len(tokens)
        return {word: count / total for word, count in tf.items()}
    
    def fit(self, documents: List[str]):
        """Fit the embeddings model on documents"""
        self.documents = documents
        
        # Build vocabulary and compute IDF
        doc_count = len(documents)
        word_doc_count = Counter()
        
        for doc in documents:
            tokens = set(self._tokenize(doc))
            for token in tokens:
                word_doc_count[token] += 1
        
        # Compute IDF
        self.idf = {
            word: math.log(doc_count / (count + 1)) + 1
            for word, count in word_doc_count.items()
        }
        self.vocabulary = {word: idx for idx, word in enumerate(self.idf.keys())}
        
        # Compute TF-IDF vectors for all documents
        self.doc_vectors = [self._get_vector(doc) for doc in documents]
    
    def _get_vector(self, text: str) -> dict:
        """Get TF-IDF vector for text"""
        tokens = self._tokenize(text)
        tf = self._compute_tf(tokens)
        
        vector = {}
        for word, tf_val in tf.items():
            if word in self.idf:
                vector[word] = tf_val * self.idf[word]
        return vector
    
    def _cosine_similarity(self, vec1: dict, vec2: dict) -> float:
        """Compute cosine similarity between two sparse vectors"""
        common_words = set(vec1.keys()) & set(vec2.keys())
        
        if not common_words:
            return 0.0
        
        dot_product = sum(vec1[w] * vec2[w] for w in common_words)
        mag1 = math.sqrt(sum(v**2 for v in vec1.values()))
        mag2 = math.sqrt(sum(v**2 for v in vec2.values()))
        
        if mag1 == 0 or mag2 == 0:
            return 0.0
        
        return dot_product / (mag1 * mag2)
    
    def find_similar(self, query: str, top_k: int = 3) -> List[tuple]:
        """Find most similar documents to query"""
        query_vector = self._get_vector(query)
        
        similarities = []
        for idx, doc_vector in enumerate(self.doc_vectors):
            sim = self._cosine_similarity(query_vector, doc_vector)
            similarities.append((idx, sim, self.documents[idx]))
        
        # Sort by similarity descending
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]


# In-memory storage for uploaded PDFs (in production, use database)
pdf_storage = {}

def create_pdf_qa_router(db):
    router = APIRouter(prefix="/pdf-qa", tags=["PDF Q&A"])
    
    class QuestionRequest(BaseModel):
        session_id: str
        question: str
    
    class UploadResponse(BaseModel):
        session_id: str
        filename: str
        num_chunks: int
        message: str
    
    class AnswerResponse(BaseModel):
        answer: str
        sources: List[str]
        confidence: float
    
    def extract_text_from_pdf(file_content: bytes) -> str:
        """Extract text from PDF file"""
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    
    def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks
    
    @router.post("/upload", response_model=UploadResponse)
    async def upload_pdf(
        file: UploadFile = File(...),
        session_id: str = Form(...)
    ):
        """Upload a PDF and process it for Q&A"""
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        try:
            # Read file content
            content = await file.read()
            
            # Extract text
            text = extract_text_from_pdf(content)
            
            if not text.strip():
                raise HTTPException(status_code=400, detail="Could not extract text from PDF. The PDF might be scanned/image-based.")
            
            # Chunk the text
            chunks = chunk_text(text)
            
            if len(chunks) == 0:
                raise HTTPException(status_code=400, detail="PDF has no extractable content")
            
            # Create embeddings
            embeddings = SimpleEmbeddings()
            embeddings.fit(chunks)
            
            # Store in memory
            pdf_storage[session_id] = {
                "filename": file.filename,
                "chunks": chunks,
                "embeddings": embeddings,
                "chat_history": [],
                "uploaded_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Also store in database for persistence
            await db.pdf_sessions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "session_id": session_id,
                    "filename": file.filename,
                    "num_chunks": len(chunks),
                    "chunks": chunks,  # Store chunks for rebuilding embeddings
                    "chat_history": [],
                    "uploaded_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
            
            return UploadResponse(
                session_id=session_id,
                filename=file.filename,
                num_chunks=len(chunks),
                message=f"Successfully processed PDF with {len(chunks)} chunks"
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    
    @router.post("/ask", response_model=AnswerResponse)
    async def ask_question(request: QuestionRequest):
        """Ask a question about the uploaded PDF"""
        session_id = request.session_id
        question = request.question
        
        # Check if session exists in memory
        if session_id not in pdf_storage:
            # Try to load from database
            db_session = await db.pdf_sessions.find_one(
                {"session_id": session_id},
                {"_id": 0}
            )
            
            if not db_session:
                raise HTTPException(status_code=404, detail="No PDF uploaded for this session. Please upload a PDF first.")
            
            # Rebuild embeddings from stored chunks
            embeddings = SimpleEmbeddings()
            embeddings.fit(db_session["chunks"])
            
            pdf_storage[session_id] = {
                "filename": db_session["filename"],
                "chunks": db_session["chunks"],
                "embeddings": embeddings,
                "chat_history": db_session.get("chat_history", [])
            }
        
        session_data = pdf_storage[session_id]
        embeddings = session_data["embeddings"]
        
        # Find relevant chunks
        similar_chunks = embeddings.find_similar(question, top_k=3)
        
        if not similar_chunks:
            return AnswerResponse(
                answer="I couldn't find relevant information in the document to answer your question.",
                sources=[],
                confidence=0.0
            )
        
        # Build context from relevant chunks
        context_parts = []
        sources = []
        max_confidence = 0
        
        for idx, similarity, chunk in similar_chunks:
            if similarity > 0.1:  # Only include if similarity is meaningful
                context_parts.append(chunk)
                sources.append(f"Chunk {idx + 1} (relevance: {similarity:.2f})")
                max_confidence = max(max_confidence, similarity)
        
        if not context_parts:
            return AnswerResponse(
                answer="I couldn't find relevant information in the document to answer your question.",
                sources=[],
                confidence=0.0
            )
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Build chat history context (last 3 exchanges)
        history_context = ""
        chat_history = session_data.get("chat_history", [])[-6:]  # Last 3 Q&A pairs
        if chat_history:
            history_context = "Previous conversation:\n"
            for msg in chat_history:
                role = "User" if msg["role"] == "user" else "Assistant"
                history_context += f"{role}: {msg['content']}\n"
            history_context += "\n"
        
        # Generate answer using Groq
        try:
            client = get_groq_client()
            
            system_prompt = """You are a helpful assistant that answers questions based on the provided document context. 
Follow these rules:
1. Only answer based on the provided context
2. If the context doesn't contain the answer, say "I cannot find this information in the document"
3. Be concise but complete
4. If quoting from the document, indicate it clearly"""
            
            user_prompt = f"""{history_context}Document context:
{context}

Question: {question}

Please answer based only on the document context provided above."""
            
            chat_completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=1024
            )
            
            answer = chat_completion.choices[0].message.content
            
            # Update chat history
            session_data["chat_history"].append({"role": "user", "content": question})
            session_data["chat_history"].append({"role": "assistant", "content": answer})
            
            # Update in database
            await db.pdf_sessions.update_one(
                {"session_id": session_id},
                {"$set": {"chat_history": session_data["chat_history"]}}
            )
            
            return AnswerResponse(
                answer=answer,
                sources=sources,
                confidence=min(max_confidence * 1.5, 1.0)  # Scale confidence
            )
            
        except Exception as e:
            error_msg = str(e)
            if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
                raise HTTPException(status_code=500, detail="Groq API key is invalid or missing. Please check your configuration.")
            raise HTTPException(status_code=500, detail=f"Error generating answer: {error_msg}")
    
    @router.delete("/session/{session_id}")
    async def delete_session(session_id: str):
        """Delete a PDF session"""
        if session_id in pdf_storage:
            del pdf_storage[session_id]
        
        result = await db.pdf_sessions.delete_one({"session_id": session_id})
        
        return {"message": "Session deleted", "deleted": result.deleted_count > 0}
    
    @router.get("/session/{session_id}")
    async def get_session_info(session_id: str):
        """Get information about a PDF session"""
        if session_id in pdf_storage:
            data = pdf_storage[session_id]
            return {
                "session_id": session_id,
                "filename": data["filename"],
                "num_chunks": len(data["chunks"]),
                "chat_history_length": len(data.get("chat_history", []))
            }
        
        db_session = await db.pdf_sessions.find_one(
            {"session_id": session_id},
            {"_id": 0, "chunks": 0}  # Don't return chunks
        )
        
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return db_session
    
    return router
