from fastapi import APIRouter, HTTPException, Depends
from ..config import db
from ..models import UserRegister, UserLogin, UserOut
from ..auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register")
async def register(user: UserRegister):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user.password)
    result = await db.users.insert_one(user_dict)
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"token": token, "user": {"id": str(result.inserted_id), "name": user.name, "email": user.email, "role": user.role}}


@router.post("/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user["email"], "role": user["role"]})
    return {"token": token, "user": {"id": str(user["_id"]), "name": user["name"], "email": user["email"], "role": user["role"]}}


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"id": str(user["_id"]), "name": user["name"], "email": user["email"], "role": user["role"]}


@router.put("/profile")
async def update_profile(body: dict, user=Depends(get_current_user)):
    updates = {}
    if "name" in body and body["name"].strip():
        updates["name"] = body["name"].strip()
    if updates:
        await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
    updated = await db.users.find_one({"_id": user["_id"]})
    return {"id": str(updated["_id"]), "name": updated["name"], "email": updated["email"], "role": updated["role"]}
