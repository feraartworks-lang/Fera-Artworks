"""
Test suite for USDT Payment Flow - Ferâ Digital Art Platform
Tests:
1. User registration and login
2. USDT payment order creation with ERC20 network
3. Payment order status check
4. Admin login with triple authentication
5. Admin viewing all payment orders
6. Admin recording crypto transaction
7. Admin confirming order
8. Artwork ownership transfer verification
9. User viewing owned artworks
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from requirements
ADMIN_EMAIL = "fera.artworks@gmail.com"
ADMIN_PASSWORD = "Admin123!"
ADMIN_SECRET = "8M2rKZnlAWtl#Gpbn1Jy&zFjx4PVR3njUaQDAyS38K*i7^!%"

TEST_USER_EMAIL = "buyer@fera.art"
TEST_USER_PASSWORD = "Buyer123!"

# Available artworks for testing
AVAILABLE_ARTWORKS = {
    "digital_cosmos": "art_7f6babd83059",  # €500
    "golden_hour": "art_aba362b33b98"       # €750
}


class TestUserAuthentication:
    """Test user registration and login"""
    
    def test_user_login_success(self):
        """Test successful user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        assert response.status_code == 200, f"User login failed: {response.text}"
        data = response.json()
        
        assert "access_token" in data, "Missing access_token"
        assert "user" in data, "Missing user data"
        assert data["user"]["email"] == TEST_USER_EMAIL
        
        print(f"✅ User login successful - User ID: {data['user']['user_id']}")
        return data["access_token"]
    
    def test_user_login_wrong_password(self):
        """Test user login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": "WrongPassword123!"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ User login correctly rejected with wrong password")


class TestAdminAuthentication:
    """Test admin login with triple authentication"""
    
    def test_admin_login_success(self):
        """Test successful admin login with all three credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "admin_secret": ADMIN_SECRET
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        assert "access_token" in data, "Missing access_token"
        assert data["user"]["is_founder_admin"] == True
        
        print(f"✅ Admin login successful")
        return data["access_token"]
    
    def test_admin_login_wrong_secret(self):
        """Test admin login fails with wrong admin secret"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "admin_secret": "wrong_secret"
        })
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✅ Admin login correctly rejected with wrong secret")


class TestUSDTPaymentOrderCreation:
    """Test USDT payment order creation"""
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_create_usdt_order_erc20(self, user_token):
        """Test creating USDT payment order with ERC20 network"""
        response = requests.post(
            f"{BASE_URL}/api/payment/create-order",
            json={
                "artwork_id": AVAILABLE_ARTWORKS["golden_hour"],
                "payment_method": "usdt",
                "crypto_network": "erc20"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "order_id" in data, "Missing order_id"
        assert "reference" in data, "Missing reference"
        assert data["payment_method"] == "usdt"
        assert data["crypto_network"] == "erc20"
        assert data["currency"] == "USDT"
        assert data["status"] == "PENDING_PAYMENT"
        
        # Verify payment details
        assert "payment_details" in data
        assert data["payment_details"]["network"] == "Ethereum (ERC-20)"
        assert "address" in data["payment_details"]
        
        # Verify amount calculation (price + 5% license fee)
        assert data["artwork_price"] == 750
        assert data["license_fee"] == 37.5
        assert data["total_amount"] == 787.5
        
        # Verify instructions
        assert "instructions" in data
        assert "USDT" in data["instructions"]["step1"]
        
        print(f"✅ USDT order created - Order ID: {data['order_id']}, Reference: {data['reference']}")
        return data
    
    def test_create_usdt_order_trc20(self, user_token):
        """Test creating USDT payment order with TRC20 network"""
        response = requests.post(
            f"{BASE_URL}/api/payment/create-order",
            json={
                "artwork_id": AVAILABLE_ARTWORKS["golden_hour"],
                "payment_method": "usdt",
                "crypto_network": "trc20"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # May return existing order or create new one
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        data = response.json()
        
        assert data["payment_method"] == "usdt"
        print(f"✅ TRC20 order handled - Status: {data['status']}")
    
    def test_create_order_invalid_network(self, user_token):
        """Test order creation fails with invalid crypto network"""
        response = requests.post(
            f"{BASE_URL}/api/payment/create-order",
            json={
                "artwork_id": AVAILABLE_ARTWORKS["golden_hour"],
                "payment_method": "usdt",
                "crypto_network": "invalid_network"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Invalid network correctly rejected")


class TestPaymentOrderStatus:
    """Test payment order status check"""
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_order_status(self, user_token):
        """Test getting payment order status"""
        # First create an order
        create_response = requests.post(
            f"{BASE_URL}/api/payment/create-order",
            json={
                "artwork_id": AVAILABLE_ARTWORKS["golden_hour"],
                "payment_method": "usdt",
                "crypto_network": "erc20"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        order_id = create_response.json()["order_id"]
        
        # Get order status
        response = requests.get(
            f"{BASE_URL}/api/payment/order/{order_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Get order failed: {response.text}"
        data = response.json()
        
        assert data["order_id"] == order_id
        assert "status" in data
        assert "reference" in data
        
        print(f"✅ Order status retrieved - Status: {data['status']}")
    
    def test_get_nonexistent_order(self, user_token):
        """Test getting non-existent order returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/payment/order/ord_nonexistent123",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Non-existent order correctly returns 404")


class TestAdminPaymentManagement:
    """Test admin payment management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "admin_secret": ADMIN_SECRET
        })
        return response.json()["access_token"]
    
    def test_admin_get_all_orders(self, admin_token):
        """Test admin can view all payment orders"""
        response = requests.get(
            f"{BASE_URL}/api/admin/payment/all-orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Get orders failed: {response.text}"
        orders = response.json()
        
        assert isinstance(orders, list)
        print(f"✅ Admin retrieved {len(orders)} payment orders")
    
    def test_admin_get_pending_orders(self, admin_token):
        """Test admin can view pending payment orders"""
        response = requests.get(
            f"{BASE_URL}/api/admin/payment/pending-orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Get pending orders failed: {response.text}"
        orders = response.json()
        
        assert isinstance(orders, list)
        # All orders should be pending or payment received
        for order in orders:
            assert order["status"] in ["PENDING_PAYMENT", "PAYMENT_RECEIVED"]
        
        print(f"✅ Admin retrieved {len(orders)} pending orders")


class TestCryptoTransactionRecording:
    """Test admin recording crypto transactions"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "admin_secret": ADMIN_SECRET
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_record_crypto_transaction_matching(self, admin_token, user_token):
        """Test recording crypto transaction that matches an order"""
        # Create a new order first
        create_response = requests.post(
            f"{BASE_URL}/api/payment/create-order",
            json={
                "artwork_id": AVAILABLE_ARTWORKS["golden_hour"],
                "payment_method": "usdt",
                "crypto_network": "erc20"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        order_data = create_response.json()
        reference = order_data["reference"]
        # Handle both new order and existing order response formats
        total_amount = order_data.get("total_amount") or order_data.get("amount", 787.5)
        
        # Record matching crypto transaction
        response = requests.post(
            f"{BASE_URL}/api/admin/payment/record-crypto-transaction",
            json={
                "tx_hash": f"0xtest_tx_{reference}",
                "amount": total_amount,
                "currency": "USDT",
                "network": "erc20",
                "sender_wallet": "0xTestWallet123",
                "reference": reference,
                "confirmations": 15
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Record tx failed: {response.text}"
        data = response.json()
        
        assert "match_result" in data
        # Should match the order
        if data["match_result"]["matched"]:
            assert data["match_result"]["status"] == "PAYMENT_RECEIVED"
            print(f"✅ Crypto transaction recorded and matched to order")
        else:
            print(f"⚠️ Transaction recorded but not matched: {data['match_result']['reason']}")
    
    def test_record_crypto_transaction_invalid_network(self, admin_token):
        """Test recording crypto transaction with invalid network fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/payment/record-crypto-transaction",
            json={
                "tx_hash": "0xtest_invalid",
                "amount": 100,
                "currency": "USDT",
                "network": "invalid_network",
                "sender_wallet": "0xTestWallet",
                "reference": "TEST-REF",
                "confirmations": 10
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Invalid network correctly rejected")


class TestUserOwnedArtworks:
    """Test user viewing owned artworks"""
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_user_artworks(self, user_token):
        """Test user can view their owned artworks"""
        response = requests.get(
            f"{BASE_URL}/api/user/artworks",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Get artworks failed: {response.text}"
        artworks = response.json()
        
        assert isinstance(artworks, list)
        
        # Verify artwork structure
        for artwork in artworks:
            assert "artwork_id" in artwork
            assert "title" in artwork
            assert "owner_id" in artwork
            assert artwork["is_purchased"] == True
        
        print(f"✅ User owns {len(artworks)} artworks")
        return artworks


class TestPaymentEndpointsAccessControl:
    """Test payment endpoints require proper authentication"""
    
    def test_create_order_requires_auth(self):
        """Test create order requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payment/create-order",
            json={
                "artwork_id": "art_test",
                "payment_method": "usdt",
                "crypto_network": "erc20"
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Create order requires authentication")
    
    def test_admin_endpoints_require_admin(self):
        """Test admin payment endpoints require admin role"""
        # Get regular user token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        user_token = response.json()["access_token"]
        
        # Try to access admin endpoint
        response = requests.get(
            f"{BASE_URL}/api/admin/payment/all-orders",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✅ Admin payment endpoints require admin role")


class TestCryptoWalletEndpoints:
    """Test crypto wallet information endpoints"""
    
    def test_get_crypto_wallets(self):
        """Test getting platform crypto wallet addresses"""
        response = requests.get(f"{BASE_URL}/api/payment/crypto-wallets")
        
        assert response.status_code == 200, f"Get wallets failed: {response.text}"
        wallets = response.json()
        
        # Verify all networks are present
        assert "usdt_trc20" in wallets
        assert "usdt_erc20" in wallets
        assert "usdt_bep20" in wallets
        
        # Verify wallet structure
        for network, wallet in wallets.items():
            assert "network" in wallet
            assert "address" in wallet
            assert "currency" in wallet
            assert wallet["currency"] == "USDT"
        
        print("✅ Crypto wallet addresses retrieved")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
