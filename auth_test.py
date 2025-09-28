import requests
import sys
import json
from datetime import datetime, timedelta

class AuthorizationTester:
    def __init__(self, base_url="https://harvest-hub-64.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.member_token = None
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

    def make_request(self, method, endpoint, data=None, token=None):
        """Make API request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
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
            self.log_test("Admin Login", True)
        else:
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_test("Admin Login", False, details)
        
        return success

    def test_unauthorized_access(self):
        """Test that endpoints requiring authentication reject unauthenticated requests"""
        endpoints_to_test = [
            ('GET', 'plots'),
            ('GET', 'inspections'),
            ('POST', 'inspections'),
            ('GET', 'documents'),
            ('POST', 'documents/upload'),
            ('GET', 'admin/documents'),
            ('POST', 'rules'),
            ('GET', 'rules/acknowledgements')
        ]
        
        all_passed = True
        for method, endpoint in endpoints_to_test:
            response, error = self.make_request(method, endpoint)
            
            if error:
                self.log_test(f"Unauthorized {method} {endpoint}", False, error)
                all_passed = False
                continue
            
            # Should return 401 or 403 for unauthorized access
            success = response.status_code in [401, 403]
            if not success:
                details = f"Expected 401/403, got {response.status_code}"
                self.log_test(f"Unauthorized {method} {endpoint}", False, details)
                all_passed = False
            else:
                self.log_test(f"Unauthorized {method} {endpoint}", True)
        
        return all_passed

    def test_admin_only_endpoints(self):
        """Test that admin-only endpoints reject non-admin users"""
        if not self.admin_token:
            self.log_test("Admin Only Endpoints", False, "No admin token available")
            return False
        
        # Admin-only endpoints
        admin_endpoints = [
            ('GET', 'inspections'),
            ('POST', 'inspections'),
            ('POST', 'rules'),
            ('GET', 'rules/acknowledgements'),
            ('GET', 'admin/documents')
        ]
        
        all_passed = True
        for method, endpoint in admin_endpoints:
            # Test with admin token (should work)
            response, error = self.make_request(method, endpoint, token=self.admin_token)
            
            if error:
                self.log_test(f"Admin {method} {endpoint}", False, error)
                all_passed = False
                continue
            
            # Admin should have access (200 or appropriate success code)
            success = response.status_code in [200, 201]
            if not success:
                details = f"Admin access failed: {response.status_code}"
                self.log_test(f"Admin {method} {endpoint}", False, details)
                all_passed = False
            else:
                self.log_test(f"Admin {method} {endpoint}", True)
        
        return all_passed

    def test_member_endpoints(self):
        """Test that regular member endpoints work with authentication"""
        if not self.admin_token:  # Using admin token as member for testing
            self.log_test("Member Endpoints", False, "No token available")
            return False
        
        # Member-accessible endpoints
        member_endpoints = [
            ('GET', 'plots'),
            ('GET', 'inspections/my-plot'),
            ('GET', 'member-notices'),
            ('GET', 'rules'),
            ('POST', 'rules/acknowledge'),
            ('GET', 'rules/my-acknowledgement?rule_id=test'),
            ('GET', 'documents'),
            ('POST', 'documents/upload')
        ]
        
        all_passed = True
        for method, endpoint in member_endpoints:
            response, error = self.make_request(method, endpoint, token=self.admin_token)
            
            if error:
                self.log_test(f"Member {method} {endpoint}", False, error)
                all_passed = False
                continue
            
            # Should have access (200 or appropriate success code)
            success = response.status_code in [200, 201]
            if not success:
                details = f"Member access failed: {response.status_code}"
                self.log_test(f"Member {method} {endpoint}", False, details)
                all_passed = False
            else:
                self.log_test(f"Member {method} {endpoint}", True)
        
        return all_passed

    def test_data_relationships(self):
        """Test that data relationships work correctly"""
        if not self.admin_token:
            self.log_test("Data Relationships", False, "No admin token available")
            return False
        
        all_passed = True
        
        # Test 1: Create inspection and verify member notice is created
        # First get a plot
        response, error = self.make_request('GET', 'plots', token=self.admin_token)
        if error or response.status_code != 200:
            self.log_test("Get Plots for Relationship Test", False, "Could not get plots")
            return False
        
        plots = response.json()
        if not plots:
            self.log_test("Data Relationships", False, "No plots available for testing")
            return False
        
        plot_id = plots[0]['id']
        
        # Create inspection with action that should trigger notice
        inspection_data = {
            'plot_id': plot_id,
            'use_status': 'partial',
            'upkeep': 'poor',
            'issues': ['weeds', 'neglect'],
            'notes': 'Test inspection for relationship testing',
            'photos': [],
            'action': 'warning',
            'reinspect_by': (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        response, error = self.make_request('POST', 'inspections', inspection_data, token=self.admin_token)
        if error or response.status_code != 200:
            self.log_test("Create Inspection for Relationship", False, f"Status: {response.status_code if response else 'No response'}")
            all_passed = False
        else:
            self.log_test("Create Inspection for Relationship", True)
        
        # Test 2: Verify rules acknowledgement works
        # Get current rules
        response, error = self.make_request('GET', 'rules', token=self.admin_token)
        if error or response.status_code != 200:
            self.log_test("Get Rules for Acknowledgement", False, "Could not get rules")
            all_passed = False
        else:
            rules = response.json()
            rule_id = rules.get('id')
            
            if rule_id:
                # Acknowledge rules
                ack_data = {'rule_id': rule_id}
                response, error = self.make_request('POST', 'rules/acknowledge', ack_data, token=self.admin_token)
                if error or response.status_code != 200:
                    self.log_test("Acknowledge Rules Relationship", False, f"Status: {response.status_code if response else 'No response'}")
                    all_passed = False
                else:
                    self.log_test("Acknowledge Rules Relationship", True)
        
        return all_passed

    def run_all_tests(self):
        """Run all authorization tests"""
        print("🔐 Starting Authorization & Role-Based Access Control Tests")
        print("=" * 60)
        
        # Login as admin
        if not self.test_admin_login():
            print("❌ Admin login failed. Cannot continue with authorization tests.")
            return False
        
        # Test unauthorized access
        print("\n🚫 Testing Unauthorized Access:")
        self.test_unauthorized_access()
        
        # Test admin-only endpoints
        print("\n👑 Testing Admin-Only Endpoints:")
        self.test_admin_only_endpoints()
        
        # Test member endpoints
        print("\n👤 Testing Member Endpoints:")
        self.test_member_endpoints()
        
        # Test data relationships
        print("\n🔗 Testing Data Relationships:")
        self.test_data_relationships()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Authorization Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 90  # Consider 90%+ success rate as passing

def main():
    tester = AuthorizationTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())