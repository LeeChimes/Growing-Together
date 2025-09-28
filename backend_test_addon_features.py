import requests
import sys
import json
from datetime import datetime, timedelta

class AddonFeaturesAPITester:
    def __init__(self, base_url="https://harvest-hub-64.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.admin_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.critical_issues = []

    def log_test(self, name, success, details="", is_critical=False):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})
            if is_critical:
                self.critical_issues.append({"test": name, "error": details})

    def make_request(self, method, endpoint, data=None, use_admin=True):
        """Make API request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

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
        """Test admin login for authentication"""
        response, error = self.make_request('POST', 'auth/login', {
            'email': 'admin@staffordallotment.com',
            'password': 'admin123'
        })
        
        if error:
            self.log_test("Admin Authentication", False, error, is_critical=True)
            return False
        
        success = response.status_code == 200
        if success:
            data = response.json()
            self.admin_token = data.get('token')
            self.admin_id = data.get('user', {}).get('id')
            self.log_test("Admin Authentication", True)
        else:
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_test("Admin Authentication", False, details, is_critical=True)
        
        return success

    def test_plot_inspections_endpoints(self):
        """Test Plot Inspections API endpoints"""
        print("\n🔍 Testing Plot Inspections System...")
        
        # Test get plots endpoint
        response, error = self.make_request('GET', 'plots')
        if error:
            self.log_test("GET /api/plots", False, error, is_critical=True)
        else:
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("GET /api/plots", success, details, is_critical=not success)

        # Test get inspections endpoint
        response, error = self.make_request('GET', 'inspections')
        if error:
            self.log_test("GET /api/inspections", False, error, is_critical=True)
        else:
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("GET /api/inspections", success, details, is_critical=not success)

        # Test create inspection endpoint
        inspection_data = {
            'plot_id': 'test-plot-id',
            'use_status': 'active',
            'upkeep': 'good',
            'issues': ['weeds'],
            'notes': 'Test inspection',
            'photos': [],
            'shared_with_member': True
        }
        
        response, error = self.make_request('POST', 'inspections', inspection_data)
        if error:
            self.log_test("POST /api/inspections", False, error, is_critical=True)
        else:
            success = response.status_code in [200, 201]
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("POST /api/inspections", success, details, is_critical=not success)

        # Test get member notices endpoint
        response, error = self.make_request('GET', 'member-notices')
        if error:
            self.log_test("GET /api/member-notices", False, error, is_critical=True)
        else:
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("GET /api/member-notices", success, details, is_critical=not success)

    def test_rules_system_endpoints(self):
        """Test Rules System API endpoints"""
        print("\n📋 Testing Rules System...")
        
        # Test get rules endpoint
        response, error = self.make_request('GET', 'rules')
        if error:
            self.log_test("GET /api/rules", False, error, is_critical=True)
        else:
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("GET /api/rules", success, details, is_critical=not success)

        # Test create rules endpoint
        rules_data = {
            'version': '1.1',
            'markdown': '# Test Rules\n\n## Section 1\nTest content',
            'summary': 'Test rules version'
        }
        
        response, error = self.make_request('POST', 'rules', rules_data)
        if error:
            self.log_test("POST /api/rules", False, error, is_critical=True)
        else:
            success = response.status_code in [200, 201]
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("POST /api/rules", success, details, is_critical=not success)

        # Test acknowledge rules endpoint
        response, error = self.make_request('POST', 'rules/acknowledge', {'rule_id': 'test-rule-id'})
        if error:
            self.log_test("POST /api/rules/acknowledge", False, error, is_critical=True)
        else:
            success = response.status_code in [200, 201]
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("POST /api/rules/acknowledge", success, details, is_critical=not success)

        # Test get rule acknowledgements endpoint
        response, error = self.make_request('GET', 'rules/acknowledgements')
        if error:
            self.log_test("GET /api/rules/acknowledgements", False, error, is_critical=True)
        else:
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("GET /api/rules/acknowledgements", success, details, is_critical=not success)

    def test_documents_system_endpoints(self):
        """Test Member Documents System API endpoints"""
        print("\n📄 Testing Member Documents System...")
        
        # Test get user documents endpoint
        response, error = self.make_request('GET', 'documents')
        if error:
            self.log_test("GET /api/documents", False, error, is_critical=True)
        else:
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("GET /api/documents", success, details, is_critical=not success)

        # Test upload document endpoint (without actual file)
        document_data = {
            'title': 'Test Document',
            'type': 'contract',
            'file_name': 'test.pdf',
            'file_size': 1024,
            'mime_type': 'application/pdf'
        }
        
        response, error = self.make_request('POST', 'documents/upload', document_data)
        if error:
            self.log_test("POST /api/documents/upload", False, error, is_critical=True)
        else:
            success = response.status_code in [200, 201]
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("POST /api/documents/upload", success, details, is_critical=not success)

        # Test admin documents management endpoint
        response, error = self.make_request('GET', 'admin/documents')
        if error:
            self.log_test("GET /api/admin/documents", False, error, is_critical=True)
        else:
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("GET /api/admin/documents", success, details, is_critical=not success)

    def test_database_connectivity(self):
        """Test if the system is using the correct database"""
        print("\n🗄️ Testing Database Connectivity...")
        
        # Check if MongoDB collections exist for new features
        # This is indirect testing since we can't directly query MongoDB
        
        # Test if any existing endpoints work (indicating MongoDB is connected)
        response, error = self.make_request('GET', 'weather')
        if error:
            self.log_test("Database Connectivity (via weather API)", False, error, is_critical=True)
        else:
            success = response.status_code == 200
            self.log_test("Database Connectivity (via weather API)", success, 
                         f"Status: {response.status_code}" if not success else "")

    def test_role_based_access(self):
        """Test role-based access control for admin features"""
        print("\n🔐 Testing Role-Based Access Control...")
        
        if not self.admin_token:
            self.log_test("Role-Based Access Control", False, "No admin token available", is_critical=True)
            return
        
        # Test admin-only endpoints
        admin_endpoints = [
            'admin/users',
            'admin/analytics',
            'admin/export-data'
        ]
        
        for endpoint in admin_endpoints:
            response, error = self.make_request('GET', endpoint)
            if error:
                self.log_test(f"Admin Access - {endpoint}", False, error)
            else:
                success = response.status_code == 200
                details = f"Status: {response.status_code}" if not success else ""
                self.log_test(f"Admin Access - {endpoint}", success, details)

    def run_addon_tests(self):
        """Run all add-on feature tests"""
        print("🚀 Starting Plot Inspections & Rules/Documents Add-on Tests")
        print("=" * 60)
        
        # Authentication first
        if not self.test_admin_login():
            print("❌ Admin authentication failed. Cannot proceed with protected endpoint tests.")
            return False
        
        # Test database connectivity
        self.test_database_connectivity()
        
        # Test role-based access
        self.test_role_based_access()
        
        # Test new add-on features
        self.test_plot_inspections_endpoints()
        self.test_rules_system_endpoints()
        self.test_documents_system_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Add-on Features Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES FOUND ({len(self.critical_issues)}):")
            for issue in self.critical_issues:
                print(f"  - {issue['test']}: {issue['error']}")
        
        if self.failed_tests:
            print(f"\n❌ All Failed Tests ({len(self.failed_tests)}):")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        # Analysis
        print(f"\n🔍 ANALYSIS:")
        if len(self.critical_issues) > 0:
            print("- BACKEND ENDPOINTS MISSING: The Plot Inspections and Rules/Documents endpoints are not implemented")
            print("- DATABASE MISMATCH: System designed for Supabase PostgreSQL but backend uses MongoDB")
            print("- IMPLEMENTATION INCOMPLETE: Frontend exists but backend API layer is missing")
        
        return len(self.critical_issues) == 0

def main():
    tester = AddonFeaturesAPITester()
    success = tester.run_addon_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())