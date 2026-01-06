import requests
import sys
from datetime import datetime

class NeuralFlowAPITester:
    def __init__(self, base_url="https://graphml-network.preview.emergentagent.com"):
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
    
    # Test auth endpoints (unauthenticated)
    print("\n🔐 Testing Auth Endpoints (Unauthenticated)...")
    tester.test_auth_me_unauthenticated()
    tester.test_auth_session_invalid()
    tester.test_auth_logout_unauthenticated()
    tester.test_auth_models_unauthenticated()
    tester.test_save_model_unauthenticated()
    
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