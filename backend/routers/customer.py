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
    phone: str | None = Field(default=None,pattern=r"^[6-9]\d{9}$")
    city: str | None = None

class Login(BaseModel):
    email:EmailStr
    password:str

class profileUpdate(BaseModel):
    name:str | None=Field(default=None,min_length=1)
    phone: str | None = Field(default=None,pattern=r"^[6-9]\d{9}$")
    city: str | None = None

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

@router.get("/users/{user_id}")
def get_profile(user_id:int):
    with tx() as curr:
        curr.execute(
            "SELECT user_id,name,email,phone,city,role,created_at "
            "FROM Users WHERE user_id = %s",
            (user_id,),
        )
        user=curr.fetchone()
    if user is None:
        raise HTTPException(404,"User not found")
    return user

@ router.patch("/users/{user_id}")
def update_profile(user_id:int,body:profileUpdate):
    changes=body.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(400,"Nothing to update")
    if "name" in changes and changes["name"] is None:
        raise HTTPException(400,"Name cannot be empty")
    clause=",".join(f"{col}=%s" for col in changes)
    values=list(changes.values())+[user_id]
    with tx() as curr:
        curr.execute(
            "SELECT user_id FROM Users WHERE user_id=%s",
            (user_id,)
        )
        if curr.fetchone() is None:
            raise HTTPException(404,"User not found")
        curr.execute(
            f"UPDATE Users SET {clause} WHERE user_id=%s",
            values
        )
    return {"user_id":user_id,"changes":list(changes.keys())}

