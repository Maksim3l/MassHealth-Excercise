import requests
import json
import base64
import time
from typing import Dict, List, Optional, Any
from PIL import Image
import io
import os

class APITester:
    def __init__(self, base_url: str = "http://localhost:9002"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, passed: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not passed:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "response": response_data
        })
    
    def create_test_image(self, size: tuple = (160, 160), color: tuple = (255, 0, 0)) -> str:
        """Create a test image and return as base64 string"""
        img = Image.new('RGB', size, color)
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"
    
    def test_health_endpoint(self):
        """Test the /health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['status', 'model_loaded', 'model_type', 'device']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get('status') == 'healthy':
                    self.log_test("Health Check", True, f"Model loaded: {data.get('model_loaded')}, Device: {data.get('device')}")
                else:
                    self.log_test("Health Check", False, f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
    
    def test_model_info_endpoint(self):
        """Test the /model_info endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/model_info", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['model_loaded', 'model_type', 'total_parameters', 'embedding_size']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Model Info", True, 
                                f"Type: {data.get('model_type')}, Params: {data.get('total_parameters')}")
                else:
                    self.log_test("Model Info", False, f"Missing fields: {missing_fields}", data)
            elif response.status_code == 503:
                self.log_test("Model Info", False, "Model not loaded (503)", response.json())
            else:
                self.log_test("Model Info", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Model Info", False, f"Exception: {str(e)}")
    
    def test_compare_endpoint(self):
        """Test the /compare endpoint"""
        try:
            # Test with valid data
            img1 = self.create_test_image((160, 160), (255, 0, 0))  # Red image
            img2 = self.create_test_image((160, 160), (0, 255, 0))  # Green image
            
            payload = {
                "image1": img1,
                "image2": img2,
                "threshold": 0.6
            }
            
            response = self.session.post(f"{self.base_url}/compare", 
                                       json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['match', 'similarity_score', 'confidence', 'model_type']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Compare Faces", True, 
                                f"Match: {data.get('match')}, Score: {data.get('similarity_score'):.3f}")
                else:
                    self.log_test("Compare Faces", False, f"Missing fields: {missing_fields}", data)
            elif response.status_code == 503:
                self.log_test("Compare Faces", False, "Model not loaded (503)", response.json())
            else:
                self.log_test("Compare Faces", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Compare Faces", False, f"Exception: {str(e)}")
    
    def test_compare_invalid_data(self):
        """Test /compare endpoint with invalid data"""
        try:
            # Test missing image1
            payload = {"image2": self.create_test_image()}
            response = self.session.post(f"{self.base_url}/compare", json=payload, timeout=10)
            
            if response.status_code == 400:
                self.log_test("Compare Invalid Data", True, "Correctly rejected missing image1")
            else:
                self.log_test("Compare Invalid Data", False, 
                            f"Expected 400, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Compare Invalid Data", False, f"Exception: {str(e)}")
    
    def test_batch_compare_endpoint(self):
        """Test the /batch_compare endpoint"""
        try:
            img1 = self.create_test_image((160, 160), (255, 0, 0))
            img2 = self.create_test_image((160, 160), (0, 255, 0))
            img3 = self.create_test_image((160, 160), (0, 0, 255))
            
            payload = {
                "pairs": [
                    {"image1": img1, "image2": img2},
                    {"image1": img2, "image2": img3},
                    {"image1": img1, "image2": img3}
                ],
                "threshold": 0.6
            }
            
            response = self.session.post(f"{self.base_url}/batch_compare", 
                                       json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['matches', 'detailed_results', 'total_pairs', 'successful_pairs']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and len(data['matches']) == 3:
                    self.log_test("Batch Compare", True, 
                                f"Processed {data.get('total_pairs')} pairs, "
                                f"Successful: {data.get('successful_pairs')}")
                else:
                    self.log_test("Batch Compare", False, f"Missing fields or wrong count: {missing_fields}", data)
            elif response.status_code == 503:
                self.log_test("Batch Compare", False, "Model not loaded (503)", response.json())
            else:
                self.log_test("Batch Compare", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Batch Compare", False, f"Exception: {str(e)}")
    
     
    def test_verify_user_endpoint(self):
        """Test the /verify_user endpoint (will likely fail without proper setup)"""
        try:
            img1 = self.create_test_image((160, 160), (255, 0, 0))
            
            payload = {
                "userId": "test_user_123",
                "images": [img1],
                "threshold": 0.6,
                "min_verification_images": 1,
                "max_verification_images": 5
            }
            
            response = self.session.post(f"{self.base_url}/verify_user", 
                                       json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Verify User", True, f"User verification completed")
            elif response.status_code == 404:
                self.log_test("Verify User", True, 
                            "Expected failure - no verification images found (404)")
            elif response.status_code == 503:
                self.log_test("Verify User", False, "Service unavailable (503)", response.json())
            else:
                self.log_test("Verify User", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Verify User", False, f"Exception: {str(e)}")
    
    def test_performance(self):
        """Test API response times"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/health", timeout=5)
            health_time = time.time() - start_time
            
            if response.status_code == 200:
                if health_time < 2.0:
                    self.log_test("Performance - Health", True, f"Response time: {health_time:.3f}s")
                else:
                    self.log_test("Performance - Health", False, f"Slow response: {health_time:.3f}s")
            else:
                self.log_test("Performance - Health", False, "Health check failed")
            
            # Test compare performance
            img1 = self.create_test_image()
            img2 = self.create_test_image()
            payload = {"image1": img1, "image2": img2}
            
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/compare", json=payload, timeout=30)
            compare_time = time.time() - start_time
            
            if response.status_code == 200:
                if compare_time < 10.0:
                    self.log_test("Performance - Compare", True, f"Response time: {compare_time:.3f}s")
                else:
                    self.log_test("Performance - Compare", False, f"Slow response: {compare_time:.3f}s")
            else:
                self.log_test("Performance - Compare", False, "Compare failed")
                
        except Exception as e:
            self.log_test("Performance Tests", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("=" * 60)
        print("FACE VERIFICATION API TEST SUITE")
        print("=" * 60)
        print(f"Testing API at: {self.base_url}")
        print()
        
        # Basic connectivity and health tests
        print("🔍 BASIC CONNECTIVITY TESTS")
        print("-" * 30)
        self.test_health_endpoint()
        self.test_model_info_endpoint()
        
        # Core functionality tests
        print("🧠 CORE FUNCTIONALITY TESTS")
        print("-" * 30)
        self.test_compare_endpoint()
        self.test_batch_compare_endpoint()
        
        # Error handling tests
        print("⚠️  ERROR HANDLING TESTS")
        print("-" * 30)
        self.test_compare_invalid_data()
        
        # Integration tests (may fail without proper setup)
        print("🔗 INTEGRATION TESTS")
        print("-" * 30)
        #self.test_verify_user_endpoint()
        
        # Performance tests
        print("⚡ PERFORMANCE TESTS")
        print("-" * 30)
        self.test_performance()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['passed'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        if total - passed > 0:
            print("FAILED TESTS:")
            for result in self.test_results:
                if not result['passed']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)

def main():
    """Main function to run tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Face Verification API')
    parser.add_argument('--url', default='http://localhost:9002', 
                       help='Base URL of the API (default: http://localhost:9002)')
    parser.add_argument('--test', choices=['health', 'compare', 'batch', 'verify', 'all'],
                       default='all', help='Specific test to run')
    
    args = parser.parse_args()
    
    tester = APITester(args.url)
    
    if args.test == 'all':
        tester.run_all_tests()
    elif args.test == 'health':
        tester.test_health_endpoint()
        tester.print_summary()
    elif args.test == 'compare':
        tester.test_compare_endpoint()
        tester.test_direct_compare_endpoint()
        tester.print_summary()
    elif args.test == 'batch':
        tester.test_batch_compare_endpoint()
        tester.print_summary()
    elif args.test == 'verify':
        tester.test_verify_user_endpoint()
        tester.print_summary()

if __name__ == "__main__":
    main()
