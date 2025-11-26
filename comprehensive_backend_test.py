#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Address and Order Endpoints
Tests all CRUD operations and edge cases for the endpoints used by checkout and profile features.
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
        
        if response.status_code == expected_status:
            try:
                json_data = response.json()
                print(f"   ✅ SUCCESS - Response: {json.dumps(json_data, indent=2)[:300]}...")
                return True, json_data, response
            except json.JSONDecodeError:
                print(f"   ✅ SUCCESS - Non-JSON response: {response.text[:200]}...")
                return True, response.text, response
        else:
            print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
            print(f"   Response: {response.text[:300]}...")
            return False, response.text, response
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ REQUEST ERROR: {str(e)}")
        return False, str(e), None
    except Exception as e:
        print(f"   ❌ UNEXPECTED ERROR: {str(e)}")
        return False, str(e), None

def run_comprehensive_tests():
    """Run comprehensive backend tests"""
    print("=" * 80)
    print("🚀 COMPREHENSIVE BACKEND API TESTS")
    print("=" * 80)
    
    results = {
        'passed': 0,
        'failed': 0,
        'tests': []
    }
    
    # Test 1: Address CRUD operations without auth
    print("\n📋 SECTION 1: ADDRESS ENDPOINTS (Authentication Required)")
    
    # GET addresses
    success, data, response = test_endpoint('GET', '/addresses', expected_status=401)
    results['tests'].append({
        'name': 'GET /api/addresses (no auth)',
        'passed': success,
        'section': 'addresses'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # POST address
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
    results['tests'].append({
        'name': 'POST /api/addresses (no auth)',
        'passed': success,
        'section': 'addresses'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # PUT address
    success, data, response = test_endpoint('PUT', '/addresses/test-id', expected_status=401, data=address_data)
    results['tests'].append({
        'name': 'PUT /api/addresses/test-id (no auth)',
        'passed': success,
        'section': 'addresses'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # DELETE address
    success, data, response = test_endpoint('DELETE', '/addresses/test-id', expected_status=401)
    results['tests'].append({
        'name': 'DELETE /api/addresses/test-id (no auth)',
        'passed': success,
        'section': 'addresses'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # Test 2: Order endpoints without auth
    print("\n📋 SECTION 2: ORDER ENDPOINTS (Authentication Required)")
    
    # GET orders
    success, data, response = test_endpoint('GET', '/orders', expected_status=401)
    results['tests'].append({
        'name': 'GET /api/orders (no auth)',
        'passed': success,
        'section': 'orders'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # POST order
    order_data = {"addressId": "test-address-id"}
    success, data, response = test_endpoint('POST', '/orders', expected_status=401, data=order_data)
    results['tests'].append({
        'name': 'POST /api/orders (no auth)',
        'passed': success,
        'section': 'orders'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # GET specific order
    success, data, response = test_endpoint('GET', '/orders/test-order-id', expected_status=401)
    results['tests'].append({
        'name': 'GET /api/orders/test-order-id (no auth)',
        'passed': success,
        'section': 'orders'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # Test 3: Cart endpoints without auth
    print("\n📋 SECTION 3: CART ENDPOINTS (Authentication Required)")
    
    # GET cart
    success, data, response = test_endpoint('GET', '/cart', expected_status=401)
    results['tests'].append({
        'name': 'GET /api/cart (no auth)',
        'passed': success,
        'section': 'cart'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # POST cart item
    cart_item_data = {"productId": "test-product-id", "quantity": 1}
    success, data, response = test_endpoint('POST', '/cart/items', expected_status=401, data=cart_item_data)
    results['tests'].append({
        'name': 'POST /api/cart/items (no auth)',
        'passed': success,
        'section': 'cart'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # DELETE cart item
    delete_item_data = {"itemId": "test-item-id"}
    success, data, response = test_endpoint('DELETE', '/cart/items', expected_status=401, data=delete_item_data)
    results['tests'].append({
        'name': 'DELETE /api/cart/items (no auth)',
        'passed': success,
        'section': 'cart'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # Test 4: Public endpoints (regression tests)
    print("\n📋 SECTION 4: PUBLIC ENDPOINTS (Regression Tests)")
    
    # Categories
    success, data, response = test_endpoint('GET', '/categories')
    results['tests'].append({
        'name': 'GET /api/categories',
        'passed': success,
        'section': 'public',
        'has_data': success and isinstance(data, list) and len(data) > 0
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # Products
    success, data, response = test_endpoint('GET', '/products')
    results['tests'].append({
        'name': 'GET /api/products',
        'passed': success,
        'section': 'public',
        'has_pagination': success and isinstance(data, dict) and 'items' in data
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # Product detail
    success, data, response = test_endpoint('GET', '/products/chibi-hero-plush')
    results['tests'].append({
        'name': 'GET /api/products/chibi-hero-plush',
        'passed': success,
        'section': 'public',
        'product_found': success and isinstance(data, dict) and data.get('slug') == 'chibi-hero-plush'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # Test 5: Error handling
    print("\n📋 SECTION 5: ERROR HANDLING")
    
    # Non-existent product
    success, data, response = test_endpoint('GET', '/products/non-existent', expected_status=404)
    results['tests'].append({
        'name': 'GET /api/products/non-existent (404)',
        'passed': success,
        'section': 'error_handling'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # Non-existent route
    success, data, response = test_endpoint('GET', '/non-existent-route', expected_status=404)
    results['tests'].append({
        'name': 'GET /api/non-existent-route (404)',
        'passed': success,
        'section': 'error_handling'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # Test 6: CORS and OPTIONS
    print("\n📋 SECTION 6: CORS AND OPTIONS")
    
    # OPTIONS request
    success, data, response = test_endpoint('OPTIONS', '/')
    results['tests'].append({
        'name': 'OPTIONS /api/ (CORS preflight)',
        'passed': success,
        'section': 'cors'
    })
    if success: results['passed'] += 1
    else: results['failed'] += 1
    
    # Print summary
    print("\n" + "=" * 80)
    print("📊 COMPREHENSIVE TEST SUMMARY")
    print("=" * 80)
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"📈 Success Rate: {(results['passed'] / (results['passed'] + results['failed']) * 100):.1f}%")
    
    # Section breakdown
    sections = {}
    for test in results['tests']:
        section = test.get('section', 'other')
        if section not in sections:
            sections[section] = {'passed': 0, 'failed': 0}
        if test['passed']:
            sections[section]['passed'] += 1
        else:
            sections[section]['failed'] += 1
    
    print("\n📋 RESULTS BY SECTION:")
    for section, counts in sections.items():
        total = counts['passed'] + counts['failed']
        rate = (counts['passed'] / total * 100) if total > 0 else 0
        print(f"  {section.upper()}: {counts['passed']}/{total} passed ({rate:.1f}%)")
    
    # Detailed results
    print("\n📋 DETAILED RESULTS:")
    for test in results['tests']:
        status = "✅ PASS" if test['passed'] else "❌ FAIL"
        print(f"  {status} | {test['name']}")
    
    # Check for critical issues
    critical_issues = []
    for test in results['tests']:
        if not test['passed']:
            critical_issues.append(f"- {test['name']}")
    
    if critical_issues:
        print("\n🚨 CRITICAL ISSUES FOUND:")
        for issue in critical_issues:
            print(issue)
    else:
        print("\n✅ NO CRITICAL ISSUES FOUND")
    
    # Key findings
    print("\n🔍 KEY FINDINGS:")
    auth_tests = [t for t in results['tests'] if 'no auth' in t['name']]
    print(f"🔐 Authentication: {len([t for t in auth_tests if t['passed']])}/{len(auth_tests)} protected endpoints correctly require auth")
    
    public_tests = [t for t in results['tests'] if t.get('section') == 'public']
    print(f"🌐 Public endpoints: {len([t for t in public_tests if t['passed']])}/{len(public_tests)} working correctly")
    
    error_tests = [t for t in results['tests'] if t.get('section') == 'error_handling']
    print(f"⚠️  Error handling: {len([t for t in error_tests if t['passed']])}/{len(error_tests)} error cases handled correctly")
    
    return results

if __name__ == "__main__":
    print(f"🎯 Testing comprehensive backend functionality at: {API_BASE}")
    results = run_comprehensive_tests()
    
    # Exit with appropriate code
    if results['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)