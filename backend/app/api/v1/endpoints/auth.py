from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.database import Database
from datetime import datetime, timezone
from bson import ObjectId
from app.db.client import get_database
from app.api.dependencies import get_db, get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.schemas.schemas import UserRegister, UserLogin, PasswordChange, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, response: Response, db: Database = Depends(get_db)):
    email_norm = payload.email.lower().strip()
    existing = db.users.find_one({"email_normalized": email_norm})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    now = datetime.now(timezone.utc)

    # 1. Create shop
    shop_doc = {
        "name": payload.shop_name,
        "shop_type": payload.shop_type,
        "contact_phone": payload.phone,
        "address": payload.address,
        "city": payload.city,
        "state": payload.state,
        "pincode": payload.pincode,
        "timezone": "Asia/Kolkata",
        "currency": "INR",
        "expiry_warning_days": 7,
        "expiry_critical_days": 3,
        "created_at": now,
        "updated_at": now
    }
    shop_res = db.shops.insert_one(shop_doc)
    shop_id_str = str(shop_res.inserted_id)

    # 2. Create owner user
    pwd_hash = hash_password(payload.password)
    user_doc = {
        "name": payload.name,
        "email_normalized": email_norm,
        "password_hash": pwd_hash,
        "role": "owner",
        "shop_id": shop_id_str,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    user_res = db.users.insert_one(user_doc)
    user_id_str = str(user_res.inserted_id)

    # Link back owner to shop
    db.shops.update_one({"_id": shop_res.inserted_id}, {"$set": {"owner_user_id": user_id_str}})

    # Token
    token = create_access_token({"sub": user_id_str, "shop_id": shop_id_str, "role": "owner"})

    # Set secure HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return {
        "token": token,
        "user": {
            "id": user_id_str,
            "name": payload.name,
            "email": email_norm,
            "role": "owner",
            "shop_id": shop_id_str
        },
        "shop": {
            "id": shop_id_str,
            "name": payload.shop_name,
            "shop_type": payload.shop_type
        }
    }

@router.post("/login")
def login(payload: UserLogin, response: Response, db: Database = Depends(get_db)):
    email_norm = payload.email.lower().strip()
    user = db.users.find_one({"email_normalized": email_norm, "is_active": True})

    # Generic credentials check to prevent user enumeration
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    user_id_str = str(user["_id"])
    shop_id_str = user["shop_id"]

    token = create_access_token({"sub": user_id_str, "shop_id": shop_id_str, "role": user.get("role", "owner")})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    shop = db.shops.find_one({"_id": ObjectId(shop_id_str)}) or {}

    return {
        "token": token,
        "user": {
            "id": user_id_str,
            "name": user["name"],
            "email": user["email_normalized"],
            "role": user.get("role", "owner"),
            "shop_id": shop_id_str
        },
        "shop": {
            "id": shop_id_str,
            "name": shop.get("name", "My Shop"),
            "shop_type": shop.get("shop_type", "Kirana Store")
        }
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    shop_id = current_user["shop_id"]
    shop = db.shops.find_one({"_id": ObjectId(shop_id)}) or {}
    return {
        "user": {
            "id": str(current_user["_id"]),
            "name": current_user["name"],
            "email": current_user["email_normalized"],
            "role": current_user.get("role", "owner"),
            "shop_id": shop_id
        },
        "shop": {
            "id": shop_id,
            "name": shop.get("name"),
            "shop_type": shop.get("shop_type"),
            "city": shop.get("city"),
            "currency": shop.get("currency", "INR")
        }
    }

@router.post("/change-password")
def change_password(payload: PasswordChange, current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    if not verify_password(payload.current_password, current_user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password incorrect")

    new_hash = hash_password(payload.new_password)
    db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Password changed successfully"}
