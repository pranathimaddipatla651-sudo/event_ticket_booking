from fastapi import APIRouter,HTTPException
from pydantic import BaseModel,Field,EmailStr
from typing import Annotated
from datetime import date

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

@router.get("/events")
def search_events(
    city:str|None=None,
    category_id:int|None=None,
    date_from:date|None=None,
    date_to:date|None=None,
    keyword:str|None=None
):
    sql=(
        "SELECT e.event_id, e.title, e.event_date, "
        "v.name AS venue, v.city, c.name AS category "
        "FROM Events e "
        "JOIN Venues v ON v.venue_id = e.venue_id "
        "JOIN Categories c ON c.category_id = e.category_id "
        "WHERE e.status IN ('published','completed')"
    )
    args=[]
    if not date_from and not date_to:
        sql+=" AND e.event_date > NOW()"
    if city:
        sql+=" AND v.city = %s"
        args.append(city)
    if category_id:
        sql+=" AND e.category_id = %s"
        args.append(category_id)
    if date_from:
        sql+=" AND e.event_date >= %s"
        args.append(date_from)
    if date_to:
        sql+=" AND e.event_date < %s + INTERVAL 1 DAY"
        args.append(date_to)
    if keyword:
        sql+=" AND e.title LIKE %s"
        args.append(f"%{keyword}%")
    with tx() as curr:
        curr.execute(sql+" ORDER BY e.event_date",args)
        return curr.fetchall()


