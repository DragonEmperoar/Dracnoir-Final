#!/usr/bin/env python3
"""
Backend API Testing for Anime E-commerce Store
Tests all API endpoints with proper error handling and detailed reporting.
"""

import requests
import json
import sys
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://otakushop-2.preview.emergentagent.com"
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
        
        response = requests.request(
            method=method,
            url=url,
            params=params,
            json=data,
            headers=headers,
            timeout=30
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
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

def run_backend_tests():
    """Run all backend API tests"""
    print("=" * 80)
    print("🚀 ANIME E-COMMERCE BACKEND API TESTS")
    print("=" * 80)
    
    results = {
        'passed': 0,
        'failed': 0,
        'tests': []
    }
    
    # Test 1: GET /api/root
    print("\n📋 TEST 1: Root endpoint")
    success, data, response = test_endpoint('GET', '/root')
    test_result = {
        'name': 'GET /api/root',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False
    }
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 2: GET /api/ (root with slash)
    print("\n📋 TEST 2: Root endpoint with slash")
    success, data, response = test_endpoint('GET', '/')
    test_result = {
        'name': 'GET /api/',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False
    }
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 3: GET /api/categories
    print("\n📋 TEST 3: Categories endpoint")
    success, data, response = test_endpoint('GET', '/categories')
    test_result = {
        'name': 'GET /api/categories',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'has_seeded_data': False
    }
    
    if success and isinstance(data, list) and len(data) > 0:
        test_result['has_seeded_data'] = True
        print(f"   ✅ Found {len(data)} categories")
        for cat in data:
            print(f"      - {cat.get('name', 'Unknown')} ({cat.get('slug', 'no-slug')})")
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 4: GET /api/products (basic)
    print("\n📋 TEST 4: Products endpoint (basic)")
    success, data, response = test_endpoint('GET', '/products')
    test_result = {
        'name': 'GET /api/products',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'has_pagination': False,
        'has_products': False
    }
    
    if success and isinstance(data, dict):
        # Check pagination structure
        if all(key in data for key in ['items', 'page', 'limit', 'total', 'totalPages']):
            test_result['has_pagination'] = True
            print(f"   ✅ Pagination structure present")
            print(f"      Page: {data.get('page')}, Limit: {data.get('limit')}, Total: {data.get('total')}")
        
        # Check products
        if 'items' in data and len(data['items']) > 0:
            test_result['has_products'] = True
            print(f"   ✅ Found {len(data['items'])} products")
            for product in data['items'][:2]:  # Show first 2 products
                print(f"      - {product.get('title', 'Unknown')} (${product.get('price', 0)})")
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 5: GET /api/products with pagination
    print("\n📋 TEST 5: Products endpoint with pagination")
    success, data, response = test_endpoint('GET', '/products', params={'page': 1, 'limit': 2})
    test_result = {
        'name': 'GET /api/products?page=1&limit=2',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'pagination_working': False
    }
    
    if success and isinstance(data, dict) and 'items' in data:
        if len(data['items']) <= 2 and data.get('limit') == 2:
            test_result['pagination_working'] = True
            print(f"   ✅ Pagination working - returned {len(data['items'])} items with limit 2")
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 6: GET /api/products with filters
    print("\n📋 TEST 6: Products endpoint with filters")
    success, data, response = test_endpoint('GET', '/products', params={'categorySlug': 'plushes'})
    test_result = {
        'name': 'GET /api/products?categorySlug=plushes',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'filter_working': False
    }
    
    if success and isinstance(data, dict) and 'items' in data:
        # Check if all returned items have the correct category
        plush_items = [item for item in data['items'] if item.get('categorySlug') == 'plushes']
        if len(plush_items) == len(data['items']) and len(data['items']) > 0:
            test_result['filter_working'] = True
            print(f"   ✅ Category filter working - found {len(plush_items)} plush items")
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 7: GET /api/products with sort
    print("\n📋 TEST 7: Products endpoint with sort")
    success, data, response = test_endpoint('GET', '/products', params={'sort': 'price-asc'})
    test_result = {
        'name': 'GET /api/products?sort=price-asc',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'sort_working': False
    }
    
    if success and isinstance(data, dict) and 'items' in data and len(data['items']) > 1:
        # Check if items are sorted by price ascending
        prices = [item.get('price', 0) for item in data['items']]
        if prices == sorted(prices):
            test_result['sort_working'] = True
            print(f"   ✅ Price sorting working - prices: {prices}")
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 8: GET /api/products/[slug] - Get a specific product
    print("\n📋 TEST 8: Product detail endpoint")
    success, data, response = test_endpoint('GET', '/products/chibi-hero-plush')
    test_result = {
        'name': 'GET /api/products/chibi-hero-plush',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'product_found': False
    }
    
    if success and isinstance(data, dict) and 'slug' in data:
        if data.get('slug') == 'chibi-hero-plush':
            test_result['product_found'] = True
            print(f"   ✅ Product found: {data.get('title', 'Unknown')}")
            print(f"      Price: ${data.get('price', 0)}")
            print(f"      Category: {data.get('categorySlug', 'Unknown')}")
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 9: GET /api/products/[slug] - Non-existent product (should return 404)
    print("\n📋 TEST 9: Product detail endpoint - non-existent product")
    success, data, response = test_endpoint('GET', '/products/non-existent-product', expected_status=404)
    test_result = {
        'name': 'GET /api/products/non-existent-product',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'proper_404': success
    }
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 10: OPTIONS request (CORS preflight)
    print("\n📋 TEST 10: CORS preflight (OPTIONS)")
    success, data, response = test_endpoint('OPTIONS', '/')
    test_result = {
        'name': 'OPTIONS /api/',
        'passed': success,
        'data': data,
        'cors_present': bool(response and response.headers.get('Access-Control-Allow-Origin')) if response else False,
        'cors_methods': response.headers.get('Access-Control-Allow-Methods') if response else None
    }
    
    results['tests'].append(test_result)
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Print summary
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
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
    
    # Check CORS coverage
    cors_tests = [test for test in results['tests'] if test['cors_present']]
    print(f"\n🌐 CORS Headers Present: {len(cors_tests)}/{len(results['tests'])} endpoints")
    
    return results

if __name__ == "__main__":
    print(f"🎯 Testing API at: {API_BASE}")
    results = run_backend_tests()
    
    # Exit with appropriate code
    if results['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)