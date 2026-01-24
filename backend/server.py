from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Request, UploadFile, File, Response, Form
from fastapi.responses import StreamingResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import secrets
import hashlib
import jwt
import bcrypt
from eth_account import Account
from eth_account.messages import encode_defunct
import httpx
import base64
import io
import csv
import json
import pyotp
import qrcode

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 168  # 7 days

# FOUNDER ADMIN Configuration - Only ONE admin can exist
FOUNDER_ADMIN_EMAIL = os.environ.get('FOUNDER_ADMIN_EMAIL', 'founder@artchain.com')
FOUNDER_ADMIN_SECRET = os.environ.get('FOUNDER_ADMIN_SECRET', 'ArtChain_Founder_2024_SecretKey')

# Upload directory for artworks
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="ArtChain - Digital Art Ownership Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    wallet_address: Optional[str] = None
    balance: float = 0.0
    created_at: datetime

class Web3NonceRequest(BaseModel):
    address: str

class Web3NonceResponse(BaseModel):
    nonce: str
    message: str

class Web3VerifyRequest(BaseModel):
    address: str
    signature: str
    nonce: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ArtworkCreate(BaseModel):
    title: str
    description: str
    price: float
    artist_name: str
    category: str = "digital"
    tags: List[str] = []

class ArtworkResponse(BaseModel):
    artwork_id: str
    title: str
    description: str
    price: float
    artist_name: str
    category: str
    tags: List[str]
    preview_url: str
    is_purchased: bool = False
    is_used: bool = False
    is_transferred: bool = False
    is_refunded: bool = False
    owner_id: Optional[str] = None
    created_at: datetime
    license_protection_fee: float = 0.0

class PurchaseRequest(BaseModel):
    artwork_id: str
    payment_method: str  # "crypto" or "bank"

class ListForSaleRequest(BaseModel):
    artwork_id: str
    sale_price: float

class MarketplaceListingResponse(BaseModel):
    listing_id: str
    artwork_id: str
    artwork: ArtworkResponse
    seller_id: str
    sale_price: float
    platform_commission: float
    created_at: datetime

class RefundRequest(BaseModel):
    artwork_id: str

class WithdrawalRequest(BaseModel):
    amount: float
    method: str  # "bank" or "crypto"
    destination: str  # bank account or wallet address

class TransactionResponse(BaseModel):
    transaction_id: str
    type: str
    amount: float
    fee: float
    status: str
    created_at: datetime
    details: Dict[str, Any] = {}

# ==================== ADMIN MODELS ====================

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str
    admin_secret: str  # Extra security layer

class AdminArtworkCreate(BaseModel):
    title: str
    description: str
    price: float
    artist_name: str
    category: str = "digital"
    tags: str = ""  # Comma-separated

class AdminArtworkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    artist_name: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None

class AdminUserAction(BaseModel):
    user_id: str
    action: str  # "ban", "suspend", "unban", "unsuspend"
    reason: Optional[str] = None
    duration_days: Optional[int] = None  # For suspend

class AdminManualRefund(BaseModel):
    artwork_id: str
    user_id: str
    reason: str

class AdminManualTransfer(BaseModel):
    artwork_id: str
    from_user_id: str
    to_user_id: str
    reason: str

class AlertCreate(BaseModel):
    type: str  # "error", "warning", "info", "critical"
    title: str
    message: str
    source: str  # "system", "user", "transaction", "security"

class BankInfoUpdate(BaseModel):
    iban: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    swift_bic: Optional[str] = None

class TwoFactorSetup(BaseModel):
    password: str

class TwoFactorVerify(BaseModel):
    code: str

class AdminLoginWith2FA(BaseModel):
    email: EmailStr
    password: str
    admin_secret: str
    totp_code: Optional[str] = None

# ==================== A2A PAYMENT MODELS ====================

class PlatformBankAccount(BaseModel):
    """Platform's bank account for receiving payments"""
    iban: str
    bank_name: str
    account_holder: str
    swift_bic: str
    currency: str = "EUR"

class PaymentOrderCreate(BaseModel):
    """Create a new payment order for artwork purchase"""
    artwork_id: str
    payment_method: str = "bank_transfer"  # "bank_transfer" or "usdt"
    crypto_network: Optional[str] = None  # "trc20", "erc20", "bep20"

class PaymentOrderStatus(BaseModel):
    """Payment order status update"""
    status: str  # PENDING_PAYMENT, PAYMENT_RECEIVED, CONFIRMED, DELIVERED, CANCELLED, REFUNDED

class BankTransactionRecord(BaseModel):
    """Record incoming bank transaction for reconciliation"""
    transaction_id: str
    amount: float
    currency: str
    sender_name: str
    sender_iban: Optional[str] = None
    reference: str
    transaction_date: datetime
    bank_statement_id: Optional[str] = None

class CryptoTransactionRecord(BaseModel):
    """Record incoming crypto transaction for reconciliation"""
    tx_hash: str
    amount: float
    currency: str = "USDT"
    network: str  # "trc20", "erc20", "bep20"
    sender_wallet: str
    reference: str  # From memo/note field
    confirmations: int = 0

class RefundRequest(BaseModel):
    """Admin-initiated refund request"""
    order_id: str
    reason: str
    refund_amount: Optional[float] = None  # Full refund if None

# ==================== HELPER FUNCTIONS ====================

def generate_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:12]}"

def generate_payment_reference() -> str:
    """Generate unique payment reference: IAG-YYYY-XXXXXX"""
    year = datetime.now().year
    random_part = secrets.token_hex(3).upper()  # 6 hex characters
    sequence = secrets.randbelow(1000000)
    return f"IAG-{year}-{sequence:06d}-{random_part}"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(request: Request) -> dict:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one(
            {"session_token": session_token},
            {"_id": 0}
        )
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one(
                    {"user_id": session["user_id"]},
                    {"_id": 0}
                )
                if user:
                    return user
    
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    payload = verify_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await db.users.find_one(
        {"user_id": payload["sub"]},
        {"_id": 0}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

async def create_audit_log(action: str, user_id: str, details: dict, artwork_id: str = None):
    """
    Create encrypted audit log.
    - Logs are stored without expiration initially
    - When a refund occurs, all related logs get expires_at set to 3 days from refund
    - TTL index automatically deletes expired logs
    """
    log_data = {
        "log_id": generate_id("log_"),
        "action": action,
        "user_id": user_id,
        "artwork_id": artwork_id,
        "details": details,
        "created_at": datetime.now(timezone.utc),
        "expires_at": None  # No expiration until refund occurs
    }
    await db.audit_logs.insert_one(log_data)
    # Create TTL index if not exists (only deletes when expires_at is set)
    await db.audit_logs.create_index("expires_at", expireAfterSeconds=0)

async def set_audit_logs_expiration(artwork_id: str):
    """
    Set expiration for all audit logs related to an artwork after refund.
    Logs will be automatically deleted 3 days after refund.
    """
    expires_at = datetime.now(timezone.utc) + timedelta(days=3)
    await db.audit_logs.update_many(
        {"artwork_id": artwork_id},
        {"$set": {"expires_at": expires_at}}
    )

async def get_founder_admin(request: Request) -> dict:
    """
    Verify that the request is from the FOUNDER ADMIN.
    Only ONE admin exists - the founder.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    token = auth_header.split(" ")[1]
    payload = verify_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")
    
    # Check if this is the founder admin
    user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("is_founder_admin"):
        raise HTTPException(status_code=403, detail="Access denied. Only the founder admin can access this resource.")
    
    return user

async def create_system_alert(alert_type: str, title: str, message: str, source: str, details: dict = None):
    """Create a system alert for admin notification"""
    alert = {
        "alert_id": generate_id("alert_"),
        "type": alert_type,  # critical, error, warning, info
        "title": title,
        "message": message,
        "source": source,
        "details": details or {},
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.admin_alerts.insert_one(alert)
    return alert

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = generate_id("user_")
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "picture": None,
        "wallet_address": None,
        "balance": 0.0,
        "created_at": datetime.now(timezone.utc),
        "auth_type": "email"
    }
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email)
    
    user_response = UserResponse(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        balance=0.0,
        created_at=user_doc["created_at"]
    )
    
    await create_audit_log("user_registered", user_id, {"email": user_data.email})
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"], user["email"])
    
    user_response = UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture"),
        wallet_address=user.get("wallet_address"),
        balance=user.get("balance", 0.0),
        created_at=user["created_at"] if isinstance(user["created_at"], datetime) else datetime.fromisoformat(user["created_at"])
    )
    
    await create_audit_log("user_login", user["user_id"], {"method": "email"})
    
    return TokenResponse(access_token=token, user=user_response)

# Google OAuth Session Endpoint
@api_router.get("/auth/session")
async def get_session_data(request: Request, response: Response):
    """Exchange session_id for session data from Emergent Auth"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    async with httpx.AsyncClient() as client_http:
        auth_response = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data.get("name", existing_user["name"]),
                "picture": auth_data.get("picture"),
                "last_login": datetime.now(timezone.utc)
            }}
        )
    else:
        user_id = generate_id("user_")
        user_doc = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data.get("name", "User"),
            "picture": auth_data.get("picture"),
            "wallet_address": None,
            "balance": 0.0,
            "created_at": datetime.now(timezone.utc),
            "auth_type": "google"
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    session_token = auth_data.get("session_token", secrets.token_urlsafe(32))
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    # Create JWT token for API calls
    jwt_token = create_jwt_token(user_id, user["email"])
    
    await create_audit_log("user_login", user_id, {"method": "google"})
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "wallet_address": user.get("wallet_address"),
        "balance": user.get("balance", 0.0),
        "access_token": jwt_token
    }

# Web3 Authentication
@api_router.post("/auth/web3/nonce", response_model=Web3NonceResponse)
async def request_web3_nonce(request: Web3NonceRequest):
    address = request.address.lower()
    nonce = secrets.token_hex(16)
    timestamp = datetime.now(timezone.utc)
    
    await db.web3_nonces.update_one(
        {"address": address},
        {
            "$set": {
                "nonce": nonce,
                "created_at": timestamp,
                "expires_at": timestamp + timedelta(minutes=10)
            }
        },
        upsert=True
    )
    
    message = f"Sign this message to authenticate with ArtChain.\n\nWallet: {address}\nNonce: {nonce}\nTimestamp: {timestamp.isoformat()}"
    
    return Web3NonceResponse(nonce=nonce, message=message)

@api_router.post("/auth/web3/verify", response_model=TokenResponse)
async def verify_web3_signature(request: Web3VerifyRequest):
    address = request.address.lower()
    
    nonce_doc = await db.web3_nonces.find_one({"address": address}, {"_id": 0})
    if not nonce_doc:
        raise HTTPException(status_code=401, detail="Nonce not found")
    
    expires_at = nonce_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.web3_nonces.delete_one({"address": address})
        raise HTTPException(status_code=401, detail="Nonce expired")
    
    # Reconstruct message
    created_at = nonce_doc["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    message = f"Sign this message to authenticate with ArtChain.\n\nWallet: {address}\nNonce: {nonce_doc['nonce']}\nTimestamp: {created_at.isoformat()}"
    
    # Verify signature
    try:
        message_encoded = encode_defunct(text=message)
        recovered_address = Account.recover_message(message_encoded, signature=request.signature)
        if recovered_address.lower() != address:
            raise HTTPException(status_code=401, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Signature verification error: {e}")
        raise HTTPException(status_code=401, detail="Signature verification failed")
    
    # Delete used nonce
    await db.web3_nonces.delete_one({"address": address})
    
    # Check if user exists with this wallet
    existing_user = await db.users.find_one({"wallet_address": address}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
    else:
        user_id = generate_id("user_")
        user_doc = {
            "user_id": user_id,
            "email": f"{address[:8]}@wallet.artchain",
            "name": f"Wallet {address[:8]}...",
            "picture": None,
            "wallet_address": address,
            "balance": 0.0,
            "created_at": datetime.now(timezone.utc),
            "auth_type": "web3"
        }
        await db.users.insert_one(user_doc)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    token = create_jwt_token(user_id, user["email"])
    
    user_response = UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture"),
        wallet_address=user.get("wallet_address"),
        balance=user.get("balance", 0.0),
        created_at=user["created_at"] if isinstance(user["created_at"], datetime) else datetime.fromisoformat(user["created_at"])
    )
    
    await create_audit_log("user_login", user_id, {"method": "web3", "wallet": address})
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me")
async def get_current_user_info(request: Request):
    user = await get_current_user(request)
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "wallet_address": user.get("wallet_address"),
        "balance": user.get("balance", 0.0)
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.post("/auth/connect-wallet")
async def connect_wallet(request: Request, wallet_data: Web3NonceRequest):
    user = await get_current_user(request)
    address = wallet_data.address.lower()
    
    # Check if wallet is already connected to another account
    existing = await db.users.find_one({"wallet_address": address, "user_id": {"$ne": user["user_id"]}}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Wallet already connected to another account")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"wallet_address": address}}
    )
    
    return {"message": "Wallet connected successfully", "wallet_address": address}

# ==================== ARTWORK ENDPOINTS ====================

@api_router.get("/artworks", response_model=List[ArtworkResponse])
async def get_artworks(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"artist_name": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search.lower()]}}
        ]
    
    artworks = await db.artworks.find(query, {"_id": 0}).to_list(100)
    return artworks

@api_router.get("/artworks/{artwork_id}", response_model=ArtworkResponse)
async def get_artwork(artwork_id: str):
    artwork = await db.artworks.find_one({"artwork_id": artwork_id}, {"_id": 0})
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    return artwork

@api_router.post("/artworks", response_model=ArtworkResponse)
async def create_artwork(
    request: Request,
    title: str,
    description: str,
    price: float,
    artist_name: str,
    category: str = "digital",
    tags: str = "",
    file: UploadFile = File(...)
):
    """Admin endpoint to create artwork (for demo purposes, no admin check)"""
    artwork_id = generate_id("art_")
    
    # Save file
    file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
    file_path = UPLOAD_DIR / f"{artwork_id}.{file_ext}"
    preview_path = UPLOAD_DIR / f"{artwork_id}_preview.{file_ext}"
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # For demo, preview is same as original (in production, add watermark)
    with open(preview_path, "wb") as f:
        f.write(content)
    
    tags_list = [t.strip().lower() for t in tags.split(",") if t.strip()]
    
    artwork_doc = {
        "artwork_id": artwork_id,
        "title": title,
        "description": description,
        "price": price,
        "artist_name": artist_name,
        "category": category,
        "tags": tags_list,
        "file_path": str(file_path),
        "preview_url": f"/api/artworks/{artwork_id}/preview",
        "is_purchased": False,
        "is_used": False,
        "is_transferred": False,
        "is_refunded": False,
        "owner_id": None,
        "created_at": datetime.now(timezone.utc),
        "license_protection_fee": price * 0.05
    }
    await db.artworks.insert_one(artwork_doc)
    
    return ArtworkResponse(**artwork_doc)

@api_router.get("/artworks/{artwork_id}/preview")
async def get_artwork_preview(artwork_id: str):
    artwork = await db.artworks.find_one({"artwork_id": artwork_id}, {"_id": 0})
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    file_path = artwork.get("file_path")
    if file_path and Path(file_path).exists():
        return FileResponse(file_path)
    
    raise HTTPException(status_code=404, detail="Preview not found")

@api_router.get("/artworks/{artwork_id}/secure-view")
async def secure_view_artwork(artwork_id: str, request: Request):
    """Secure viewer - only for owners who haven't downloaded"""
    user = await get_current_user(request)
    artwork = await db.artworks.find_one({"artwork_id": artwork_id}, {"_id": 0})
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    if artwork["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="You don't own this artwork")
    
    if artwork["is_used"]:
        raise HTTPException(status_code=403, detail="Artwork already downloaded - use your local copy")
    
    file_path = artwork.get("file_path")
    if file_path and Path(file_path).exists():
        # Return as streaming response with no-cache headers
        def iterfile():
            with open(file_path, "rb") as f:
                yield from f
        
        return StreamingResponse(
            iterfile(),
            media_type="image/jpeg",
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache",
                "X-Content-Type-Options": "nosniff"
            }
        )
    
    raise HTTPException(status_code=404, detail="File not found")

@api_router.post("/artworks/{artwork_id}/download")
async def download_artwork(artwork_id: str, request: Request):
    """Download full resolution - marks as used, disables refund/transfer"""
    user = await get_current_user(request)
    artwork = await db.artworks.find_one({"artwork_id": artwork_id}, {"_id": 0})
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    if artwork["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="You don't own this artwork")
    
    if artwork["is_used"]:
        raise HTTPException(status_code=400, detail="Artwork already downloaded")
    
    # Mark as used - IRREVERSIBLE
    await db.artworks.update_one(
        {"artwork_id": artwork_id},
        {"$set": {"is_used": True}}
    )
    
    await create_audit_log("artwork_downloaded", user["user_id"], {
        "artwork_id": artwork_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }, artwork_id=artwork_id)
    
    file_path = artwork.get("file_path")
    if file_path and Path(file_path).exists():
        return FileResponse(
            file_path,
            filename=f"{artwork['title']}.jpg",
            media_type="image/jpeg"
        )
    
    raise HTTPException(status_code=404, detail="File not found")

# ==================== PURCHASE ENDPOINTS ====================

@api_router.post("/purchase")
async def purchase_artwork(purchase: PurchaseRequest, request: Request):
    user = await get_current_user(request)
    artwork = await db.artworks.find_one({"artwork_id": purchase.artwork_id}, {"_id": 0})
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    if artwork["is_purchased"] and not artwork["is_refunded"]:
        raise HTTPException(status_code=400, detail="Artwork already owned")
    
    # Calculate total (price + 5% license protection fee)
    base_price = artwork["price"]
    license_fee = base_price * 0.05
    total = base_price + license_fee
    
    # Create transaction
    transaction_id = generate_id("txn_")
    transaction = {
        "transaction_id": transaction_id,
        "type": "purchase",
        "user_id": user["user_id"],
        "artwork_id": purchase.artwork_id,
        "amount": base_price,
        "fee": license_fee,
        "total": total,
        "payment_method": purchase.payment_method,
        "status": "completed",
        "created_at": datetime.now(timezone.utc)
    }
    await db.transactions.insert_one(transaction)
    
    # Update artwork ownership
    await db.artworks.update_one(
        {"artwork_id": purchase.artwork_id},
        {
            "$set": {
                "is_purchased": True,
                "is_refunded": False,
                "owner_id": user["user_id"],
                "purchased_at": datetime.now(timezone.utc),
                "purchase_price": base_price
            }
        }
    )
    
    await create_audit_log("artwork_purchased", user["user_id"], {
        "artwork_id": purchase.artwork_id,
        "amount": total,
        "method": purchase.payment_method
    }, artwork_id=purchase.artwork_id)
    
    return {
        "message": "Purchase successful",
        "transaction_id": transaction_id,
        "total": total,
        "base_price": base_price,
        "license_fee": license_fee
    }

# ==================== P2P MARKETPLACE ENDPOINTS ====================

@api_router.get("/marketplace")
async def get_marketplace_listings():
    # Use aggregation pipeline to avoid N+1 query problem
    pipeline = [
        {"$match": {"status": "active"}},
        {"$lookup": {
            "from": "artworks",
            "localField": "artwork_id",
            "foreignField": "artwork_id",
            "as": "artwork_data"
        }},
        {"$unwind": {"path": "$artwork_data", "preserveNullAndEmptyArrays": False}},
        {"$addFields": {"artwork": "$artwork_data"}},
        {"$project": {"_id": 0, "artwork_data": 0, "artwork._id": 0}},
        {"$limit": 100}
    ]
    
    listings = await db.marketplace_listings.aggregate(pipeline).to_list(100)
    return listings

@api_router.post("/marketplace/list")
async def list_for_sale(listing: ListForSaleRequest, request: Request):
    user = await get_current_user(request)
    artwork = await db.artworks.find_one({"artwork_id": listing.artwork_id}, {"_id": 0})
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    if artwork["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="You don't own this artwork")
    
    if artwork["is_used"]:
        raise HTTPException(status_code=400, detail="Cannot sell - artwork has been downloaded")
    
    if artwork["is_transferred"]:
        raise HTTPException(status_code=400, detail="Artwork already transferred")
    
    # Minimum price must be at least 1% higher than original to cover commission
    original_price = artwork.get("purchase_price", artwork["price"])
    min_price = original_price * 1.01
    if listing.sale_price < min_price:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum sale price is {min_price:.2f} (1% above purchase price)"
        )
    
    listing_id = generate_id("lst_")
    listing_doc = {
        "listing_id": listing_id,
        "artwork_id": listing.artwork_id,
        "seller_id": user["user_id"],
        "sale_price": listing.sale_price,
        "platform_commission": listing.sale_price * 0.01,
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    await db.marketplace_listings.insert_one(listing_doc)
    
    return {"message": "Artwork listed for sale", "listing_id": listing_id}

@api_router.post("/marketplace/buy/{listing_id}")
async def buy_from_marketplace(listing_id: str, request: Request):
    user = await get_current_user(request)
    listing = await db.marketplace_listings.find_one(
        {"listing_id": listing_id, "status": "active"},
        {"_id": 0}
    )
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["seller_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot buy your own listing")
    
    artwork = await db.artworks.find_one({"artwork_id": listing["artwork_id"]}, {"_id": 0})
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    # Process transfer
    sale_price = listing["sale_price"]
    commission = sale_price * 0.01
    seller_receives = sale_price - commission
    
    # Create transaction
    transaction_id = generate_id("txn_")
    transaction = {
        "transaction_id": transaction_id,
        "type": "p2p_sale",
        "buyer_id": user["user_id"],
        "seller_id": listing["seller_id"],
        "artwork_id": listing["artwork_id"],
        "amount": sale_price,
        "commission": commission,
        "seller_receives": seller_receives,
        "status": "completed",
        "created_at": datetime.now(timezone.utc)
    }
    await db.transactions.insert_one(transaction)
    
    # Update artwork - transfer ownership
    await db.artworks.update_one(
        {"artwork_id": listing["artwork_id"]},
        {
            "$set": {
                "owner_id": user["user_id"],
                "is_transferred": True,
                "transferred_at": datetime.now(timezone.utc),
                "purchase_price": sale_price
            }
        }
    )
    
    # Credit seller balance
    await db.users.update_one(
        {"user_id": listing["seller_id"]},
        {"$inc": {"balance": seller_receives}}
    )
    
    # Close listing
    await db.marketplace_listings.update_one(
        {"listing_id": listing_id},
        {"$set": {"status": "sold"}}
    )
    
    await create_audit_log("p2p_sale", user["user_id"], {
        "artwork_id": listing["artwork_id"],
        "seller_id": listing["seller_id"],
        "amount": sale_price
    }, artwork_id=listing["artwork_id"])
    
    return {
        "message": "Purchase successful",
        "transaction_id": transaction_id,
        "amount": sale_price
    }

@api_router.delete("/marketplace/{listing_id}")
async def cancel_listing(listing_id: str, request: Request):
    user = await get_current_user(request)
    listing = await db.marketplace_listings.find_one(
        {"listing_id": listing_id},
        {"_id": 0}
    )
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["seller_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    
    await db.marketplace_listings.update_one(
        {"listing_id": listing_id},
        {"$set": {"status": "cancelled"}}
    )
    
    return {"message": "Listing cancelled"}

# ==================== REFUND ENDPOINTS ====================

@api_router.post("/refund")
async def request_refund(refund: RefundRequest, request: Request):
    user = await get_current_user(request)
    artwork = await db.artworks.find_one({"artwork_id": refund.artwork_id}, {"_id": 0})
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    if artwork["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="You don't own this artwork")
    
    if artwork["is_used"]:
        raise HTTPException(status_code=400, detail="Cannot refund - artwork has been downloaded")
    
    if artwork["is_transferred"]:
        raise HTTPException(status_code=400, detail="Cannot refund - artwork was transferred")
    
    if artwork["is_refunded"]:
        raise HTTPException(status_code=400, detail="Already refunded")
    
    # Calculate refund (base price only, not license fee)
    refund_amount = artwork.get("purchase_price", artwork["price"])
    
    # Create refund transaction
    transaction_id = generate_id("txn_")
    transaction = {
        "transaction_id": transaction_id,
        "type": "refund",
        "user_id": user["user_id"],
        "artwork_id": refund.artwork_id,
        "amount": refund_amount,
        "status": "completed",
        "created_at": datetime.now(timezone.utc)
    }
    await db.transactions.insert_one(transaction)
    
    # Update artwork
    await db.artworks.update_one(
        {"artwork_id": refund.artwork_id},
        {
            "$set": {
                "is_refunded": True,
                "is_purchased": False,
                "owner_id": None,
                "refunded_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Credit user balance
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"balance": refund_amount}}
    )
    
    await create_audit_log("refund_processed", user["user_id"], {
        "artwork_id": refund.artwork_id,
        "amount": refund_amount
    }, artwork_id=refund.artwork_id)
    
    # Set expiration for all audit logs related to this artwork
    # Logs will be automatically deleted 3 days after refund
    await set_audit_logs_expiration(refund.artwork_id)
    
    return {
        "message": "Refund processed",
        "transaction_id": transaction_id,
        "refund_amount": refund_amount,
        "note": "License protection fee (5%) is non-refundable"
    }

# ==================== A2A PAYMENT SYSTEM ====================

# Platform Bank Account Configuration (would be in .env in production)
PLATFORM_BANK = {
    "iban": "TR33 0006 1005 1978 6457 8413 26",
    "bank_name": "Ziraat Bankası",
    "account_holder": "Imperial Art Gallery Ltd.",
    "swift_bic": "TCZBTR2A",
    "currency": "EUR"
}

# Platform Crypto Wallet Configuration for USDT
PLATFORM_CRYPTO = {
    "usdt_trc20": {
        "network": "Tron (TRC-20)",
        "address": "TYourTronUSDTAddressHere123456789",
        "currency": "USDT",
        "min_confirmations": 19
    },
    "usdt_erc20": {
        "network": "Ethereum (ERC-20)",
        "address": "0xYourEthereumUSDTAddressHere123456789",
        "currency": "USDT",
        "min_confirmations": 12
    },
    "usdt_bep20": {
        "network": "BSC (BEP-20)",
        "address": "0xYourBSCUSDTAddressHere123456789",
        "currency": "USDT",
        "min_confirmations": 15
    }
}

@api_router.get("/payment/bank-details")
async def get_platform_bank_details():
    """Get platform's bank account details for payment"""
    return PLATFORM_BANK

@api_router.get("/payment/crypto-wallets")
async def get_platform_crypto_wallets():
    """Get platform's crypto wallet addresses for USDT payment"""
    return PLATFORM_CRYPTO

@api_router.post("/payment/create-order")
async def create_payment_order(order_data: PaymentOrderCreate, request: Request):
    """
    Create a payment order for artwork purchase.
    Supports bank transfer (EUR) and USDT crypto payments.
    """
    user = await get_current_user(request)
    
    # Validate payment method
    if order_data.payment_method not in ["bank_transfer", "usdt"]:
        raise HTTPException(status_code=400, detail="Invalid payment method")
    
    if order_data.payment_method == "usdt" and order_data.crypto_network not in ["trc20", "erc20", "bep20"]:
        raise HTTPException(status_code=400, detail="Invalid crypto network. Use: trc20, erc20, or bep20")
    
    # Get artwork
    artwork = await db.artworks.find_one({"artwork_id": order_data.artwork_id}, {"_id": 0})
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    if artwork.get("is_purchased"):
        raise HTTPException(status_code=400, detail="Artwork already sold")
    
    # Check for existing pending order for same artwork by same user
    existing_order = await db.payment_orders.find_one({
        "artwork_id": order_data.artwork_id,
        "buyer_id": user["user_id"],
        "status": "PENDING_PAYMENT"
    })
    
    if existing_order:
        # Return existing order
        payment_details = PLATFORM_BANK if existing_order["payment_method"] == "bank_transfer" else PLATFORM_CRYPTO.get(f"usdt_{existing_order.get('crypto_network', 'trc20')}")
        return {
            "order_id": existing_order["order_id"],
            "reference": existing_order["reference"],
            "amount": existing_order["total_amount"],
            "currency": existing_order["currency"],
            "payment_method": existing_order["payment_method"],
            "payment_details": payment_details,
            "expires_at": existing_order["expires_at"],
            "status": existing_order["status"],
            "message": "Existing order found"
        }
    
    # Calculate amounts
    artwork_price = artwork["price"]
    license_fee = artwork_price * 0.05  # 5% license protection fee
    total_amount = artwork_price + license_fee
    
    # Generate unique reference
    reference = generate_payment_reference()
    
    # Determine currency and payment details
    if order_data.payment_method == "usdt":
        currency = "USDT"
        crypto_network = order_data.crypto_network or "trc20"
        payment_details = PLATFORM_CRYPTO.get(f"usdt_{crypto_network}")
    else:
        currency = "EUR"
        crypto_network = None
        payment_details = PLATFORM_BANK
    
    # Create order
    order_id = generate_id("ord_")
    order_doc = {
        "order_id": order_id,
        "reference": reference,  # CRITICAL: Unique payment reference (use as memo/note in crypto)
        "buyer_id": user["user_id"],
        "buyer_email": user["email"],
        "buyer_name": user.get("name", ""),
        "buyer_wallet": user.get("wallet_address"),
        "artwork_id": artwork["artwork_id"],
        "artwork_title": artwork["title"],
        "artwork_price": artwork_price,
        "license_fee": license_fee,
        "total_amount": total_amount,
        "currency": currency,
        "status": "PENDING_PAYMENT",
        "payment_method": order_data.payment_method,
        "crypto_network": crypto_network,
        "payment_details": payment_details,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=72),  # 72 hour payment window
        "payment_received_at": None,
        "confirmed_at": None,
        "delivered_at": None,
        "cancelled_at": None,
        "refunded_at": None,
        "matched_transaction_id": None,
        "sender_wallet": None,  # For crypto payments
        "tx_hash": None,  # Blockchain transaction hash
        "notes": []
    }
    
    await db.payment_orders.insert_one(order_doc)
    
    # Create audit log
    await create_audit_log("payment_order_created", user["user_id"], {
        "order_id": order_id,
        "reference": reference,
        "artwork_id": artwork["artwork_id"],
        "amount": total_amount,
        "payment_method": order_data.payment_method
    })
    
    # Build response based on payment method
    if order_data.payment_method == "usdt":
        instructions = {
            "step1": f"Send exactly {total_amount:.2f} USDT to the wallet address below",
            "step2": f"Include this reference in memo/note: {reference}",
            "step3": "Payment will be confirmed after blockchain confirmations",
            "important": "Reference code MUST be included in transaction memo/note",
            "network": f"Send on {payment_details['network']} network ONLY"
        }
    else:
        instructions = {
            "step1": f"Transfer exactly €{total_amount:.2f} to the bank account below",
            "step2": f"Use reference code: {reference}",
            "step3": "Payment will be automatically detected within 1-24 hours",
            "important": "Reference code MUST be included in transfer description"
        }
    
    return {
        "order_id": order_id,
        "reference": reference,
        "artwork_price": artwork_price,
        "license_fee": license_fee,
        "total_amount": total_amount,
        "currency": currency,
        "payment_method": order_data.payment_method,
        "crypto_network": crypto_network,
        "payment_details": payment_details,
        "expires_at": order_doc["expires_at"].isoformat(),
        "status": "PENDING_PAYMENT",
        "instructions": instructions
    }

@api_router.get("/payment/order/{order_id}")
async def get_payment_order(order_id: str, request: Request):
    """Get payment order details and status"""
    user = await get_current_user(request)
    
    order = await db.payment_orders.find_one({
        "order_id": order_id,
        "buyer_id": user["user_id"]
    }, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if expired - handle timezone-naive datetimes from MongoDB
    if order["status"] == "PENDING_PAYMENT":
        expires_at = order["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if datetime.now(timezone.utc) > expires_at:
            await db.payment_orders.update_one(
                {"order_id": order_id},
                {"$set": {"status": "EXPIRED", "cancelled_at": datetime.now(timezone.utc)}}
            )
            order["status"] = "EXPIRED"
    
    return order

@api_router.get("/payment/my-orders")
async def get_my_payment_orders(request: Request):
    """Get all payment orders for current user"""
    user = await get_current_user(request)
    
    orders = await db.payment_orders.find(
        {"buyer_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders

@api_router.post("/payment/cancel-order/{order_id}")
async def cancel_payment_order(order_id: str, request: Request):
    """Cancel a pending payment order"""
    user = await get_current_user(request)
    
    order = await db.payment_orders.find_one({
        "order_id": order_id,
        "buyer_id": user["user_id"],
        "status": "PENDING_PAYMENT"
    })
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or cannot be cancelled")
    
    await db.payment_orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": "CANCELLED",
            "cancelled_at": datetime.now(timezone.utc)
        }}
    )
    
    await create_audit_log("payment_order_cancelled", user["user_id"], {
        "order_id": order_id,
        "reference": order["reference"]
    })
    
    return {"message": "Order cancelled", "order_id": order_id}

# ==================== ADMIN PAYMENT RECONCILIATION ====================

@api_router.post("/admin/payment/record-transaction")
async def admin_record_bank_transaction(transaction: BankTransactionRecord, request: Request):
    """
    Admin: Record incoming bank transaction for reconciliation.
    This can be automated via bank API/webhook or manual entry.
    """
    admin = await get_founder_admin(request)
    
    # Store transaction
    tx_doc = {
        "transaction_id": transaction.transaction_id,
        "type": "bank_transfer",
        "amount": transaction.amount,
        "currency": transaction.currency,
        "sender_name": transaction.sender_name,
        "sender_iban": transaction.sender_iban,
        "reference": transaction.reference.strip().upper(),
        "transaction_date": transaction.transaction_date,
        "bank_statement_id": transaction.bank_statement_id,
        "recorded_at": datetime.now(timezone.utc),
        "recorded_by": admin["user_id"],
        "matched": False,
        "matched_order_id": None
    }
    
    await db.bank_transactions.insert_one(tx_doc)
    
    # Attempt automatic matching
    match_result = await match_transaction_to_order(transaction.reference, transaction.amount, "EUR")
    
    return {
        "transaction_id": transaction.transaction_id,
        "match_result": match_result
    }

@api_router.post("/admin/payment/record-crypto-transaction")
async def admin_record_crypto_transaction(transaction: CryptoTransactionRecord, request: Request):
    """
    Admin: Record incoming USDT crypto transaction for reconciliation.
    """
    admin = await get_founder_admin(request)
    
    # Validate network
    if transaction.network not in ["trc20", "erc20", "bep20"]:
        raise HTTPException(status_code=400, detail="Invalid network")
    
    # Store transaction
    tx_doc = {
        "transaction_id": transaction.tx_hash,
        "type": "crypto",
        "tx_hash": transaction.tx_hash,
        "amount": transaction.amount,
        "currency": transaction.currency,
        "network": transaction.network,
        "sender_wallet": transaction.sender_wallet,
        "reference": transaction.reference.strip().upper(),
        "confirmations": transaction.confirmations,
        "recorded_at": datetime.now(timezone.utc),
        "recorded_by": admin["user_id"],
        "matched": False,
        "matched_order_id": None
    }
    
    await db.crypto_transactions.insert_one(tx_doc)
    
    # Attempt automatic matching
    match_result = await match_transaction_to_order(transaction.reference, transaction.amount, "USDT")
    
    if match_result.get("matched"):
        # Update order with tx_hash
        await db.payment_orders.update_one(
            {"order_id": match_result["order_id"]},
            {"$set": {
                "tx_hash": transaction.tx_hash,
                "sender_wallet": transaction.sender_wallet
            }}
        )
    
    return {
        "tx_hash": transaction.tx_hash,
        "match_result": match_result
    }

async def match_transaction_to_order(reference: str, amount: float, currency: str = "EUR"):
    """
    Automatic payment matching logic.
    Reference is the PRIMARY KEY for reconciliation.
    """
    # Normalize reference
    ref_normalized = reference.strip().upper().replace(" ", "").replace("-", "")
    
    # Find order by reference (exact match)
    order = await db.payment_orders.find_one({
        "status": "PENDING_PAYMENT"
    })
    
    # Try to match by reference pattern
    orders = await db.payment_orders.find({
        "status": "PENDING_PAYMENT"
    }).to_list(1000)
    
    matched_order = None
    for order in orders:
        order_ref = order["reference"].upper().replace(" ", "").replace("-", "")
        if order_ref in ref_normalized or ref_normalized in order_ref:
            matched_order = order
            break
    
    if not matched_order:
        return {
            "matched": False,
            "reason": "NO_MATCHING_REFERENCE",
            "suggestion": "Manual review required - reference not found"
        }
    
    # Check amount (with 1% tolerance for bank fees)
    expected = matched_order["total_amount"]
    tolerance = expected * 0.01
    
    if amount < expected - tolerance:
        return {
            "matched": False,
            "reason": "UNDERPAYMENT",
            "order_id": matched_order["order_id"],
            "expected": expected,
            "received": amount,
            "difference": expected - amount
        }
    
    if amount > expected + tolerance:
        return {
            "matched": True,
            "warning": "OVERPAYMENT",
            "order_id": matched_order["order_id"],
            "expected": expected,
            "received": amount,
            "overpayment": amount - expected
        }
    
    # Perfect match - auto confirm
    await db.payment_orders.update_one(
        {"order_id": matched_order["order_id"]},
        {"$set": {
            "status": "PAYMENT_RECEIVED",
            "payment_received_at": datetime.now(timezone.utc),
            "matched_transaction_id": reference
        }}
    )
    
    await db.bank_transactions.update_one(
        {"reference": reference},
        {"$set": {
            "matched": True,
            "matched_order_id": matched_order["order_id"]
        }}
    )
    
    # Create alert for admin
    await create_system_alert(
        "info",
        "Payment Matched",
        f"Payment of €{amount:.2f} matched to order {matched_order['order_id']}",
        "transaction"
    )
    
    return {
        "matched": True,
        "order_id": matched_order["order_id"],
        "status": "PAYMENT_RECEIVED",
        "next_step": "Confirm and deliver artwork"
    }

@api_router.post("/admin/payment/confirm-order/{order_id}")
async def admin_confirm_payment_order(order_id: str, request: Request):
    """Admin: Confirm payment received and deliver artwork"""
    admin = await get_founder_admin(request)
    
    order = await db.payment_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] not in ["PENDING_PAYMENT", "PAYMENT_RECEIVED"]:
        raise HTTPException(status_code=400, detail=f"Order cannot be confirmed (status: {order['status']})")
    
    # Update order
    await db.payment_orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": "CONFIRMED",
            "confirmed_at": datetime.now(timezone.utc),
            "confirmed_by": admin["user_id"]
        }}
    )
    
    # Transfer artwork ownership
    artwork = await db.artworks.find_one({"artwork_id": order["artwork_id"]})
    if artwork:
        await db.artworks.update_one(
            {"artwork_id": order["artwork_id"]},
            {"$set": {
                "is_purchased": True,
                "owner_id": order["buyer_id"],
                "purchased_at": datetime.now(timezone.utc),
                "purchase_price": order["artwork_price"]
            }}
        )
    
    # Mark as delivered
    await db.payment_orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": "DELIVERED",
            "delivered_at": datetime.now(timezone.utc)
        }}
    )
    
    # Create transaction record
    tx_id = generate_id("tx_")
    await db.transactions.insert_one({
        "transaction_id": tx_id,
        "type": "purchase_a2a",
        "user_id": order["buyer_id"],
        "artwork_id": order["artwork_id"],
        "amount": order["total_amount"],
        "fee": order["license_fee"],
        "payment_method": "bank_transfer",
        "payment_reference": order["reference"],
        "status": "completed",
        "created_at": datetime.now(timezone.utc)
    })
    
    await create_audit_log("payment_confirmed_delivered", admin["user_id"], {
        "order_id": order_id,
        "artwork_id": order["artwork_id"],
        "buyer_id": order["buyer_id"],
        "amount": order["total_amount"]
    })
    
    return {
        "message": "Payment confirmed and artwork delivered",
        "order_id": order_id,
        "status": "DELIVERED"
    }

@api_router.get("/admin/payment/pending-orders")
async def admin_get_pending_orders(request: Request):
    """Admin: Get all pending payment orders"""
    await get_founder_admin(request)
    
    orders = await db.payment_orders.find(
        {"status": {"$in": ["PENDING_PAYMENT", "PAYMENT_RECEIVED"]}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders

@api_router.get("/admin/payment/all-orders")
async def admin_get_all_orders(request: Request, status: Optional[str] = None):
    """Admin: Get all payment orders with optional status filter"""
    await get_founder_admin(request)
    
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.payment_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders

@api_router.get("/admin/payment/unmatched-transactions")
async def admin_get_unmatched_transactions(request: Request):
    """Admin: Get bank transactions that couldn't be matched"""
    await get_founder_admin(request)
    
    transactions = await db.bank_transactions.find(
        {"matched": False},
        {"_id": 0}
    ).sort("recorded_at", -1).to_list(100)
    
    return transactions

@api_router.post("/admin/payment/manual-match")
async def admin_manual_match_transaction(
    transaction_id: str,
    order_id: str,
    request: Request
):
    """Admin: Manually match a transaction to an order"""
    admin = await get_founder_admin(request)
    
    # Update transaction
    await db.bank_transactions.update_one(
        {"transaction_id": transaction_id},
        {"$set": {
            "matched": True,
            "matched_order_id": order_id,
            "manual_match_by": admin["user_id"],
            "manual_match_at": datetime.now(timezone.utc)
        }}
    )
    
    # Update order
    await db.payment_orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": "PAYMENT_RECEIVED",
            "payment_received_at": datetime.now(timezone.utc),
            "matched_transaction_id": transaction_id
        }}
    )
    
    await create_audit_log("manual_payment_match", admin["user_id"], {
        "transaction_id": transaction_id,
        "order_id": order_id
    })
    
    return {"message": "Transaction manually matched", "order_id": order_id}

@api_router.post("/admin/payment/refund")
async def admin_process_a2a_refund(refund: RefundRequest, request: Request):
    """
    Admin: Process refund for A2A payment.
    Refunds are SELLER-CONTROLLED only.
    """
    admin = await get_founder_admin(request)
    
    order = await db.payment_orders.find_one({"order_id": refund.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] not in ["DELIVERED", "CONFIRMED", "PAYMENT_RECEIVED"]:
        raise HTTPException(status_code=400, detail="Order cannot be refunded")
    
    # Calculate refund amount (license fee is NON-REFUNDABLE)
    refund_amount = refund.refund_amount or order["artwork_price"]  # Exclude license fee
    
    # Get buyer's bank info
    buyer = await db.users.find_one({"user_id": order["buyer_id"]}, {"_id": 0})
    buyer_iban = buyer.get("iban") if buyer else None
    
    # Update order
    await db.payment_orders.update_one(
        {"order_id": refund.order_id},
        {
            "$set": {
                "status": "REFUNDED",
                "refunded_at": datetime.now(timezone.utc),
                "refund_amount": refund_amount,
                "refund_reason": refund.reason,
                "refunded_by": admin["user_id"]
            },
            "$push": {
                "notes": {
                    "type": "refund",
                    "message": f"Refund of €{refund_amount:.2f} initiated. Reason: {refund.reason}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "by": admin["user_id"]
                }
            }
        }
    )
    
    # Revert artwork ownership
    await db.artworks.update_one(
        {"artwork_id": order["artwork_id"]},
        {"$set": {
            "is_purchased": False,
            "owner_id": None,
            "is_refunded": True
        }}
    )
    
    await create_audit_log("a2a_refund_processed", admin["user_id"], {
        "order_id": refund.order_id,
        "refund_amount": refund_amount,
        "reason": refund.reason
    })
    
    return {
        "message": "Refund initiated",
        "order_id": refund.order_id,
        "refund_amount": refund_amount,
        "buyer_iban": buyer_iban,
        "note": "Please process bank transfer manually to buyer's account",
        "non_refundable_fee": order["license_fee"]
    }

# ==================== WITHDRAWAL ENDPOINTS ====================

@api_router.post("/withdraw")
async def withdraw_funds(withdrawal: WithdrawalRequest, request: Request):
    user = await get_current_user(request)
    
    if user.get("balance", 0) < withdrawal.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Calculate fee (1%)
    fee = withdrawal.amount * 0.01
    net_amount = withdrawal.amount - fee
    
    # Create transaction
    transaction_id = generate_id("txn_")
    transaction = {
        "transaction_id": transaction_id,
        "type": "withdrawal",
        "user_id": user["user_id"],
        "amount": withdrawal.amount,
        "fee": fee,
        "net_amount": net_amount,
        "method": withdrawal.method,
        "destination": withdrawal.destination,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    await db.transactions.insert_one(transaction)
    
    # Deduct from balance
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"balance": -withdrawal.amount}}
    )
    
    await create_audit_log("withdrawal_requested", user["user_id"], {
        "amount": withdrawal.amount,
        "method": withdrawal.method
    })
    
    return {
        "message": "Withdrawal initiated",
        "transaction_id": transaction_id,
        "amount": withdrawal.amount,
        "fee": fee,
        "net_amount": net_amount
    }

# ==================== USER BANK INFO ENDPOINTS ====================

@api_router.get("/user/bank-info")
async def get_user_bank_info(request: Request):
    """Get user's bank information"""
    user = await get_current_user(request)
    bank_info = {
        "iban": user.get("iban"),
        "bank_name": user.get("bank_name"),
        "account_holder_name": user.get("account_holder_name"),
        "swift_bic": user.get("swift_bic")
    }
    return bank_info

@api_router.put("/user/bank-info")
async def update_user_bank_info(bank_data: BankInfoUpdate, request: Request):
    """Update user's bank information for refunds/payouts"""
    user = await get_current_user(request)
    
    update_fields = {}
    if bank_data.iban is not None:
        update_fields["iban"] = bank_data.iban
    if bank_data.bank_name is not None:
        update_fields["bank_name"] = bank_data.bank_name
    if bank_data.account_holder_name is not None:
        update_fields["account_holder_name"] = bank_data.account_holder_name
    if bank_data.swift_bic is not None:
        update_fields["swift_bic"] = bank_data.swift_bic
    
    if update_fields:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_fields}
        )
        
        await create_audit_log("bank_info_updated", user["user_id"], {
            "fields_updated": list(update_fields.keys())
        })
    
    return {"message": "Bank information updated successfully"}

# ==================== USER DASHBOARD ENDPOINTS ====================

@api_router.get("/user/artworks")
async def get_user_artworks(request: Request):
    user = await get_current_user(request)
    artworks = await db.artworks.find(
        {"owner_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    return artworks

@api_router.get("/user/transactions")
async def get_user_transactions(request: Request):
    user = await get_current_user(request)
    transactions = await db.transactions.find(
        {"$or": [
            {"user_id": user["user_id"]},
            {"buyer_id": user["user_id"]},
            {"seller_id": user["user_id"]}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return transactions

@api_router.get("/user/listings")
async def get_user_listings(request: Request):
    user = await get_current_user(request)
    listings = await db.marketplace_listings.find(
        {"seller_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    return listings

# ==================== ADMIN ENDPOINTS ====================

# Admin Login - Special authentication for founder
@api_router.post("/admin/login")
async def admin_login(credentials: AdminLoginRequest):
    """
    Special login for the FOUNDER ADMIN only.
    Requires email, password AND admin secret key.
    If 2FA is enabled, also requires TOTP code.
    """
    # Verify admin secret
    if credentials.admin_secret != FOUNDER_ADMIN_SECRET:
        await create_system_alert("critical", "Failed Admin Login Attempt", 
            f"Invalid admin secret used for email: {credentials.email}", "security")
        raise HTTPException(status_code=403, detail="Invalid admin credentials")
    
    # Verify email matches founder
    if credentials.email != FOUNDER_ADMIN_EMAIL:
        await create_system_alert("critical", "Unauthorized Admin Access Attempt", 
            f"Non-founder email attempted admin login: {credentials.email}", "security")
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find or create founder admin user
    user = await db.users.find_one({"email": FOUNDER_ADMIN_EMAIL}, {"_id": 0})
    
    if not user:
        # Create founder admin account
        user_id = generate_id("admin_")
        user_doc = {
            "user_id": user_id,
            "email": FOUNDER_ADMIN_EMAIL,
            "password_hash": hash_password(credentials.password),
            "name": "Founder Admin",
            "picture": None,
            "wallet_address": None,
            "balance": 0.0,
            "created_at": datetime.now(timezone.utc),
            "auth_type": "admin",
            "is_founder_admin": True,
            "two_factor_enabled": False,
            "two_factor_secret": None
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    else:
        # Verify password
        if not verify_password(credentials.password, user.get("password_hash", "")):
            await create_system_alert("warning", "Failed Admin Password", 
                "Incorrect password for founder admin", "security")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check 2FA if enabled
        if user.get("two_factor_enabled") and user.get("two_factor_secret"):
            # 2FA is required - return special response if no code provided
            return {
                "requires_2fa": True,
                "message": "Two-factor authentication required"
            }
        
        # Ensure is_founder_admin flag is set
        if not user.get("is_founder_admin"):
            await db.users.update_one(
                {"email": FOUNDER_ADMIN_EMAIL},
                {"$set": {"is_founder_admin": True}}
            )
    
    token = create_jwt_token(user["user_id"], user["email"])
    
    await create_audit_log("admin_login", user["user_id"], {"ip": "system"})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "is_founder_admin": True,
            "two_factor_enabled": user.get("two_factor_enabled", False)
        }
    }

@api_router.post("/admin/login-2fa")
async def admin_login_with_2fa(credentials: AdminLoginWith2FA):
    """Admin login with 2FA verification"""
    # Verify admin secret
    if credentials.admin_secret != FOUNDER_ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin credentials")
    
    if credentials.email != FOUNDER_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.users.find_one({"email": FOUNDER_ADMIN_EMAIL}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Verify password
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify 2FA code
    if not credentials.totp_code:
        raise HTTPException(status_code=400, detail="2FA code required")
    
    totp = pyotp.TOTP(user.get("two_factor_secret"))
    if not totp.verify(credentials.totp_code):
        await create_system_alert("warning", "Failed 2FA Attempt", 
            "Invalid 2FA code for founder admin", "security")
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    token = create_jwt_token(user["user_id"], user["email"])
    await create_audit_log("admin_login_2fa", user["user_id"], {"ip": "system"})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "is_founder_admin": True,
            "two_factor_enabled": True
        }
    }

@api_router.post("/admin/2fa/setup")
async def setup_2fa(request: Request, data: TwoFactorSetup):
    """Generate 2FA secret and QR code for admin"""
    admin = await get_founder_admin(request)
    
    # Verify password again for security
    user = await db.users.find_one({"user_id": admin["user_id"]}, {"_id": 0})
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Generate new secret
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    
    # Generate QR code
    provisioning_uri = totp.provisioning_uri(name=admin["email"], issuer_name="Imperial Art Gallery Admin")
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Store secret temporarily (not enabled yet)
    await db.users.update_one(
        {"user_id": admin["user_id"]},
        {"$set": {"two_factor_secret_pending": secret}}
    )
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "manual_entry": secret
    }

@api_router.post("/admin/2fa/verify-setup")
async def verify_2fa_setup(request: Request, data: TwoFactorVerify):
    """Verify 2FA code and enable 2FA"""
    admin = await get_founder_admin(request)
    
    user = await db.users.find_one({"user_id": admin["user_id"]}, {"_id": 0})
    pending_secret = user.get("two_factor_secret_pending")
    
    if not pending_secret:
        raise HTTPException(status_code=400, detail="No pending 2FA setup")
    
    totp = pyotp.TOTP(pending_secret)
    if not totp.verify(data.code):
        raise HTTPException(status_code=401, detail="Invalid verification code")
    
    # Enable 2FA
    await db.users.update_one(
        {"user_id": admin["user_id"]},
        {
            "$set": {
                "two_factor_enabled": True,
                "two_factor_secret": pending_secret
            },
            "$unset": {"two_factor_secret_pending": ""}
        }
    )
    
    await create_audit_log("2fa_enabled", admin["user_id"], {"method": "totp"})
    await create_system_alert("info", "2FA Enabled", "Two-factor authentication enabled for admin", "security")
    
    return {"message": "2FA enabled successfully", "enabled": True}

@api_router.post("/admin/2fa/disable")
async def disable_2fa(request: Request, data: TwoFactorVerify):
    """Disable 2FA (requires current code)"""
    admin = await get_founder_admin(request)
    
    user = await db.users.find_one({"user_id": admin["user_id"]}, {"_id": 0})
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    totp = pyotp.TOTP(user.get("two_factor_secret"))
    if not totp.verify(data.code):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    await db.users.update_one(
        {"user_id": admin["user_id"]},
        {
            "$set": {"two_factor_enabled": False},
            "$unset": {"two_factor_secret": "", "two_factor_secret_pending": ""}
        }
    )
    
    await create_audit_log("2fa_disabled", admin["user_id"], {})
    await create_system_alert("warning", "2FA Disabled", "Two-factor authentication disabled for admin", "security")
    
    return {"message": "2FA disabled", "enabled": False}

@api_router.get("/admin/2fa/status")
async def get_2fa_status(request: Request):
    """Check if 2FA is enabled for admin"""
    admin = await get_founder_admin(request)
    user = await db.users.find_one({"user_id": admin["user_id"]}, {"_id": 0})
    return {"enabled": user.get("two_factor_enabled", False)}

@api_router.get("/admin/verify")
async def verify_admin(request: Request):
    """Verify if current user is founder admin"""
    admin = await get_founder_admin(request)
    return {"verified": True, "email": admin["email"]}

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    """Admin dashboard statistics - FOUNDER ONLY"""
    await get_founder_admin(request)
    
    total_users = await db.users.count_documents({})
    total_artworks = await db.artworks.count_documents({})
    total_transactions = await db.transactions.count_documents({})
    total_listings = await db.marketplace_listings.count_documents({"status": "active"})
    banned_users = await db.users.count_documents({"status": "banned"})
    suspended_users = await db.users.count_documents({"status": "suspended"})
    
    # Calculate totals
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": "$type",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    transaction_stats = await db.transactions.aggregate(pipeline).to_list(100)
    
    # Calculate revenue
    total_revenue = 0
    for stat in transaction_stats:
        if stat["_id"] in ["purchase", "p2p_sale"]:
            total_revenue += stat.get("total", 0) * 0.05 if stat["_id"] == "purchase" else stat.get("total", 0) * 0.01
    
    return {
        "total_users": total_users,
        "total_artworks": total_artworks,
        "total_transactions": total_transactions,
        "active_listings": total_listings,
        "banned_users": banned_users,
        "suspended_users": suspended_users,
        "estimated_revenue": round(total_revenue, 2),
        "transaction_breakdown": transaction_stats
    }

# ==================== ADMIN ARTWORK MANAGEMENT ====================

@api_router.get("/admin/artworks")
async def admin_get_artworks(request: Request):
    """Get all artworks - FOUNDER ONLY"""
    await get_founder_admin(request)
    artworks = await db.artworks.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return artworks

@api_router.post("/admin/artworks")
async def admin_create_artwork(
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    artist_name: str = Form(...),
    category: str = Form("digital"),
    tags: str = Form(""),
    file: UploadFile = File(...)
):
    """Create new artwork - FOUNDER ONLY"""
    admin = await get_founder_admin(request)
    
    artwork_id = generate_id("art_")
    
    # Save file
    file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
    file_path = UPLOAD_DIR / f"{artwork_id}.{file_ext}"
    preview_path = UPLOAD_DIR / f"{artwork_id}_preview.{file_ext}"
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create preview (in production, add watermark)
    with open(preview_path, "wb") as f:
        f.write(content)
    
    tags_list = [t.strip().lower() for t in tags.split(",") if t.strip()]
    
    artwork_doc = {
        "artwork_id": artwork_id,
        "title": title,
        "description": description,
        "price": price,
        "artist_name": artist_name,
        "category": category,
        "tags": tags_list,
        "file_path": str(file_path),
        "preview_url": f"/api/artworks/{artwork_id}/preview",
        "is_purchased": False,
        "is_used": False,
        "is_transferred": False,
        "is_refunded": False,
        "owner_id": None,
        "created_at": datetime.now(timezone.utc),
        "license_protection_fee": price * 0.05,
        "created_by": admin["user_id"]
    }
    await db.artworks.insert_one(artwork_doc)
    
    await create_audit_log("artwork_created", admin["user_id"], {
        "artwork_id": artwork_id, "title": title
    }, artwork_id=artwork_id)
    
    return {"message": "Artwork created", "artwork_id": artwork_id}

@api_router.put("/admin/artworks/{artwork_id}")
async def admin_update_artwork(artwork_id: str, update_data: AdminArtworkUpdate, request: Request):
    """Update artwork - FOUNDER ONLY"""
    admin = await get_founder_admin(request)
    
    artwork = await db.artworks.find_one({"artwork_id": artwork_id}, {"_id": 0})
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    update_fields = {}
    if update_data.title:
        update_fields["title"] = update_data.title
    if update_data.description:
        update_fields["description"] = update_data.description
    if update_data.price is not None:
        update_fields["price"] = update_data.price
        update_fields["license_protection_fee"] = update_data.price * 0.05
    if update_data.artist_name:
        update_fields["artist_name"] = update_data.artist_name
    if update_data.category:
        update_fields["category"] = update_data.category
    if update_data.tags is not None:
        update_fields["tags"] = [t.strip().lower() for t in update_data.tags.split(",") if t.strip()]
    
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc)
        await db.artworks.update_one({"artwork_id": artwork_id}, {"$set": update_fields})
    
    await create_audit_log("artwork_updated", admin["user_id"], {
        "artwork_id": artwork_id, "changes": list(update_fields.keys())
    }, artwork_id=artwork_id)
    
    return {"message": "Artwork updated"}

@api_router.delete("/admin/artworks/{artwork_id}")
async def admin_delete_artwork(artwork_id: str, request: Request):
    """Delete artwork - FOUNDER ONLY"""
    admin = await get_founder_admin(request)
    
    artwork = await db.artworks.find_one({"artwork_id": artwork_id}, {"_id": 0})
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    if artwork.get("is_purchased") and not artwork.get("is_refunded"):
        raise HTTPException(status_code=400, detail="Cannot delete owned artwork. Process refund first.")
    
    # Delete file
    file_path = artwork.get("file_path")
    if file_path and Path(file_path).exists():
        Path(file_path).unlink()
    
    await db.artworks.delete_one({"artwork_id": artwork_id})
    
    await create_audit_log("artwork_deleted", admin["user_id"], {
        "artwork_id": artwork_id, "title": artwork.get("title")
    })
    
    return {"message": "Artwork deleted"}

# ==================== ADMIN USER MANAGEMENT ====================

@api_router.get("/admin/users")
async def admin_get_users(request: Request):
    """Get all users - FOUNDER ONLY"""
    await get_founder_admin(request)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return users

@api_router.post("/admin/users/action")
async def admin_user_action(action_data: AdminUserAction, request: Request):
    """Ban, suspend, unban, or unsuspend a user - FOUNDER ONLY"""
    admin = await get_founder_admin(request)
    
    user = await db.users.find_one({"user_id": action_data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("is_founder_admin"):
        raise HTTPException(status_code=403, detail="Cannot modify founder admin")
    
    update_fields = {}
    
    if action_data.action == "ban":
        update_fields["status"] = "banned"
        update_fields["banned_at"] = datetime.now(timezone.utc)
        update_fields["ban_reason"] = action_data.reason
    elif action_data.action == "suspend":
        update_fields["status"] = "suspended"
        update_fields["suspended_at"] = datetime.now(timezone.utc)
        update_fields["suspend_reason"] = action_data.reason
        if action_data.duration_days:
            update_fields["suspend_until"] = datetime.now(timezone.utc) + timedelta(days=action_data.duration_days)
    elif action_data.action == "unban":
        update_fields["status"] = "active"
        update_fields["banned_at"] = None
        update_fields["ban_reason"] = None
    elif action_data.action == "unsuspend":
        update_fields["status"] = "active"
        update_fields["suspended_at"] = None
        update_fields["suspend_reason"] = None
        update_fields["suspend_until"] = None
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    await db.users.update_one({"user_id": action_data.user_id}, {"$set": update_fields})
    
    await create_audit_log(f"user_{action_data.action}", admin["user_id"], {
        "target_user": action_data.user_id,
        "reason": action_data.reason
    })
    
    return {"message": f"User {action_data.action} successful"}

# ==================== ADMIN MANUAL OPERATIONS ====================

@api_router.post("/admin/manual-refund")
async def admin_manual_refund(refund_data: AdminManualRefund, request: Request):
    """Process manual refund - FOUNDER ONLY"""
    admin = await get_founder_admin(request)
    
    artwork = await db.artworks.find_one({"artwork_id": refund_data.artwork_id}, {"_id": 0})
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    if artwork.get("owner_id") != refund_data.user_id:
        raise HTTPException(status_code=400, detail="User does not own this artwork")
    
    refund_amount = artwork.get("purchase_price", artwork["price"])
    
    # Create transaction
    transaction_id = generate_id("txn_")
    transaction = {
        "transaction_id": transaction_id,
        "type": "manual_refund",
        "user_id": refund_data.user_id,
        "artwork_id": refund_data.artwork_id,
        "amount": refund_amount,
        "status": "completed",
        "admin_reason": refund_data.reason,
        "processed_by": admin["user_id"],
        "created_at": datetime.now(timezone.utc)
    }
    await db.transactions.insert_one(transaction)
    
    # Update artwork
    await db.artworks.update_one(
        {"artwork_id": refund_data.artwork_id},
        {"$set": {
            "is_refunded": True,
            "is_purchased": False,
            "is_used": False,
            "owner_id": None,
            "refunded_at": datetime.now(timezone.utc),
            "manual_refund": True
        }}
    )
    
    # Credit user
    await db.users.update_one(
        {"user_id": refund_data.user_id},
        {"$inc": {"balance": refund_amount}}
    )
    
    await create_audit_log("manual_refund", admin["user_id"], {
        "artwork_id": refund_data.artwork_id,
        "user_id": refund_data.user_id,
        "amount": refund_amount,
        "reason": refund_data.reason
    }, artwork_id=refund_data.artwork_id)
    
    await set_audit_logs_expiration(refund_data.artwork_id)
    
    return {"message": "Manual refund processed", "amount": refund_amount}

@api_router.post("/admin/manual-transfer")
async def admin_manual_transfer(transfer_data: AdminManualTransfer, request: Request):
    """Process manual ownership transfer - FOUNDER ONLY"""
    admin = await get_founder_admin(request)
    
    artwork = await db.artworks.find_one({"artwork_id": transfer_data.artwork_id}, {"_id": 0})
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    if artwork.get("owner_id") != transfer_data.from_user_id:
        raise HTTPException(status_code=400, detail="Source user does not own this artwork")
    
    to_user = await db.users.find_one({"user_id": transfer_data.to_user_id}, {"_id": 0})
    if not to_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    # Create transaction
    transaction_id = generate_id("txn_")
    transaction = {
        "transaction_id": transaction_id,
        "type": "manual_transfer",
        "from_user_id": transfer_data.from_user_id,
        "to_user_id": transfer_data.to_user_id,
        "artwork_id": transfer_data.artwork_id,
        "status": "completed",
        "admin_reason": transfer_data.reason,
        "processed_by": admin["user_id"],
        "created_at": datetime.now(timezone.utc)
    }
    await db.transactions.insert_one(transaction)
    
    # Transfer ownership
    await db.artworks.update_one(
        {"artwork_id": transfer_data.artwork_id},
        {"$set": {
            "owner_id": transfer_data.to_user_id,
            "is_transferred": True,
            "transferred_at": datetime.now(timezone.utc),
            "manual_transfer": True
        }}
    )
    
    await create_audit_log("manual_transfer", admin["user_id"], {
        "artwork_id": transfer_data.artwork_id,
        "from_user": transfer_data.from_user_id,
        "to_user": transfer_data.to_user_id,
        "reason": transfer_data.reason
    }, artwork_id=transfer_data.artwork_id)
    
    return {"message": "Manual transfer completed"}

# ==================== ADMIN TRANSACTIONS & LOGS ====================

@api_router.get("/admin/transactions")
async def admin_get_transactions(request: Request):
    """Get all transactions - FOUNDER ONLY"""
    await get_founder_admin(request)
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return transactions

@api_router.get("/admin/audit-logs")
async def admin_get_audit_logs(request: Request, artwork_id: str = None):
    """Get audit logs - FOUNDER ONLY"""
    await get_founder_admin(request)
    
    query = {}
    if artwork_id:
        query["artwork_id"] = artwork_id
    
    query["$or"] = [
        {"expires_at": None},
        {"expires_at": {"$gt": datetime.now(timezone.utc)}}
    ]
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return logs

@api_router.get("/admin/audit-logs/stats")
async def admin_get_audit_stats(request: Request):
    """Get audit log statistics - FOUNDER ONLY"""
    await get_founder_admin(request)
    
    total_logs = await db.audit_logs.count_documents({})
    active_logs = await db.audit_logs.count_documents({
        "$or": [
            {"expires_at": None},
            {"expires_at": {"$gt": datetime.now(timezone.utc)}}
        ]
    })
    pending_deletion = await db.audit_logs.count_documents({
        "expires_at": {"$ne": None, "$lte": datetime.now(timezone.utc) + timedelta(days=3)}
    })
    
    return {
        "total_logs": total_logs,
        "active_logs": active_logs,
        "pending_deletion": pending_deletion
    }

# ==================== ADMIN ALERTS ====================

@api_router.get("/admin/alerts")
async def admin_get_alerts(request: Request, unread_only: bool = False):
    """Get admin alerts - FOUNDER ONLY"""
    await get_founder_admin(request)
    
    query = {}
    if unread_only:
        query["is_read"] = False
    
    alerts = await db.admin_alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return alerts

@api_router.get("/admin/alerts/count")
async def admin_get_unread_alert_count(request: Request):
    """Get unread alert count - FOUNDER ONLY"""
    await get_founder_admin(request)
    count = await db.admin_alerts.count_documents({"is_read": False})
    return {"unread_count": count}

@api_router.put("/admin/alerts/{alert_id}/read")
async def admin_mark_alert_read(alert_id: str, request: Request):
    """Mark alert as read - FOUNDER ONLY"""
    await get_founder_admin(request)
    await db.admin_alerts.update_one({"alert_id": alert_id}, {"$set": {"is_read": True}})
    return {"message": "Alert marked as read"}

@api_router.put("/admin/alerts/read-all")
async def admin_mark_all_alerts_read(request: Request):
    """Mark all alerts as read - FOUNDER ONLY"""
    await get_founder_admin(request)
    await db.admin_alerts.update_many({}, {"$set": {"is_read": True}})
    return {"message": "All alerts marked as read"}

@api_router.delete("/admin/alerts/{alert_id}")
async def admin_delete_alert(alert_id: str, request: Request):
    """Delete an alert - FOUNDER ONLY"""
    await get_founder_admin(request)
    await db.admin_alerts.delete_one({"alert_id": alert_id})
    return {"message": "Alert deleted"}

# ==================== ADMIN REPORTS & EXPORT ====================

@api_router.get("/admin/reports/summary")
async def admin_get_report_summary(request: Request, start_date: str = None, end_date: str = None):
    """Get summary report - FOUNDER ONLY"""
    await get_founder_admin(request)
    
    date_filter = {}
    if start_date:
        date_filter["$gte"] = datetime.fromisoformat(start_date)
    if end_date:
        date_filter["$lte"] = datetime.fromisoformat(end_date)
    
    query = {}
    if date_filter:
        query["created_at"] = date_filter
    
    # Transactions summary
    tx_pipeline = [
        {"$match": {**query, "status": "completed"}},
        {"$group": {
            "_id": "$type",
            "count": {"$sum": 1},
            "total_amount": {"$sum": "$amount"},
            "total_fees": {"$sum": {"$ifNull": ["$fee", 0]}}
        }}
    ]
    tx_summary = await db.transactions.aggregate(tx_pipeline).to_list(20)
    
    # User activity
    new_users = await db.users.count_documents(query)
    
    # Artwork stats
    new_artworks = await db.artworks.count_documents(query)
    purchased_artworks = await db.artworks.count_documents({**query, "is_purchased": True})
    
    return {
        "period": {"start": start_date, "end": end_date},
        "transactions": tx_summary,
        "new_users": new_users,
        "new_artworks": new_artworks,
        "purchased_artworks": purchased_artworks
    }

@api_router.get("/admin/export/transactions")
async def admin_export_transactions(request: Request, format: str = "csv"):
    """Export transactions as CSV - FOUNDER ONLY"""
    await get_founder_admin(request)
    
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    if format == "csv":
        output = io.StringIO()
        if transactions:
            writer = csv.DictWriter(output, fieldnames=transactions[0].keys())
            writer.writeheader()
            for tx in transactions:
                # Convert datetime to string
                tx_copy = {k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in tx.items()}
                writer.writerow(tx_copy)
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=transactions.csv"}
        )
    else:
        # JSON format
        for tx in transactions:
            for k, v in tx.items():
                if isinstance(v, datetime):
                    tx[k] = v.isoformat()
        return Response(
            content=json.dumps(transactions, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=transactions.json"}
        )

@api_router.get("/admin/export/users")
async def admin_export_users(request: Request, format: str = "csv"):
    """Export users as CSV - FOUNDER ONLY"""
    await get_founder_admin(request)
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(10000)
    
    if format == "csv":
        output = io.StringIO()
        if users:
            writer = csv.DictWriter(output, fieldnames=users[0].keys())
            writer.writeheader()
            for user in users:
                user_copy = {k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in user.items()}
                writer.writerow(user_copy)
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=users.csv"}
        )
    else:
        for user in users:
            for k, v in user.items():
                if isinstance(v, datetime):
                    user[k] = v.isoformat()
        return Response(
            content=json.dumps(users, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=users.json"}
        )

@api_router.get("/admin/export/artworks")
async def admin_export_artworks(request: Request, format: str = "csv"):
    """Export artworks as CSV - FOUNDER ONLY"""
    await get_founder_admin(request)
    
    artworks = await db.artworks.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    if format == "csv":
        output = io.StringIO()
        if artworks:
            # Flatten tags for CSV
            for art in artworks:
                art["tags"] = ",".join(art.get("tags", []))
            writer = csv.DictWriter(output, fieldnames=artworks[0].keys())
            writer.writeheader()
            for art in artworks:
                art_copy = {k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in art.items()}
                writer.writerow(art_copy)
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=artworks.csv"}
        )
    else:
        for art in artworks:
            for k, v in art.items():
                if isinstance(v, datetime):
                    art[k] = v.isoformat()
        return Response(
            content=json.dumps(artworks, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=artworks.json"}
        )

# ==================== SEED DATA ENDPOINT ====================

@api_router.post("/seed")
async def seed_demo_data():
    """Seed demo artworks for testing"""
    demo_artworks = [
        {
            "artwork_id": generate_id("art_"),
            "title": "Neon Dreams",
            "description": "A mesmerizing digital artwork featuring vibrant neon colors and abstract geometric patterns.",
            "price": 250.00,
            "artist_name": "CyberArtist",
            "category": "abstract",
            "tags": ["neon", "abstract", "digital"],
            "preview_url": "https://images.unsplash.com/photo-1764258559789-40cf1eb2025f?w=800",
            "is_purchased": False,
            "is_used": False,
            "is_transferred": False,
            "is_refunded": False,
            "owner_id": None,
            "created_at": datetime.now(timezone.utc),
            "license_protection_fee": 12.50
        },
        {
            "artwork_id": generate_id("art_"),
            "title": "Digital Cosmos",
            "description": "Explore the infinite beauty of the digital universe through this stunning cosmic artwork.",
            "price": 500.00,
            "artist_name": "StarMaker",
            "category": "space",
            "tags": ["space", "cosmos", "digital"],
            "preview_url": "https://images.unsplash.com/photo-1644190018970-53ab9d652f79?w=800",
            "is_purchased": False,
            "is_used": False,
            "is_transferred": False,
            "is_refunded": False,
            "owner_id": None,
            "created_at": datetime.now(timezone.utc),
            "license_protection_fee": 25.00
        },
        {
            "artwork_id": generate_id("art_"),
            "title": "Golden Hour",
            "description": "A luxurious piece capturing the essence of golden light in digital form.",
            "price": 750.00,
            "artist_name": "LuxeDigital",
            "category": "luxury",
            "tags": ["gold", "luxury", "premium"],
            "preview_url": "https://images.unsplash.com/photo-1764258560286-b3aa856c8ff0?w=800",
            "is_purchased": False,
            "is_used": False,
            "is_transferred": False,
            "is_refunded": False,
            "owner_id": None,
            "created_at": datetime.now(timezone.utc),
            "license_protection_fee": 37.50
        },
        {
            "artwork_id": generate_id("art_"),
            "title": "Cyber Pulse",
            "description": "Feel the rhythm of the digital age with this pulsating cyberpunk masterpiece.",
            "price": 350.00,
            "artist_name": "NeonPunk",
            "category": "cyberpunk",
            "tags": ["cyberpunk", "neon", "futuristic"],
            "preview_url": "https://images.unsplash.com/photo-1506555191898-a76bacf004ca?w=800",
            "is_purchased": False,
            "is_used": False,
            "is_transferred": False,
            "is_refunded": False,
            "owner_id": None,
            "created_at": datetime.now(timezone.utc),
            "license_protection_fee": 17.50
        },
        {
            "artwork_id": generate_id("art_"),
            "title": "Abstract Reality",
            "description": "Where reality meets imagination - a journey through abstract dimensions.",
            "price": 420.00,
            "artist_name": "MindBender",
            "category": "abstract",
            "tags": ["abstract", "surreal", "mind"],
            "preview_url": "https://images.unsplash.com/photo-1761403794164-65897bc570a6?w=800",
            "is_purchased": False,
            "is_used": False,
            "is_transferred": False,
            "is_refunded": False,
            "owner_id": None,
            "created_at": datetime.now(timezone.utc),
            "license_protection_fee": 21.00
        },
        {
            "artwork_id": generate_id("art_"),
            "title": "Data Stream",
            "description": "Visualizing the flow of digital information in an artistic representation.",
            "price": 180.00,
            "artist_name": "DataViz",
            "category": "tech",
            "tags": ["data", "tech", "modern"],
            "preview_url": "https://images.unsplash.com/photo-1767001376210-b16507b18c43?w=800",
            "is_purchased": False,
            "is_used": False,
            "is_transferred": False,
            "is_refunded": False,
            "owner_id": None,
            "created_at": datetime.now(timezone.utc),
            "license_protection_fee": 9.00
        }
    ]
    
    # Clear existing demo data and insert new
    await db.artworks.delete_many({"artist_name": {"$in": ["CyberArtist", "StarMaker", "LuxeDigital", "NeonPunk", "MindBender", "DataViz"]}})
    await db.artworks.insert_many(demo_artworks)
    
    return {"message": f"Seeded {len(demo_artworks)} demo artworks"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
