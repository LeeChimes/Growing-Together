import requests
import sys
import json
from datetime import datetime, timedelta

class ComprehensiveAPITester:
    def __init__(self, base_url="https://harvest-hub-64.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.plot_id = None
        self.rule_id = None
        self.document_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
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

    def setup_test_data(self):
        """Setup test data for comprehensive testing"""
        # Login as admin
        response, error = self.make_request('POST', 'auth/login', {
            'email': 'admin@staffordallotment.com',
            'password': 'admin123'
        })
        
        if error or response.status_code != 200:
            print("❌ Failed to login as admin")
            return False
        
        self.admin_token = response.json().get('token')
        
        # Get a plot ID for testing
        response, error = self.make_request('GET', 'plots', token=self.admin_token)
        if response and response.status_code == 200:
            plots = response.json()
            if plots:
                self.plot_id = plots[0]['id']
        
        # Get current rules ID
        response, error = self.make_request('GET', 'rules', token=self.admin_token)
        if response and response.status_code == 200:
            rules = response.json()
            self.rule_id = rules.get('id')
        
        return True

    def test_plot_inspections_full_workflow(self):
        """Test complete plot inspections workflow"""
        print("\n🔍 PLOT INSPECTIONS SYSTEM:")
        
        # 1. Get all plots
        response, error = self.make_request('GET', 'plots', token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("Get All Plots", success, f"Status: {response.status_code if response else 'No response'}")
        
        if success:
            plots = response.json()
            print(f"   Found {len(plots)} plots")
        
        # 2. Get all inspections (admin only)
        response, error = self.make_request('GET', 'inspections', token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("Get All Inspections (Admin)", success, f"Status: {response.status_code if response else 'No response'}")
        
        # 3. Create inspection with proper data
        if self.plot_id:
            inspection_data = {
                'plot_id': self.plot_id,
                'use_status': 'active',
                'upkeep': 'good',
                'issues': ['minor_weeds'],
                'notes': 'Comprehensive test inspection - plot in good condition',
                'photos': [],
                'action': 'none'
            }
            
            response, error = self.make_request('POST', 'inspections', inspection_data, token=self.admin_token)
            success = response and response.status_code == 200
            self.log_test("Create Inspection", success, f"Status: {response.status_code if response else 'No response'}")
            
            if success:
                inspection = response.json()
                print(f"   Created inspection with score: {inspection.get('score', 'N/A')}")
        
        # 4. Get user's plot inspections
        response, error = self.make_request('GET', 'inspections/my-plot', token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("Get My Plot Inspections", success, f"Status: {response.status_code if response else 'No response'}")
        
        # 5. Get member notices
        response, error = self.make_request('GET', 'member-notices', token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("Get Member Notices", success, f"Status: {response.status_code if response else 'No response'}")

    def test_rules_system_full_workflow(self):
        """Test complete rules system workflow"""
        print("\n📋 RULES SYSTEM:")
        
        # 1. Get active rules
        response, error = self.make_request('GET', 'rules', token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("Get Active Rules", success, f"Status: {response.status_code if response else 'No response'}")
        
        if success:
            rules = response.json()
            print(f"   Current rules version: {rules.get('version', 'N/A')}")
        
        # 2. Create new rules version
        rules_data = {
            'version': f'test-comprehensive-{datetime.now().strftime("%H%M%S")}',
            'markdown': '''# Comprehensive Test Rules

## Section 1: Plot Management
- All plots must be actively maintained
- Regular inspections will be conducted

## Section 2: Community Guidelines  
- Respect fellow gardeners
- Participate in community events

## Section 3: Safety
- Follow all safety protocols
- Report any hazards immediately''',
            'summary': 'Comprehensive test rules for API validation'
        }
        
        response, error = self.make_request('POST', 'rules', rules_data, token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("Create New Rules Version", success, f"Status: {response.status_code if response else 'No response'}")
        
        if success:
            new_rules = response.json()
            new_rule_id = new_rules.get('id')
            print(f"   Created rules version: {new_rules.get('version', 'N/A')}")
            
            # 3. Acknowledge rules
            if new_rule_id:
                ack_data = {'rule_id': new_rule_id}
                response, error = self.make_request('POST', 'rules/acknowledge', ack_data, token=self.admin_token)
                success = response and response.status_code == 200
                self.log_test("Acknowledge Rules", success, f"Status: {response.status_code if response else 'No response'}")
        
        # 4. Get rule acknowledgements (admin only)
        response, error = self.make_request('GET', 'rules/acknowledgements', token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("Get Rule Acknowledgements (Admin)", success, f"Status: {response.status_code if response else 'No response'}")
        
        # 5. Get user's acknowledgement status
        if self.rule_id:
            response, error = self.make_request('GET', f'rules/my-acknowledgement?rule_id={self.rule_id}', token=self.admin_token)
            success = response and response.status_code == 200
            self.log_test("Get My Rule Acknowledgement", success, f"Status: {response.status_code if response else 'No response'}")

    def test_documents_system_full_workflow(self):
        """Test complete documents system workflow"""
        print("\n📄 DOCUMENTS SYSTEM:")
        
        # 1. Get user's documents
        response, error = self.make_request('GET', 'documents', token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("Get User Documents", success, f"Status: {response.status_code if response else 'No response'}")
        
        # 2. Upload document with proper data
        document_data = {
            'title': 'Comprehensive Test Contract',
            'type': 'contract',
            'file_name': 'test_comprehensive_contract.pdf',
            'file_size': 2048,
            'mime_type': 'application/pdf',
            'expires_at': (datetime.now() + timedelta(days=365)).isoformat()
        }
        
        response, error = self.make_request('POST', 'documents/upload', document_data, token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("Upload Document", success, f"Status: {response.status_code if response else 'No response'}")
        
        if success:
            uploaded_doc = response.json()
            self.document_id = uploaded_doc.get('id')
            print(f"   Uploaded document: {uploaded_doc.get('title', 'N/A')}")
        
        # 3. Get all users' documents (admin only)
        response, error = self.make_request('GET', 'admin/documents', token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("Get All User Documents (Admin)", success, f"Status: {response.status_code if response else 'No response'}")
        
        if success:
            all_docs = response.json()
            total_docs = sum(len(user.get('documents', [])) for user in all_docs)
            print(f"   Total documents across all users: {total_docs}")
        
        # 4. Delete document (cleanup)
        if self.document_id:
            response, error = self.make_request('DELETE', f'documents/{self.document_id}', token=self.admin_token)
            success = response and response.status_code == 200
            self.log_test("Delete Document", success, f"Status: {response.status_code if response else 'No response'}")

    def test_authentication_and_authorization(self):
        """Test authentication and authorization"""
        print("\n🔐 AUTHENTICATION & AUTHORIZATION:")
        
        # Test unauthorized access to protected endpoints
        protected_endpoints = [
            ('GET', 'inspections'),
            ('POST', 'rules'),
            ('GET', 'admin/documents')
        ]
        
        for method, endpoint in protected_endpoints:
            response, error = self.make_request(method, endpoint)  # No token
            success = response and response.status_code in [401, 403]
            self.log_test(f"Unauthorized Access Blocked - {method} {endpoint}", success, 
                         f"Expected 401/403, got {response.status_code if response else 'No response'}")

    def run_comprehensive_tests(self):
        """Run all comprehensive tests"""
        print("🚀 COMPREHENSIVE API TESTING - NEW ADD-ON FEATURES")
        print("=" * 70)
        
        if not self.setup_test_data():
            print("❌ Failed to setup test data. Stopping tests.")
            return False
        
        print("✅ Test setup completed successfully")
        
        # Run all test suites
        self.test_plot_inspections_full_workflow()
        self.test_rules_system_full_workflow()
        self.test_documents_system_full_workflow()
        self.test_authentication_and_authorization()
        
        # Print final summary
        print("\n" + "=" * 70)
        print(f"📊 FINAL TEST SUMMARY: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✅ Overall Success Rate: {success_rate:.1f}%")
        
        # Detailed analysis
        if success_rate >= 95:
            print("🎉 EXCELLENT: All new add-on features are working perfectly!")
        elif success_rate >= 85:
            print("✅ GOOD: New add-on features are working well with minor issues")
        elif success_rate >= 70:
            print("⚠️  FAIR: New add-on features have some issues that need attention")
        else:
            print("❌ POOR: New add-on features have significant issues")
        
        return success_rate >= 85

def main():
    tester = ComprehensiveAPITester()
    success = tester.run_comprehensive_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())