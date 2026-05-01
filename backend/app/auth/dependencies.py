from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.service import decode_token
from app.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    user["id"] = str(user["_id"])
    return user


async def require_analyst(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "analyst":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analyst role required for this action",
        )
    return current_user