import requests
import json
import time

# Test AI integration specifically
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
    
    # Test AI advice requests with different scenarios
    test_cases = [
        {
            'name': 'Basic Plant Query',
            'data': {
                'plant_name': 'Tomatoes',
                'question': 'My tomato leaves are yellowing. What should I do?'
            }
        },
        {
            'name': 'General Garden Query',
            'data': {
                'question': 'What are the best companion plants for vegetables?'
            }
        },
        {
            'name': 'Pest Problem Query',
            'data': {
                'plant_name': 'Lettuce',
                'question': 'I found small holes in my lettuce leaves. What pest could this be?'
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        start_time = time.time()
        
        try:
            response = requests.post(f"{api_url}/plants/ai-advice", 
                                   json=test_case['data'], 
                                   headers=headers, 
                                   timeout=30)
            
            end_time = time.time()
            duration = end_time - start_time
            
            print(f"Status: {response.status_code}")
            print(f"Duration: {duration:.2f} seconds")
            
            if response.status_code == 200:
                data = response.json()
                advice_length = len(data.get('advice', ''))
                print(f"✅ {test_case['name']} - PASSED")
                print(f"Advice length: {advice_length} characters")
                print(f"Can save as task: {data.get('can_save_as_task', False)}")
                print(f"Suggested actions: {len(data.get('suggested_actions', []))}")
            else:
                print(f"❌ {test_case['name']} - FAILED: {response.text}")
                
        except requests.exceptions.Timeout:
            print(f"❌ {test_case['name']} - TIMEOUT after 30 seconds")
        except Exception as e:
            print(f"❌ {test_case['name']} - ERROR: {str(e)}")
            
else:
    print("Failed to login as admin")