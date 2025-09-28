import requests
import sys
import json
from datetime import datetime, timedelta

class GrowingTogetherAPITester:
    def __init__(self, base_url="https://harvest-hub-64.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.admin_id = None
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

    def make_request(self, method, endpoint, data=None, use_admin=False):
        """Make API request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Use admin token if specified and available
        token = self.admin_token if use_admin and self.admin_token else self.token
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            else:
                return None, f"Unsupported method: {method}"

            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)

    def test_health_check(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, str(e))
            return False

    def test_admin_login(self):
        """Test admin login"""
        response, error = self.make_request('POST', 'auth/login', {
            'email': 'admin@staffordallotment.com',
            'password': 'admin123'
        })
        
        if error:
            self.log_test("Admin Login", False, error)
            return False
        
        success = response.status_code == 200
        if success:
            data = response.json()
            self.admin_token = data.get('token')
            self.admin_id = data.get('user', {}).get('id')
            self.log_test("Admin Login", True)
        else:
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_test("Admin Login", False, details)
        
        return success

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            'email': f'test_user_{datetime.now().strftime("%H%M%S")}@example.com',
            'username': f'TestUser{datetime.now().strftime("%H%M%S")}',
            'password': 'testpass123',
            'join_code': 'GROW2024',
            'plot_number': '15B'
        }
        
        response, error = self.make_request('POST', 'auth/register', test_user_data)
        
        if error:
            self.log_test("User Registration", False, error)
            return False
        
        success = response.status_code == 200
        details = f"Status: {response.status_code}" if not success else ""
        self.log_test("User Registration", success, details)
        return success

    def test_weather_api(self):
        """Test weather endpoint"""
        response, error = self.make_request('GET', 'weather')
        
        if error:
            self.log_test("Weather API", False, error)
            return False
        
        success = response.status_code == 200
        if success:
            data = response.json()
            has_required_fields = all(key in data for key in ['location', 'current', 'forecast'])
            success = has_required_fields
            details = "Missing required fields" if not has_required_fields else ""
        else:
            details = f"Status: {response.status_code}"
        
        self.log_test("Weather API", success, details)
        return success

    def test_diary_operations(self):
        """Test diary CRUD operations"""
        if not self.admin_token:
            self.log_test("Diary Operations", False, "No admin token available")
            return False
        
        # Test create diary entry
        diary_data = {
            'plot_number': '15B',
            'entry_type': 'sowing',
            'title': 'Test Diary Entry',
            'content': 'Testing diary functionality',
            'tags': ['test', 'automation']
        }
        
        response, error = self.make_request('POST', 'diary', diary_data, use_admin=True)
        
        if error:
            self.log_test("Create Diary Entry", False, error)
            return False
        
        create_success = response.status_code == 200
        self.log_test("Create Diary Entry", create_success, 
                     f"Status: {response.status_code}" if not create_success else "")
        
        # Test get diary entries
        response, error = self.make_request('GET', 'diary', use_admin=True)
        
        if error:
            self.log_test("Get Diary Entries", False, error)
            return False
        
        get_success = response.status_code == 200
        self.log_test("Get Diary Entries", get_success,
                     f"Status: {response.status_code}" if not get_success else "")
        
        return create_success and get_success

    def test_events_operations(self):
        """Test events CRUD operations"""
        if not self.admin_token:
            self.log_test("Events Operations", False, "No admin token available")
            return False
        
        # Test create event
        event_data = {
            'title': 'Test Community Event',
            'description': 'Testing event functionality',
            'date': (datetime.now() + timedelta(days=7)).isoformat(),
            'location': 'Community Garden',
            'bring_list': ['tools', 'water']
        }
        
        response, error = self.make_request('POST', 'events', event_data, use_admin=True)
        
        if error:
            self.log_test("Create Event", False, error)
            return False
        
        create_success = response.status_code == 200
        event_id = None
        if create_success:
            event_id = response.json().get('id')
        
        self.log_test("Create Event", create_success,
                     f"Status: {response.status_code}" if not create_success else "")
        
        # Test get events
        response, error = self.make_request('GET', 'events', use_admin=True)
        
        if error:
            self.log_test("Get Events", False, error)
            return False
        
        get_success = response.status_code == 200
        self.log_test("Get Events", get_success,
                     f"Status: {response.status_code}" if not get_success else "")
        
        # Test RSVP if event was created
        if event_id:
            response, error = self.make_request('POST', f'events/{event_id}/rsvp', use_admin=True)
            rsvp_success = response and response.status_code == 200
            self.log_test("Event RSVP", rsvp_success,
                         f"Status: {response.status_code if response else 'No response'}" if not rsvp_success else "")
        
        return create_success and get_success

    def test_community_posts(self):
        """Test community posts operations"""
        if not self.admin_token:
            self.log_test("Community Posts", False, "No admin token available")
            return False
        
        # Test create post
        post_data = {
            'content': 'Test community post for API testing',
            'photos': []
        }
        
        response, error = self.make_request('POST', 'posts', post_data, use_admin=True)
        
        if error:
            self.log_test("Create Community Post", False, error)
            return False
        
        create_success = response.status_code == 200
        self.log_test("Create Community Post", create_success,
                     f"Status: {response.status_code}" if not create_success else "")
        
        # Test get posts
        response, error = self.make_request('GET', 'posts', use_admin=True)
        
        if error:
            self.log_test("Get Community Posts", False, error)
            return False
        
        get_success = response.status_code == 200
        self.log_test("Get Community Posts", get_success,
                     f"Status: {response.status_code}" if not get_success else "")
        
        return create_success and get_success

    def test_tasks_operations(self):
        """Test tasks operations"""
        if not self.admin_token:
            self.log_test("Tasks Operations", False, "No admin token available")
            return False
        
        # Test create task
        task_data = {
            'title': 'Test Task',
            'description': 'Testing task functionality',
            'task_type': 'site',
            'due_date': (datetime.now() + timedelta(days=3)).isoformat()
        }
        
        response, error = self.make_request('POST', 'tasks', task_data, use_admin=True)
        
        if error:
            self.log_test("Create Task", False, error)
            return False
        
        create_success = response.status_code == 200
        task_id = None
        if create_success:
            task_id = response.json().get('id')
        
        self.log_test("Create Task", create_success,
                     f"Status: {response.status_code}" if not create_success else "")
        
        # Test get tasks
        response, error = self.make_request('GET', 'tasks', use_admin=True)
        
        if error:
            self.log_test("Get Tasks", False, error)
            return False
        
        get_success = response.status_code == 200
        self.log_test("Get Tasks", get_success,
                     f"Status: {response.status_code}" if not get_success else "")
        
        # Test complete task if task was created
        if task_id:
            response, error = self.make_request('PATCH', f'tasks/{task_id}/complete', use_admin=True)
            complete_success = response and response.status_code == 200
            self.log_test("Complete Task", complete_success,
                         f"Status: {response.status_code if response else 'No response'}" if not complete_success else "")
        
        return create_success and get_success

    def test_plants_library(self):
        """Test plants library"""
        if not self.admin_token:
            self.log_test("Plants Library", False, "No admin token available")
            return False
        
        # Test get plants
        response, error = self.make_request('GET', 'plants', use_admin=True)
        
        if error:
            self.log_test("Get Plants", False, error)
            return False
        
        success = response.status_code == 200
        self.log_test("Get Plants", success,
                     f"Status: {response.status_code}" if not success else "")
        
        return success

    def test_ai_plant_advice(self):
        """Test AI plant advice"""
        if not self.admin_token:
            self.log_test("AI Plant Advice", False, "No admin token available")
            return False
        
        # Test AI advice request
        ai_query = {
            'plant_name': 'Tomatoes',
            'question': 'My tomato leaves are turning yellow, what should I do?'
        }
        
        response, error = self.make_request('POST', 'plants/ai-advice', ai_query, use_admin=True)
        
        if error:
            self.log_test("AI Plant Advice", False, error)
            return False
        
        success = response.status_code == 200
        if success:
            data = response.json()
            has_advice = 'advice' in data
            success = has_advice
            details = "Missing advice field" if not has_advice else ""
        else:
            details = f"Status: {response.status_code}"
        
        self.log_test("AI Plant Advice", success, details)
        return success

    def test_admin_operations(self):
        """Test admin-specific operations"""
        if not self.admin_token:
            self.log_test("Admin Operations", False, "No admin token available")
            return False
        
        # Test get pending users
        response, error = self.make_request('GET', 'admin/users', use_admin=True)
        
        if error:
            self.log_test("Get Pending Users", False, error)
            return False
        
        success = response.status_code == 200
        self.log_test("Get Pending Users", success,
                     f"Status: {response.status_code}" if not success else "")
        
        return success

    def test_plot_inspections_system(self):
        """Test Plot Inspections System endpoints"""
        if not self.admin_token:
            self.log_test("Plot Inspections System", False, "No admin token available")
            return False
        
        all_tests_passed = True
        
        # Test 1: Get all plots
        response, error = self.make_request('GET', 'plots', use_admin=True)
        if error:
            self.log_test("Get Plots", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Get Plots", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
            else:
                plots_data = response.json()
                print(f"   Found {len(plots_data)} plots")
        
        # Test 2: Get all inspections (admin only)
        response, error = self.make_request('GET', 'inspections', use_admin=True)
        if error:
            self.log_test("Get Inspections (Admin)", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Get Inspections (Admin)", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
        
        # Test 3: Create inspection (admin only)
        inspection_data = {
            'plot_id': 'test-plot-id',  # Will use first available plot if exists
            'use_status': 'active',
            'upkeep': 'good',
            'issues': ['weeds', 'watering'],
            'notes': 'Test inspection created by automated testing',
            'photos': [],
            'action': 'advisory',
            'reinspect_by': (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        # Get a real plot ID if available
        response, error = self.make_request('GET', 'plots', use_admin=True)
        if response and response.status_code == 200:
            plots = response.json()
            if plots:
                inspection_data['plot_id'] = plots[0]['id']
        
        response, error = self.make_request('POST', 'inspections', inspection_data, use_admin=True)
        if error:
            self.log_test("Create Inspection", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Create Inspection", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
        
        # Test 4: Get user's plot inspections
        response, error = self.make_request('GET', 'inspections/my-plot', use_admin=True)
        if error:
            self.log_test("Get My Plot Inspections", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Get My Plot Inspections", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
        
        # Test 5: Get member notices
        response, error = self.make_request('GET', 'member-notices', use_admin=True)
        if error:
            self.log_test("Get Member Notices", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Get Member Notices", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
        
        return all_tests_passed

    def test_rules_system(self):
        """Test Rules System endpoints"""
        if not self.admin_token:
            self.log_test("Rules System", False, "No admin token available")
            return False
        
        all_tests_passed = True
        
        # Test 1: Get active rules (public endpoint)
        response, error = self.make_request('GET', 'rules')
        if error:
            self.log_test("Get Active Rules", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Get Active Rules", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
            else:
                rules_data = response.json()
                print(f"   Active rules version: {rules_data.get('version', 'N/A')}")
        
        # Test 2: Create new rules version (admin only)
        rules_data = {
            'version': f'test-v{datetime.now().strftime("%H%M%S")}',
            'markdown': '# Test Rules\n\n## Section 1\nTest rule content for automated testing.',
            'summary': 'Test rules created by automated testing'
        }
        
        response, error = self.make_request('POST', 'rules', rules_data, use_admin=True)
        if error:
            self.log_test("Create Rules", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Create Rules", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
            else:
                created_rules = response.json()
                rule_id = created_rules.get('id')
                
                # Test 3: Acknowledge rules
                if rule_id:
                    ack_data = {'rule_id': rule_id}
                    response, error = self.make_request('POST', 'rules/acknowledge', ack_data, use_admin=True)
                    if error:
                        self.log_test("Acknowledge Rules", False, error)
                        all_tests_passed = False
                    else:
                        success = response.status_code == 200
                        self.log_test("Acknowledge Rules", success, f"Status: {response.status_code}" if not success else "")
                        if not success:
                            all_tests_passed = False
        
        # Test 4: Get rule acknowledgements (admin only)
        response, error = self.make_request('GET', 'rules/acknowledgements', use_admin=True)
        if error:
            self.log_test("Get Rule Acknowledgements", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Get Rule Acknowledgements", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
        
        # Test 5: Get user's rule acknowledgement
        response, error = self.make_request('GET', 'rules/my-acknowledgement?rule_id=test-rule-id', use_admin=True)
        if error:
            self.log_test("Get My Rule Acknowledgement", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Get My Rule Acknowledgement", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
        
        return all_tests_passed

    def test_documents_system(self):
        """Test Documents System endpoints"""
        if not self.admin_token:
            self.log_test("Documents System", False, "No admin token available")
            return False
        
        all_tests_passed = True
        
        # Test 1: Get user's documents
        response, error = self.make_request('GET', 'documents', use_admin=True)
        if error:
            self.log_test("Get User Documents", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Get User Documents", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
        
        # Test 2: Upload document
        document_data = {
            'title': 'Test Document',
            'type': 'contract',
            'file_name': 'test_contract.pdf',
            'file_size': 1024,
            'mime_type': 'application/pdf',
            'expires_at': (datetime.now() + timedelta(days=365)).isoformat()
        }
        
        response, error = self.make_request('POST', 'documents/upload', document_data, use_admin=True)
        if error:
            self.log_test("Upload Document", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Upload Document", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
            else:
                uploaded_doc = response.json()
                document_id = uploaded_doc.get('id')
                
                # Test 4: Delete document (if upload was successful)
                if document_id:
                    response, error = self.make_request('DELETE', f'documents/{document_id}', use_admin=True)
                    if error:
                        self.log_test("Delete Document", False, error)
                        all_tests_passed = False
                    else:
                        success = response.status_code == 200
                        self.log_test("Delete Document", success, f"Status: {response.status_code}" if not success else "")
                        if not success:
                            all_tests_passed = False
        
        # Test 3: Get all users' documents (admin only)
        response, error = self.make_request('GET', 'admin/documents', use_admin=True)
        if error:
            self.log_test("Get All User Documents (Admin)", False, error)
            all_tests_passed = False
        else:
            success = response.status_code == 200
            self.log_test("Get All User Documents (Admin)", success, f"Status: {response.status_code}" if not success else "")
            if not success:
                all_tests_passed = False
        
        return all_tests_passed

    def make_request(self, method, endpoint, data=None, use_admin=False):
        """Make API request with proper headers - enhanced for DELETE method"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Use admin token if specified and available
        token = self.admin_token if use_admin and self.admin_token else self.token
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return None, f"Unsupported method: {method}"

            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Growing Together API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Authentication tests
        if not self.test_admin_login():
            print("❌ Admin login failed. Some tests will be skipped.")
        
        self.test_user_registration()
        
        # Core functionality tests
        self.test_weather_api()
        self.test_diary_operations()
        self.test_events_operations()
        self.test_community_posts()
        self.test_tasks_operations()
        self.test_plants_library()
        self.test_ai_plant_advice()
        self.test_admin_operations()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ success rate as passing

def main():
    tester = GrowingTogetherAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())