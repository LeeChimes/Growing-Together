import requests
import json

# Test admin data export specifically
base_url = "https://allotment-app-1.preview.emergentagent.com"
api_url = f"{base_url}/api"

# Login as admin
login_response = requests.post(f"{api_url}/auth/login", json={
    'email': 'admin@staffordallotment.com',
    'password': 'admin123'
})

if login_response.status_code == 200:
    token = login_response.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test admin data export
    export_response = requests.get(f"{api_url}/admin/export-data", headers=headers)
    
    print(f"Export Status: {export_response.status_code}")
    if export_response.status_code == 200:
        data = export_response.json()
        print("✅ Admin Data Export - PASSED")
        print(f"Export contains {len(data.get('users', []))} users")
        print(f"Export contains {len(data.get('diary_entries', []))} diary entries")
        print(f"Export contains {len(data.get('events', []))} events")
        print(f"Export contains {len(data.get('posts', []))} posts")
        print(f"Export contains {len(data.get('tasks', []))} tasks")
    else:
        print(f"❌ Admin Data Export - FAILED: {export_response.text}")
else:
    print("Failed to login as admin")