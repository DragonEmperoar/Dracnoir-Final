#!/usr/bin/env python3
"""
Backend API Testing for Address and Order Endpoints
Tests the specific endpoints used by the new checkout and profile features.
"""

import requests
import json
import sys
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://anime-commerce-2.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def test_endpoint(method, endpoint, expected_status=200, params=None, data=None, headers=None):
    """Test a single endpoint with detailed error reporting"""
    # Ensure endpoint starts with /api if not already
    if not endpoint.startswith('/api'):
        if endpoint.startswith('/'):
            endpoint = '/api' + endpoint
        else:
            endpoint = '/api/' + endpoint
    
    url = urljoin(BASE_URL, endpoint.lstrip('/'))
    
    try:
        print(f"\n🧪 Testing {method} {url}")
        if params:
            print(f"   Params: {params}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        response = requests.request(
            method=method,
            url=url,
            params=params,
            json=data,
            headers=headers,
            timeout=30
        )
        
        print(f"   Status: {response.status_code}")
        
        # Check CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        print(f"   CORS Headers: {cors_headers}")
        
        if response.status_code == expected_status:
            try:
                json_data = response.json()
                print(f"   ✅ SUCCESS - Response: {json.dumps(json_data, indent=2)[:500]}...")
                return True, json_data, response
            except json.JSONDecodeError:
                print(f"   ✅ SUCCESS - Non-JSON response: {response.text[:200]}...")
                return True, response.text, response
        else:
            print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
            print(f"   Response: {response.text[:500]}...")
            return False, response.text, response
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ REQUEST ERROR: {str(e)}")
        return False, str(e), None
    except Exception as e:
        print(f"   ❌ UNEXPECTED ERROR: {str(e)}")
        return False, str(e), None

def run_address_order_tests():
    """Run address and order endpoint tests"""
    print("=" * 80)
    print("🚀 ADDRESS & ORDER ENDPOINTS TESTING")
    print("=" * 80)
    
    results = {
        'passed': 0,
        'failed': 0,
        'tests': []
    }
    
    # Test 1: GET /api/addresses (without auth - should return 401)
    print("\n📋 TEST 1: Addresses endpoint without authentication")
    success, data, response = test_endpoint('GET', '/addresses', expected_status=401)
    test_result = {
        'name': 'GET /api/addresses (no auth)',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'auth_required': success  # Should return 401
    }
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
        print("   ✅ Correctly requires authentication")
    else:
        results['failed'] += 1
    
    # Test 2: POST /api/addresses (without auth - should return 401)
    print("\n📋 TEST 2: Create address endpoint without authentication")
    address_data = {
        "label": "Home",
        "name": "Akira Tanaka",
        "phone": "+81-90-1234-5678",
        "line1": "1-2-3 Shibuya",
        "line2": "Apartment 4B",
        "city": "Tokyo",
        "state": "Tokyo",
        "postalCode": "150-0002",
        "country": "Japan",
        "isDefault": True
    }
    success, data, response = test_endpoint('POST', '/addresses', expected_status=401, data=address_data)
    test_result = {
        'name': 'POST /api/addresses (no auth)',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'auth_required': success  # Should return 401
    }
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
        print("   ✅ Correctly requires authentication")
    else:
        results['failed'] += 1
    
    # Test 3: GET /api/orders (without auth - should return 401)
    print("\n📋 TEST 3: Orders endpoint without authentication")
    success, data, response = test_endpoint('GET', '/orders', expected_status=401)
    test_result = {
        'name': 'GET /api/orders (no auth)',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'auth_required': success  # Should return 401
    }
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
        print("   ✅ Correctly requires authentication")
    else:
        results['failed'] += 1
    
    # Test 4: POST /api/orders (without auth - should return 401)
    print("\n📋 TEST 4: Create order endpoint without authentication")
    order_data = {
        "addressId": "test-address-id"
    }
    success, data, response = test_endpoint('POST', '/orders', expected_status=401, data=order_data)
    test_result = {
        'name': 'POST /api/orders (no auth)',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'auth_required': success  # Should return 401
    }
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
        print("   ✅ Correctly requires authentication")
    else:
        results['failed'] += 1
    
    # Test 5: GET /api/cart (without auth - should return 401)
    print("\n📋 TEST 5: Cart endpoint without authentication")
    success, data, response = test_endpoint('GET', '/cart', expected_status=401)
    test_result = {
        'name': 'GET /api/cart (no auth)',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'auth_required': success  # Should return 401
    }
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
        print("   ✅ Correctly requires authentication")
    else:
        results['failed'] += 1
    
    # Test 6: Verify existing endpoints still work (regression test)
    print("\n📋 TEST 6: Categories endpoint (regression test)")
    success, data, response = test_endpoint('GET', '/categories')
    test_result = {
        'name': 'GET /api/categories (regression)',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'has_data': False
    }
    
    if success and isinstance(data, list) and len(data) > 0:
        test_result['has_data'] = True
        print(f"   ✅ Found {len(data)} categories")
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 7: Products endpoint (regression test)
    print("\n📋 TEST 7: Products endpoint (regression test)")
    success, data, response = test_endpoint('GET', '/products')
    test_result = {
        'name': 'GET /api/products (regression)',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'has_data': False
    }
    
    if success and isinstance(data, dict) and 'items' in data and len(data['items']) > 0:
        test_result['has_data'] = True
        print(f"   ✅ Found {len(data['items'])} products")
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 8: Individual product endpoint (regression test)
    print("\n📋 TEST 8: Individual product endpoint (regression test)")
    success, data, response = test_endpoint('GET', '/products/chibi-hero-plush')
    test_result = {
        'name': 'GET /api/products/chibi-hero-plush (regression)',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'product_found': False
    }
    
    if success and isinstance(data, dict) and 'slug' in data:
        test_result['product_found'] = True
        print(f"   ✅ Product found: {data.get('title', 'Unknown')}")
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 9: Test address endpoint structure validation
    print("\n📋 TEST 9: Address endpoint structure validation")
    # Test with invalid data structure
    invalid_address = {"invalid": "data"}
    success, data, response = test_endpoint('POST', '/addresses', expected_status=401, data=invalid_address)
    test_result = {
        'name': 'POST /api/addresses (invalid structure)',
        'passed': success,  # Should still return 401 for auth, not 400 for validation
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'auth_check_first': success  # Auth should be checked before validation
    }
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
        print("   ✅ Authentication checked before data validation")
    else:
        results['failed'] += 1
    
    # Test 10: Test order endpoint structure validation
    print("\n📋 TEST 10: Order endpoint structure validation")
    # Test with invalid data structure
    invalid_order = {"invalid": "data"}
    success, data, response = test_endpoint('POST', '/orders', expected_status=401, data=invalid_order)
    test_result = {
        'name': 'POST /api/orders (invalid structure)',
        'passed': success,  # Should still return 401 for auth, not 400 for validation
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'auth_check_first': success  # Auth should be checked before validation
    }
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
        print("   ✅ Authentication checked before data validation")
    else:
        results['failed'] += 1
    
    # Print summary
    print("\n" + "=" * 80)
    print("📊 ADDRESS & ORDER ENDPOINTS TEST SUMMARY")
    print("=" * 80)
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"📈 Success Rate: {(results['passed'] / (results['passed'] + results['failed']) * 100):.1f}%")
    
    # Detailed results
    print("\n📋 DETAILED RESULTS:")
    for test in results['tests']:
        status = "✅ PASS" if test['passed'] else "❌ FAIL"
        cors_status = "✅ CORS" if test['cors_present'] else "❌ NO CORS"
        print(f"  {status} | {cors_status} | {test['name']}")
    
    # Check for critical issues
    critical_issues = []
    for test in results['tests']:
        if not test['passed']:
            critical_issues.append(f"- {test['name']}: {test['data']}")
    
    if critical_issues:
        print("\n🚨 CRITICAL ISSUES FOUND:")
        for issue in critical_issues:
            print(issue)
    else:
        print("\n✅ NO CRITICAL ISSUES FOUND")
    
    # Check CORS coverage
    cors_tests = [test for test in results['tests'] if test['cors_present']]
    print(f"\n🌐 CORS Headers Present: {len(cors_tests)}/{len(results['tests'])} endpoints")
    
    # Authentication summary
    auth_tests = [test for test in results['tests'] if 'auth_required' in test and test['auth_required']]
    print(f"🔐 Authentication Working: {len(auth_tests)} protected endpoints correctly require auth")
    
    return results

if __name__ == "__main__":
    print(f"🎯 Testing Address & Order APIs at: {API_BASE}")
    results = run_address_order_tests()
    
    # Exit with appropriate code
    if results['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)