"""
Test suite for Bank Info Feature - Admin Panel and User Dashboard
Tests:
1. Admin login with triple authentication (email + password + admin secret)
2. Admin Users page - Bank Info column visibility
3. User bank info save endpoint (/api/user/bank-info PUT)
4. Admin can view user bank info after user saves it
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from requirements
ADMIN_EMAIL = "founder@artchain.com"
ADMIN_PASSWORD = "Admin123!"
ADMIN_SECRET = "ArtChain_Founder_SecureKey_2024_XYZ"

TEST_USER_EMAIL = "admin@artchain.com"
TEST_USER_PASSWORD = "Test123!"

# Test bank info data
TEST_BANK_INFO = {
    "iban": "TR330006100519786457841326",
    "bank_name": "Ziraat Bankası",
    "account_holder_name": "Test User Account",
    "swift_bic": "TCZBTR2A"
}


class TestAdminTripleAuthentication:
    """Test admin login with triple authentication (email + password + admin secret)"""
    
    def test_admin_login_success(self):
        """Test successful admin login with all three credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "admin_secret": ADMIN_SECRET
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["is_founder_admin"] == True, "User should be founder admin"
        assert data["user"]["email"] == ADMIN_EMAIL, "Email mismatch"
        
        print(f"✅ Admin login successful - Token received")
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
    
    def test_admin_login_wrong_email(self):
        """Test admin login fails with non-founder email"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "notadmin@artchain.com",
            "password": ADMIN_PASSWORD,
            "admin_secret": ADMIN_SECRET
        })
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✅ Admin login correctly rejected with non-founder email")
    
    def test_admin_login_wrong_password(self):
        """Test admin login fails with wrong password"""
        # First ensure admin exists by doing a successful login
        requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "admin_secret": ADMIN_SECRET
        })
        
        # Now try with wrong password
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": "WrongPassword123!",
            "admin_secret": ADMIN_SECRET
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Admin login correctly rejected with wrong password")


class TestUserBankInfoEndpoint:
    """Test user bank info save and retrieve endpoints"""
    
    @pytest.fixture
    def user_token(self):
        """Get or create test user and return token"""
        # Try to login first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if response.status_code == 200:
            return response.json()["access_token"]
        
        # If login fails, register new user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": "Test User"
        })
        
        if response.status_code == 200:
            return response.json()["access_token"]
        elif response.status_code == 400:  # Email already registered
            # Try login again
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            assert response.status_code == 200, f"Failed to login: {response.text}"
            return response.json()["access_token"]
        
        pytest.fail(f"Failed to get user token: {response.text}")
    
    def test_get_bank_info_empty(self, user_token):
        """Test getting bank info when none is set"""
        response = requests.get(
            f"{BASE_URL}/api/user/bank-info",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get bank info: {response.text}"
        data = response.json()
        
        # Should return empty/null values
        assert "iban" in data, "Missing iban field"
        assert "bank_name" in data, "Missing bank_name field"
        assert "account_holder_name" in data, "Missing account_holder_name field"
        assert "swift_bic" in data, "Missing swift_bic field"
        
        print("✅ GET /api/user/bank-info returns correct structure")
    
    def test_save_bank_info(self, user_token):
        """Test saving bank information"""
        response = requests.put(
            f"{BASE_URL}/api/user/bank-info",
            json=TEST_BANK_INFO,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Failed to save bank info: {response.text}"
        data = response.json()
        assert "message" in data, "Missing success message"
        
        print("✅ PUT /api/user/bank-info saves successfully")
    
    def test_verify_bank_info_saved(self, user_token):
        """Test that saved bank info can be retrieved"""
        # First save the bank info
        requests.put(
            f"{BASE_URL}/api/user/bank-info",
            json=TEST_BANK_INFO,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Then retrieve it
        response = requests.get(
            f"{BASE_URL}/api/user/bank-info",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get bank info: {response.text}"
        data = response.json()
        
        # Verify saved values
        assert data["iban"] == TEST_BANK_INFO["iban"], f"IBAN mismatch: {data['iban']}"
        assert data["bank_name"] == TEST_BANK_INFO["bank_name"], f"Bank name mismatch"
        assert data["account_holder_name"] == TEST_BANK_INFO["account_holder_name"], f"Account holder mismatch"
        assert data["swift_bic"] == TEST_BANK_INFO["swift_bic"], f"SWIFT/BIC mismatch"
        
        print("✅ Bank info persisted correctly in database")
    
    def test_partial_bank_info_update(self, user_token):
        """Test updating only some bank info fields"""
        # Update only IBAN
        response = requests.put(
            f"{BASE_URL}/api/user/bank-info",
            json={"iban": "DE89370400440532013000"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Failed to update bank info: {response.text}"
        
        # Verify only IBAN changed
        response = requests.get(
            f"{BASE_URL}/api/user/bank-info",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        data = response.json()
        assert data["iban"] == "DE89370400440532013000", "IBAN not updated"
        
        print("✅ Partial bank info update works correctly")


class TestAdminViewUserBankInfo:
    """Test admin can view user bank info"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "admin_secret": ADMIN_SECRET
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture
    def setup_user_with_bank_info(self):
        """Create/login user and set bank info"""
        # Login or register user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": "Test User"
            })
        
        if response.status_code == 400:  # Already registered
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
        
        token = response.json()["access_token"]
        user_id = response.json()["user"]["user_id"]
        
        # Save bank info
        requests.put(
            f"{BASE_URL}/api/user/bank-info",
            json=TEST_BANK_INFO,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        return {"token": token, "user_id": user_id}
    
    def test_admin_get_users_list(self, admin_token):
        """Test admin can get list of all users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        users = response.json()
        
        assert isinstance(users, list), "Response should be a list"
        print(f"✅ Admin can view {len(users)} users")
        return users
    
    def test_admin_sees_user_bank_info(self, admin_token, setup_user_with_bank_info):
        """Test admin can see user's bank info in users list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        users = response.json()
        
        # Find our test user
        test_user = None
        for user in users:
            if user.get("email") == TEST_USER_EMAIL:
                test_user = user
                break
        
        assert test_user is not None, f"Test user {TEST_USER_EMAIL} not found in users list"
        
        # Verify bank info is visible to admin
        assert test_user.get("iban") == TEST_BANK_INFO["iban"], f"IBAN not visible to admin: {test_user.get('iban')}"
        assert test_user.get("bank_name") == TEST_BANK_INFO["bank_name"], f"Bank name not visible to admin"
        assert test_user.get("account_holder_name") == TEST_BANK_INFO["account_holder_name"], f"Account holder not visible"
        assert test_user.get("swift_bic") == TEST_BANK_INFO["swift_bic"], f"SWIFT/BIC not visible"
        
        print("✅ Admin can see user's bank information")
    
    def test_admin_verify_endpoint(self, admin_token):
        """Test admin verify endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/verify",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Admin verify failed: {response.text}"
        data = response.json()
        assert data["verified"] == True, "Admin should be verified"
        
        print("✅ Admin verify endpoint works")


class TestAdminAccessControl:
    """Test admin endpoints require proper authentication"""
    
    def test_admin_users_requires_auth(self):
        """Test /admin/users requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Admin users endpoint requires authentication")
    
    def test_admin_users_requires_admin_role(self):
        """Test /admin/users requires admin role, not just any user"""
        # Login as regular user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": "Test User"
            })
        
        if response.status_code == 400:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
        
        user_token = response.json()["access_token"]
        
        # Try to access admin endpoint
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✅ Admin users endpoint requires admin role")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
