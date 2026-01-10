#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class ArtChainAPITester:
    def __init__(self, base_url="https://artchain-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details="", expected_status=None, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
            if expected_status and actual_status:
                print(f"   Expected status: {expected_status}, Got: {actual_status}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_result(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log_result(name, False, f"Status code mismatch", expected_status, response.status_code)
                try:
                    error_detail = response.json()
                    print(f"   Error response: {error_detail}")
                except:
                    print(f"   Error response: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            self.log_result(name, False, "Request timeout (30s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_result(name, False, "Connection error")
            return False, {}
        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Seed demo artworks"""
        success, response = self.run_test(
            "Seed Demo Data",
            "POST",
            "seed",
            200
        )
        return success

    def test_get_artworks(self):
        """Test getting artworks list"""
        success, response = self.run_test(
            "Get Artworks List",
            "GET", 
            "artworks",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} artworks")
            return len(response) > 0
        return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test.user.{timestamp}@artchain.test",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['user_id']
            print(f"   Registered user: {response['user']['email']}")
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.user_id:
            print("   Skipping login test - no registered user")
            return True
            
        # We'll use the token from registration for subsequent tests
        success, response = self.run_test(
            "Get Current User Info",
            "GET",
            "auth/me",
            200
        )
        
        if success and 'user_id' in response:
            print(f"   Authenticated as: {response['email']}")
            return True
        return False

    def test_artwork_detail(self):
        """Test getting artwork details"""
        # First get artworks list to get an ID
        success, artworks = self.run_test(
            "Get Artworks for Detail Test",
            "GET",
            "artworks", 
            200
        )
        
        if success and artworks and len(artworks) > 0:
            artwork_id = artworks[0]['artwork_id']
            success, response = self.run_test(
                "Get Artwork Detail",
                "GET",
                f"artworks/{artwork_id}",
                200
            )
            if success:
                print(f"   Artwork: {response.get('title', 'Unknown')}")
                return True
        return False

    def test_purchase_flow(self):
        """Test artwork purchase"""
        if not self.token:
            print("   Skipping purchase test - not authenticated")
            return True
            
        # Get available artwork
        success, artworks = self.run_test(
            "Get Artworks for Purchase",
            "GET",
            "artworks",
            200
        )
        
        if success and artworks:
            # Find an unpurchased artwork
            available_artwork = None
            for artwork in artworks:
                if not artwork.get('is_purchased', False):
                    available_artwork = artwork
                    break
            
            if available_artwork:
                purchase_data = {
                    "artwork_id": available_artwork['artwork_id'],
                    "payment_method": "crypto"
                }
                
                success, response = self.run_test(
                    "Purchase Artwork",
                    "POST",
                    "purchase",
                    200,
                    data=purchase_data
                )
                
                if success:
                    print(f"   Purchased: {available_artwork['title']}")
                    print(f"   Total: ${response.get('total', 0)}")
                    return True
            else:
                print("   No available artworks to purchase")
                return True
        return False

    def test_user_artworks(self):
        """Test getting user's owned artworks"""
        if not self.token:
            print("   Skipping user artworks test - not authenticated")
            return True
            
        success, response = self.run_test(
            "Get User Artworks",
            "GET",
            "user/artworks",
            200
        )
        
        if success:
            print(f"   User owns {len(response)} artworks")
            return True
        return False

    def test_marketplace(self):
        """Test marketplace endpoints"""
        success, response = self.run_test(
            "Get Marketplace Listings",
            "GET",
            "marketplace",
            200
        )
        
        if success:
            print(f"   Found {len(response)} marketplace listings")
            return True
        return False

    def test_admin_stats(self):
        """Test admin dashboard stats"""
        if not self.token:
            print("   Skipping admin test - not authenticated")
            return True
            
        success, response = self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200
        )
        
        if success:
            print(f"   Total users: {response.get('total_users', 0)}")
            print(f"   Total artworks: {response.get('total_artworks', 0)}")
            print(f"   Total transactions: {response.get('total_transactions', 0)}")
            return True
        return False

    def test_web3_nonce(self):
        """Test Web3 nonce generation"""
        test_address = "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87"
        
        success, response = self.run_test(
            "Request Web3 Nonce",
            "POST",
            "auth/web3/nonce",
            200,
            data={"address": test_address}
        )
        
        if success and 'nonce' in response:
            print(f"   Generated nonce for address: {test_address}")
            return True
        return False

def main():
    print("🚀 Starting ArtChain API Tests")
    print("=" * 50)
    
    tester = ArtChainAPITester()
    
    # Test sequence
    tests = [
        ("Seed Demo Data", tester.test_seed_data),
        ("Get Artworks", tester.test_get_artworks),
        ("User Registration", tester.test_user_registration),
        ("User Authentication", tester.test_user_login),
        ("Artwork Detail", tester.test_artwork_detail),
        ("Purchase Flow", tester.test_purchase_flow),
        ("User Artworks", tester.test_user_artworks),
        ("Marketplace", tester.test_marketplace),
        ("Admin Stats", tester.test_admin_stats),
        ("Web3 Nonce", tester.test_web3_nonce),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            tester.log_result(test_name, False, f"Exception during test: {str(e)}")
        
        # Small delay between tests
        time.sleep(0.5)
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Save detailed results
    results = {
        "summary": {
            "total_tests": tester.tests_run,
            "passed": tester.tests_passed,
            "failed": tester.tests_run - tester.tests_passed,
            "success_rate": round(tester.tests_passed/tester.tests_run*100, 1) if tester.tests_run > 0 else 0
        },
        "test_details": tester.test_results,
        "timestamp": datetime.now().isoformat()
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    # Return appropriate exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())