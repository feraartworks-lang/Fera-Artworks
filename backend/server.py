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

# ==================== HELPER FUNCTIONS ====================

def generate_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:12]}"

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
    listings = await db.marketplace_listings.find(
        {"status": "active"},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with artwork data
    result = []
    for listing in listings:
        artwork = await db.artworks.find_one(
            {"artwork_id": listing["artwork_id"]},
            {"_id": 0}
        )
        if artwork:
            listing["artwork"] = artwork
            result.append(listing)
    
    return result

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
            "is_founder_admin": True
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    else:
        # Verify password
        if not verify_password(credentials.password, user.get("password_hash", "")):
            await create_system_alert("warning", "Failed Admin Password", 
                "Incorrect password for founder admin", "security")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
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
            "is_founder_admin": True
        }
    }

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
