from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from app.auth.models import UserCreate, UserLogin, Token, UserOut
from app.auth.service import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.database import get_database

router = APIRouter()


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    existing = await db["users"].find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_doc = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hash_password(user_data.password),
        "role": user_data.role.value,
        "subscriptions": [],
        "created_at": datetime.utcnow(),
    }
    result = await db["users"].insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_access_token({"user_id": user_id, "email": user_data.email, "role": user_data.role.value})
    return Token(
        access_token=token,
        user=UserOut(id=user_id, email=user_data.email, full_name=user_data.full_name, role=user_data.role),
    )


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db["users"].find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token({"user_id": user_id, "email": user["email"], "role": user["role"]})
    return Token(
        access_token=token,
        user=UserOut(id=user_id, email=user["email"], full_name=user["full_name"], role=user["role"]),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
    )