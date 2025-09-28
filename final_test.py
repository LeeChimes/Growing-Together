import requests
import json
from datetime import datetime, timedelta

class FinalAPITester:
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

    def setup_admin_auth(self):
        """Setup admin authentication"""
        try:
            response = requests.post(f"{self.api_url}/auth/login", json={
                'email': 'admin@staffordallotment.com',
                'password': 'admin123'
            }, timeout=10)
            
            if response.status_code == 200:
                self.admin_token = response.json()['token']
                return True
            return False
        except:
            return False

    def test_all_endpoints(self):
        """Test all 17+ API endpoints"""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        endpoints_to_test = [
            # Authentication endpoints
            ('GET', 'auth/me', None, 'Auth Token Verification'),
            
            # Core functionality endpoints
            ('GET', 'weather', None, 'Weather API'),
            ('GET', 'plants', None, 'Plants Library'),
            ('POST', 'plants/ai-advice', {'question': 'Test AI query'}, 'AI Plant Advice'),
            
            # CRUD endpoints
            ('GET', 'diary', None, 'Get Diary Entries'),
            ('POST', 'diary', {
                'plot_number': 'TEST',
                'entry_type': 'general',
                'title': 'Final Test Entry',
                'content': 'Testing all endpoints'
            }, 'Create Diary Entry'),
            
            ('GET', 'events', None, 'Get Events'),
            ('POST', 'events', {
                'title': 'Final Test Event',
                'description': 'Testing events',
                'date': (datetime.now() + timedelta(days=1)).isoformat(),
                'location': 'Test Location'
            }, 'Create Event'),
            
            ('GET', 'posts', None, 'Get Community Posts'),
            ('POST', 'posts', {
                'content': 'Final test post',
                'photos': []
            }, 'Create Community Post'),
            
            ('GET', 'tasks', None, 'Get Tasks'),
            ('POST', 'tasks', {
                'title': 'Final Test Task',
                'description': 'Testing tasks',
                'task_type': 'site'
            }, 'Create Task'),
            
            # Admin endpoints
            ('GET', 'admin/users', None, 'Admin Get Users'),
            ('GET', 'admin/analytics', None, 'Admin Analytics'),
            ('GET', 'admin/export-data', None, 'Admin Data Export'),
        ]
        
        for method, endpoint, data, test_name in endpoints_to_test:
            try:
                url = f"{self.api_url}/{endpoint}"
                
                if method == 'GET':
                    response = requests.get(url, headers=headers, timeout=30)
                elif method == 'POST':
                    response = requests.post(url, json=data, headers=headers, timeout=30)
                else:
                    continue
                
                success = response.status_code in [200, 201]
                details = f"Status: {response.status_code}" if not success else ""
                self.log_test(test_name, success, details)
                
            except Exception as e:
                self.log_test(test_name, False, str(e))

    def test_rsvp_functionality(self):
        """Test RSVP functionality specifically"""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Get events first
        try:
            response = requests.get(f"{self.api_url}/events", headers=headers, timeout=10)
            if response.status_code == 200:
                events = response.json()
                if events:
                    event_id = events[0]['id']
                    # Test RSVP
                    rsvp_response = requests.post(f"{self.api_url}/events/{event_id}/rsvp", 
                                                headers=headers, timeout=10)
                    success = rsvp_response.status_code == 200
                    self.log_test("Event RSVP Functionality", success,
                                f"Status: {rsvp_response.status_code}" if not success else "")
                else:
                    self.log_test("Event RSVP Functionality", False, "No events available for RSVP test")
            else:
                self.log_test("Event RSVP Functionality", False, f"Could not get events: {response.status_code}")
        except Exception as e:
            self.log_test("Event RSVP Functionality", False, str(e))

    def test_task_completion(self):
        """Test task completion functionality"""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            # Get tasks first
            response = requests.get(f"{self.api_url}/tasks", headers=headers, timeout=10)
            if response.status_code == 200:
                tasks = response.json()
                incomplete_tasks = [task for task in tasks if not task.get('completed', False)]
                if incomplete_tasks:
                    task_id = incomplete_tasks[0]['id']
                    # Test task completion
                    complete_response = requests.patch(f"{self.api_url}/tasks/{task_id}/complete",
                                                     headers=headers, timeout=10)
                    success = complete_response.status_code == 200
                    self.log_test("Task Completion", success,
                                f"Status: {complete_response.status_code}" if not success else "")
                else:
                    self.log_test("Task Completion", True, "No incomplete tasks available (all completed)")
            else:
                self.log_test("Task Completion", False, f"Could not get tasks: {response.status_code}")
        except Exception as e:
            self.log_test("Task Completion", False, str(e))

    def run_final_tests(self):
        """Run final comprehensive tests"""
        print("🚀 Final Comprehensive Growing Together API Tests")
        print("=" * 60)
        
        # Setup authentication
        if not self.setup_admin_auth():
            print("❌ Failed to authenticate as admin. Stopping tests.")
            return False
        
        print("✅ Admin authentication successful")
        print("-" * 60)
        
        # Test all endpoints
        self.test_all_endpoints()
        
        # Test specific functionality
        self.test_rsvp_functionality()
        self.test_task_completion()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Final Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 90

def main():
    tester = FinalAPITester()
    success = tester.run_final_tests()
    return 0 if success else 1

if __name__ == "__main__":
    main()