import requests
import sys
import json
from datetime import datetime, timedelta
import base64

class ComprehensiveAPITester:
    def __init__(self, base_url="https://garden-connect-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def make_request(self, method, endpoint, data=None):
        """Make API request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=15)
            else:
                return None, f"Unsupported method: {method}"

            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)

    def setup_admin_auth(self):
        """Setup admin authentication"""
        response, error = self.make_request('POST', 'auth/login', {
            'email': 'admin@staffordallotment.com',
            'password': 'admin123'
        })
        
        if error or response.status_code != 200:
            return False
        
        data = response.json()
        self.admin_token = data.get('token')
        return True

    def test_auth_token_verification(self):
        """Test token verification endpoint"""
        response, error = self.make_request('GET', 'auth/me')
        
        if error:
            self.log_test("Auth Token Verification", False, error)
            return False
        
        success = response.status_code == 200
        if success:
            data = response.json()
            has_required_fields = all(key in data for key in ['id', 'email', 'username', 'role'])
            success = has_required_fields
            details = "Missing required user fields" if not has_required_fields else ""
        else:
            details = f"Status: {response.status_code}, Response: {response.text}"
        
        self.log_test("Auth Token Verification", success, details)
        return success

    def test_enhanced_ai_integration(self):
        """Test enhanced AI integration with emergentintegrations library"""
        # Test 1: Basic AI query
        ai_query = {
            'plant_name': 'Tomatoes',
            'question': 'My tomato plants have yellowing leaves and brown spots. What could be causing this?'
        }
        
        response, error = self.make_request('POST', 'plants/ai-advice', ai_query)
        
        if error:
            self.log_test("Enhanced AI Integration - Basic Query", False, error)
            return False
        
        success = response.status_code == 200
        if success:
            data = response.json()
            required_fields = ['advice', 'can_save_as_task', 'suggested_actions']
            has_required_fields = all(key in data for key in required_fields)
            has_meaningful_advice = len(data.get('advice', '')) > 50  # Should have substantial advice
            success = has_required_fields and has_meaningful_advice
            details = "Missing required fields or insufficient advice content" if not success else ""
        else:
            details = f"Status: {response.status_code}, Response: {response.text}"
        
        self.log_test("Enhanced AI Integration - Basic Query", success, details)
        
        # Test 2: AI query without plant name
        general_query = {
            'question': 'What are the best companion plants for a vegetable garden?'
        }
        
        response, error = self.make_request('POST', 'plants/ai-advice', general_query)
        
        if error:
            self.log_test("Enhanced AI Integration - General Query", False, error)
            return False
        
        success = response.status_code == 200
        if success:
            data = response.json()
            has_advice = 'advice' in data and len(data['advice']) > 20
            success = has_advice
            details = "No meaningful advice provided" if not has_advice else ""
        else:
            details = f"Status: {response.status_code}"
        
        self.log_test("Enhanced AI Integration - General Query", success, details)
        
        # Test 3: AI query with image (base64 encoded test image)
        # Create a small test image in base64
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        image_query = {
            'plant_name': 'Unknown Plant',
            'question': 'Can you identify this plant and tell me what might be wrong with it?',
            'photo_base64': test_image_b64
        }
        
        response, error = self.make_request('POST', 'plants/ai-advice', image_query)
        
        if error:
            self.log_test("Enhanced AI Integration - Image Query", False, error)
            return False
        
        success = response.status_code == 200
        if success:
            data = response.json()
            has_advice = 'advice' in data and len(data['advice']) > 20
            success = has_advice
            details = "No meaningful advice for image query" if not has_advice else ""
        else:
            details = f"Status: {response.status_code}"
        
        self.log_test("Enhanced AI Integration - Image Query", success, details)
        
        return True

    def test_admin_analytics(self):
        """Test admin analytics endpoint"""
        response, error = self.make_request('GET', 'admin/analytics')
        
        if error:
            self.log_test("Admin Analytics", False, error)
            return False
        
        success = response.status_code == 200
        if success:
            data = response.json()
            required_sections = ['users', 'content', 'activity', 'monthly_stats']
            has_required_sections = all(section in data for section in required_sections)
            
            # Check users section
            users_valid = all(key in data.get('users', {}) for key in ['total', 'active', 'pending'])
            
            # Check content section
            content_valid = all(key in data.get('content', {}) for key in ['diary_entries', 'events', 'posts', 'tasks', 'completed_tasks'])
            
            # Check activity section
            activity_valid = all(key in data.get('activity', {}) for key in ['recent_entries', 'recent_posts', 'active_plots'])
            
            success = has_required_sections and users_valid and content_valid and activity_valid
            details = "Missing required analytics data structure" if not success else ""
        else:
            details = f"Status: {response.status_code}, Response: {response.text}"
        
        self.log_test("Admin Analytics", success, details)
        return success

    def test_admin_data_export(self):
        """Test admin data export functionality"""
        response, error = self.make_request('GET', 'admin/export-data')
        
        if error:
            self.log_test("Admin Data Export", False, error)
            return False
        
        success = response.status_code == 200
        if success:
            data = response.json()
            required_sections = ['export_date', 'users', 'diary_entries', 'events', 'posts', 'tasks']
            has_required_sections = all(section in data for section in required_sections)
            has_export_date = 'export_date' in data and data['export_date']
            success = has_required_sections and has_export_date
            details = "Missing required export data sections" if not success else ""
        else:
            details = f"Status: {response.status_code}, Response: {response.text}"
        
        self.log_test("Admin Data Export", success, details)
        return success

    def test_error_handling(self):
        """Test error handling for various scenarios"""
        # Test 1: Invalid endpoint
        response, error = self.make_request('GET', 'invalid/endpoint')
        success = response and response.status_code == 404
        self.log_test("Error Handling - Invalid Endpoint", success, 
                     f"Expected 404, got {response.status_code if response else 'No response'}")
        
        # Test 2: Invalid authentication
        old_token = self.admin_token
        self.admin_token = "invalid_token"
        response, error = self.make_request('GET', 'auth/me')
        auth_error_success = response and response.status_code == 401
        self.log_test("Error Handling - Invalid Token", auth_error_success,
                     f"Expected 401, got {response.status_code if response else 'No response'}")
        self.admin_token = old_token
        
        # Test 3: Missing required fields
        response, error = self.make_request('POST', 'diary', {})
        validation_error_success = response and response.status_code in [400, 422]
        self.log_test("Error Handling - Validation Error", validation_error_success,
                     f"Expected 400/422, got {response.status_code if response else 'No response'}")
        
        return success and auth_error_success and validation_error_success

    def test_data_integrity(self):
        """Test data integrity across operations"""
        # Create a diary entry and verify it appears in listings
        diary_data = {
            'plot_number': 'TEST_PLOT',
            'entry_type': 'maintenance',
            'title': 'Data Integrity Test Entry',
            'content': 'Testing data consistency across operations',
            'tags': ['test', 'integrity']
        }
        
        # Create entry
        response, error = self.make_request('POST', 'diary', diary_data)
        if error or response.status_code != 200:
            self.log_test("Data Integrity - Create Entry", False, 
                         error or f"Status: {response.status_code}")
            return False
        
        created_entry = response.json()
        entry_id = created_entry.get('id')
        
        # Verify entry appears in listings
        response, error = self.make_request('GET', 'diary')
        if error or response.status_code != 200:
            self.log_test("Data Integrity - Retrieve Entries", False,
                         error or f"Status: {response.status_code}")
            return False
        
        entries = response.json()
        entry_found = any(entry.get('id') == entry_id for entry in entries)
        
        self.log_test("Data Integrity - Entry Consistency", entry_found,
                     "Created entry not found in listings" if not entry_found else "")
        
        return entry_found

    def test_all_crud_operations(self):
        """Test all CRUD operations comprehensively"""
        operations_success = []
        
        # Test diary CRUD
        diary_data = {
            'plot_number': 'CRUD_TEST',
            'entry_type': 'general',
            'title': 'CRUD Test Entry',
            'content': 'Testing CRUD operations',
            'tags': ['crud', 'test']
        }
        
        response, error = self.make_request('POST', 'diary', diary_data)
        diary_create = response and response.status_code == 200
        operations_success.append(diary_create)
        self.log_test("CRUD - Diary Create", diary_create)
        
        response, error = self.make_request('GET', 'diary')
        diary_read = response and response.status_code == 200
        operations_success.append(diary_read)
        self.log_test("CRUD - Diary Read", diary_read)
        
        # Test events CRUD
        event_data = {
            'title': 'CRUD Test Event',
            'description': 'Testing event CRUD',
            'date': (datetime.now() + timedelta(days=5)).isoformat(),
            'location': 'Test Location'
        }
        
        response, error = self.make_request('POST', 'events', event_data)
        event_create = response and response.status_code == 200
        operations_success.append(event_create)
        self.log_test("CRUD - Event Create", event_create)
        
        response, error = self.make_request('GET', 'events')
        event_read = response and response.status_code == 200
        operations_success.append(event_read)
        self.log_test("CRUD - Event Read", event_read)
        
        # Test posts CRUD
        post_data = {
            'content': 'CRUD test post content',
            'photos': []
        }
        
        response, error = self.make_request('POST', 'posts', post_data)
        post_create = response and response.status_code == 200
        operations_success.append(post_create)
        self.log_test("CRUD - Post Create", post_create)
        
        response, error = self.make_request('GET', 'posts')
        post_read = response and response.status_code == 200
        operations_success.append(post_read)
        self.log_test("CRUD - Post Read", post_read)
        
        # Test tasks CRUD
        task_data = {
            'title': 'CRUD Test Task',
            'description': 'Testing task CRUD',
            'task_type': 'site'
        }
        
        response, error = self.make_request('POST', 'tasks', task_data)
        task_create = response and response.status_code == 200
        operations_success.append(task_create)
        self.log_test("CRUD - Task Create", task_create)
        
        response, error = self.make_request('GET', 'tasks')
        task_read = response and response.status_code == 200
        operations_success.append(task_read)
        self.log_test("CRUD - Task Read", task_read)
        
        return all(operations_success)

    def run_comprehensive_tests(self):
        """Run all comprehensive tests"""
        print("🚀 Starting Comprehensive Growing Together API Tests")
        print("=" * 60)
        
        # Setup authentication
        if not self.setup_admin_auth():
            print("❌ Failed to authenticate as admin. Stopping tests.")
            return False
        
        print("✅ Admin authentication successful")
        print("-" * 60)
        
        # Run comprehensive tests
        self.test_auth_token_verification()
        self.test_enhanced_ai_integration()
        self.test_admin_analytics()
        self.test_admin_data_export()
        self.test_error_handling()
        self.test_data_integrity()
        self.test_all_crud_operations()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Comprehensive Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 90  # Higher threshold for comprehensive tests

def main():
    tester = ComprehensiveAPITester()
    success = tester.run_comprehensive_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())