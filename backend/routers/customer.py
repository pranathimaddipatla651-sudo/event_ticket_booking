from fastapi import APIRouter,HTTPException
from pydantic import BaseModel,Field,EmailStr
from typing import Annotated

from core.security import hash_password,verify_password
from db import tx

router=APIRouter(tags=["customer"])

class Register(BaseModel):
    name:str
    email: EmailStr
    password: str = Field(min_length=6)
    phone: str | None = None
    city: str | None = None

class Login(BaseModel):
    email:EmailStr
    password:str

@router.post("/register",status_code=201)
def register(body:Register):
    with tx() as curr:
        curr.execute(
            "INSERT INTO Users (name, email, password_hash, phone, city, role)"
            "VALUES(%s, %s, %s, %s, %s, 'customer')",
            (body.name, body.email, hash_password(body.password), body.phone, body.city),
        )
    return {"userID":curr.lastrowid}

@router.post("/login")
def login(body:Login):
    with tx() as curr:
        curr.execute(
            "SELECT user_id, name, password_hash, role, status FROM Users WHERE email = %s",
            (body.email,),
        )
        user=curr.fetchone()
        if user is None or not verify_password(body.password,user["password_hash"]):
            raise HTTPException(401,"Wrong email or password")
        if(user["status"]=="blocked"):
            raise HTTPException(403,"Account is blocked")
        return {"user_id": user["user_id"], "name": user["name"], "role": user["role"]}
