from fastapi import Request, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId
from app.db.client import get_database
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedAccessException

def get_db() -> Database:
    return get_database()

def get_current_user(request: Request, db: Database = Depends(get_db)) -> dict:
    # Check Authorization header bearer token OR HttpOnly cookie 'access_token'
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = db.users.find_one({"_id": ObjectId(user_id), "is_active": True})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist or has been disabled"
        )

    return user

def get_current_shop(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
) -> dict:
    shop_id = current_user.get("shop_id")
    if not shop_id:
        raise UnauthorizedAccessException("User has no shop associated")

    shop = db.shops.find_one({"_id": ObjectId(shop_id)})
    if not shop:
        raise UnauthorizedAccessException("Shop record not found")

    return shop
