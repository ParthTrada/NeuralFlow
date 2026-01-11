import requests
import sys
import io
import os
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

class NeuralFlowAPITester:
    def __init__(self, base_url="https://model-dataset-sync.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {str(response_data)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        return self.run_test("Health Check", "GET", "", 200)

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_validate_network(self):
        """Test network validation endpoint"""
        test_network = {
            "layers": [
                {
                    "id": "layer1",
                    "data": {
                        "layerType": "Input",
                        "config": {"inputShape": [784]}
                    }
                },
                {
                    "id": "layer2", 
                    "data": {
                        "layerType": "Dense",
                        "config": {"units": 128}
                    }
                }
            ],
            "edges": [
                {"source": "layer1", "target": "layer2"}
            ]
        }
        return self.run_test("Network Validation", "POST", "validate", 200, test_network)

    def test_generate_code(self):
        """Test code generation endpoint"""
        test_network = {
            "layers": [
                {
                    "id": "layer1",
                    "data": {
                        "layerType": "Dense",
                        "config": {"units": 64}
                    }
                }
            ],
            "edges": []
        }
        return self.run_test("Code Generation", "POST", "generate-code", 200, test_network)

    def test_auth_me_unauthenticated(self):
        """Test /auth/me endpoint without authentication"""
        return self.run_test("Auth Me (Unauthenticated)", "GET", "auth/me", 401)

    def test_auth_session_invalid(self):
        """Test /auth/session with invalid session_id"""
        invalid_session = {"session_id": "invalid_session_123"}
        return self.run_test("Auth Session (Invalid)", "POST", "auth/session", 401, invalid_session)

    def test_auth_logout_unauthenticated(self):
        """Test logout without authentication"""
        return self.run_test("Auth Logout (Unauthenticated)", "POST", "auth/logout", 200)

    def test_auth_models_unauthenticated(self):
        """Test get models without authentication"""
        return self.run_test("Get Models (Unauthenticated)", "GET", "auth/models", 401)

    def test_save_model_unauthenticated(self):
        """Test save model without authentication"""
        test_model = {
            "name": "Test Model",
            "nodes": [],
            "edges": []
        }
        return self.run_test("Save Model (Unauthenticated)", "POST", "auth/models", 401, test_model)

    def test_share_model_unauthenticated(self):
        """Test share model without authentication"""
        return self.run_test("Share Model (Unauthenticated)", "POST", "auth/models/test_id/share", 401)

    def test_get_shared_model_invalid_token(self):
        """Test get shared model with invalid token"""
        return self.run_test("Get Shared Model (Invalid Token)", "GET", "auth/shared/invalid_token", 404)

    def test_get_model_versions_unauthenticated(self):
        """Test get model versions without authentication"""
        return self.run_test("Get Model Versions (Unauthenticated)", "GET", "auth/models/test_id/versions", 401)

    def test_revoke_share_unauthenticated(self):
        """Test revoke share without authentication"""
        return self.run_test("Revoke Share (Unauthenticated)", "DELETE", "auth/models/test_id/share", 401)

    def create_test_pdf(self):
        """Create a simple test PDF for testing"""
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Add some test content
        p.drawString(100, 750, "Test Document for PDF Q&A")
        p.drawString(100, 720, "This is a sample document about artificial intelligence.")
        p.drawString(100, 690, "Machine learning is a subset of AI that focuses on algorithms.")
        p.drawString(100, 660, "Neural networks are inspired by biological neural networks.")
        p.drawString(100, 630, "Deep learning uses multiple layers to model data.")
        p.drawString(100, 600, "Natural language processing helps computers understand text.")
        p.drawString(100, 570, "Computer vision enables machines to interpret visual information.")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return buffer.getvalue()

    def run_multipart_test(self, name, endpoint, files=None, data=None, expected_status=200):
        """Run a test with multipart form data (for file uploads)"""
        url = f"{self.base_url}/api/{endpoint}"
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, files=files, data=data, timeout=30)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {str(response_data)[:200]}...")
                    return success, response_data
                except:
                    print(f"   Response: {response.text[:200]}...")
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_pdf_upload_success(self):
        """Test successful PDF upload"""
        pdf_content = self.create_test_pdf()
        
        files = {
            'file': ('test_document.pdf', pdf_content, 'application/pdf')
        }
        data = {
            'session_id': 'test_session_123'
        }
        
        success, response = self.run_multipart_test(
            "PDF Upload (Success)", 
            "pdf-qa/upload", 
            files=files, 
            data=data, 
            expected_status=200
        )
        
        if success and response:
            # Verify response structure
            required_fields = ['session_id', 'filename', 'num_chunks', 'message']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing required field: {field}")
                    return False, {}
            
            if response['session_id'] != 'test_session_123':
                print(f"❌ Session ID mismatch: expected 'test_session_123', got '{response['session_id']}'")
                return False, {}
                
            if response['num_chunks'] <= 0:
                print(f"❌ Invalid chunk count: {response['num_chunks']}")
                return False, {}
                
            print(f"   ✅ PDF processed into {response['num_chunks']} chunks")
        
        return success, response

    def test_pdf_upload_invalid_file(self):
        """Test PDF upload with non-PDF file"""
        # Create a fake text file
        fake_content = b"This is not a PDF file"
        
        files = {
            'file': ('test.txt', fake_content, 'text/plain')
        }
        data = {
            'session_id': 'test_session_invalid'
        }
        
        return self.run_multipart_test(
            "PDF Upload (Invalid File)", 
            "pdf-qa/upload", 
            files=files, 
            data=data, 
            expected_status=400
        )

    def test_ask_question_success(self):
        """Test asking a question about uploaded PDF"""
        question_data = {
            "session_id": "test_session_123",
            "question": "What is this document about?"
        }
        
        success, response = self.run_test(
            "Ask Question (Success)", 
            "POST", 
            "pdf-qa/ask", 
            200, 
            question_data
        )
        
        if success and response:
            # Verify response structure
            required_fields = ['answer', 'sources', 'confidence']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing required field: {field}")
                    return False, {}
            
            if not isinstance(response['sources'], list):
                print(f"❌ Sources should be a list, got {type(response['sources'])}")
                return False, {}
                
            if not isinstance(response['confidence'], (int, float)):
                print(f"❌ Confidence should be a number, got {type(response['confidence'])}")
                return False, {}
                
            print(f"   ✅ Answer: {response['answer'][:100]}...")
            print(f"   ✅ Sources: {len(response['sources'])} found")
            print(f"   ✅ Confidence: {response['confidence']}")
        
        return success, response

    def test_ask_question_no_session(self):
        """Test asking question without uploading PDF first"""
        question_data = {
            "session_id": "nonexistent_session",
            "question": "What is this document about?"
        }
        
        return self.run_test(
            "Ask Question (No Session)", 
            "POST", 
            "pdf-qa/ask", 
            404, 
            question_data
        )

    def test_get_session_info_success(self):
        """Test getting session information"""
        return self.run_test(
            "Get Session Info (Success)", 
            "GET", 
            "pdf-qa/session/test_session_123", 
            200
        )

    def test_get_session_info_not_found(self):
        """Test getting session info for non-existent session"""
        return self.run_test(
            "Get Session Info (Not Found)", 
            "GET", 
            "pdf-qa/session/nonexistent_session", 
            404
        )

    def test_ask_followup_question(self):
        """Test asking a follow-up question to verify chat history"""
        question_data = {
            "session_id": "test_session_123",
            "question": "Tell me more about machine learning"
        }
        
        return self.run_test(
            "Ask Follow-up Question", 
            "POST", 
            "pdf-qa/ask", 
            200, 
            question_data
        )

    def test_delete_session(self):
        """Test deleting a PDF session"""
        return self.run_test(
            "Delete Session", 
            "DELETE", 
            "pdf-qa/session/test_session_123", 
            200
        )

    def test_clone_model_unauthenticated(self):
        """Test clone model without authentication"""
        return self.run_test("Clone Model (Unauthenticated)", "POST", "auth/models/test_id/clone", 401)

def main():
    print("🚀 Starting NeuralFlow API Tests...")
    print("=" * 50)
    
    tester = NeuralFlowAPITester()
    
    # Test basic API endpoints
    print("\n📋 Testing Basic API Endpoints...")
    tester.test_health_check()
    tester.test_api_root()
    tester.test_validate_network()
    tester.test_generate_code()
    
    # Test PDF Q&A endpoints
    print("\n📄 Testing PDF Q&A Endpoints...")
    
    # First upload a PDF
    upload_success, upload_response = tester.test_pdf_upload_success()
    
    if upload_success:
        # Test asking questions (only if upload succeeded)
        tester.test_ask_question_success()
        tester.test_ask_followup_question()
        tester.test_get_session_info_success()
        
        # Clean up - delete the session
        tester.test_delete_session()
    else:
        print("⚠️  Skipping question tests due to upload failure")
    
    # Test error scenarios
    print("\n🚫 Testing PDF Q&A Error Scenarios...")
    tester.test_pdf_upload_invalid_file()
    tester.test_ask_question_no_session()
    tester.test_get_session_info_not_found()
    
    # Test auth endpoints (unauthenticated)
    print("\n🔐 Testing Auth Endpoints (Unauthenticated)...")
    tester.test_auth_me_unauthenticated()
    tester.test_auth_session_invalid()
    tester.test_auth_logout_unauthenticated()
    tester.test_auth_models_unauthenticated()
    tester.test_save_model_unauthenticated()
    
    # Test new versioning and sharing endpoints (unauthenticated)
    print("\n🔄 Testing New Versioning & Sharing Endpoints (Unauthenticated)...")
    tester.test_share_model_unauthenticated()
    tester.test_get_shared_model_invalid_token()
    tester.test_get_model_versions_unauthenticated()
    tester.test_revoke_share_unauthenticated()
    tester.test_clone_model_unauthenticated()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())