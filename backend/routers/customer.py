
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, EmailStr
from datetime import date

from core.security import hash_password, verify_password
from core.booking import Item,book
from db import tx

router = APIRouter(tags=["customer"])


# -------------------- REQUEST MODELS --------------------

class Register(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    phone: str | None = Field(default=None, pattern=r"^[6-9]\d{9}$")
    city: str | None = None


class Login(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    phone: str | None = Field(default=None, pattern=r"^[6-9]\d{9}$")
    city: str | None = None


# -------------------- CUSTOMER REGISTRATION --------------------

@router.post("/register", status_code=201)
def register(body: Register):
    with tx() as curr:
        curr.execute(
            """
            INSERT INTO Users
                (name, email, password_hash, phone, city, role)
            VALUES (%s, %s, %s, %s, %s, 'customer')
            """,
            (
                body.name,
                body.email,
                hash_password(body.password),
                body.phone,
                body.city,
            ),
        )
        user_id = curr.lastrowid

    return {"userID": user_id}


# -------------------- CUSTOMER LOGIN --------------------

@router.post("/login")
def login(body: Login):
    with tx() as curr:
        curr.execute(
            """
            SELECT user_id, name, password_hash, role, status
            FROM Users
            WHERE email = %s
            """,
            (body.email,),
        )
        user = curr.fetchone()

    if user is None or not verify_password(
        body.password, user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Wrong email or password",
        )

    if user["status"] != "active":
        raise HTTPException(
            status_code=403,
            detail="Account is not active",
        )

    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "role": user["role"],
    }


# -------------------- GET CUSTOMER PROFILE --------------------

@router.get("/users/{user_id}")
def get_profile(user_id: int):
    with tx() as curr:
        curr.execute(
            """
            SELECT user_id, name, email, phone, city, role, created_at
            FROM Users
            WHERE user_id = %s
            """,
            (user_id,),
        )
        user = curr.fetchone()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


# -------------------- UPDATE CUSTOMER PROFILE --------------------

@router.patch("/users/{user_id}")
def update_profile(user_id: int, body: ProfileUpdate):
    changes = body.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(
            status_code=400,
            detail="Nothing to update",
        )

    if "name" in changes and (
        changes["name"] is None or not changes["name"].strip()
    ):
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty",
        )

    # Only allow these specific profile columns to be updated.
    allowed_columns = {"name", "phone", "city"}
    if not set(changes).issubset(allowed_columns):
        raise HTTPException(
            status_code=400,
            detail="Invalid profile fields",
        )

    clause = ", ".join(f"{column} = %s" for column in changes)
    values = list(changes.values()) + [user_id]

    with tx() as curr:
        curr.execute(
            "SELECT user_id FROM Users WHERE user_id = %s",
            (user_id,),
        )

        if curr.fetchone() is None:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        curr.execute(
            f"UPDATE Users SET {clause} WHERE user_id = %s",
            values,
        )

    return {
        "user_id": user_id,
        "changes": list(changes.keys()),
    }


# -------------------- SEARCH EVENTS --------------------

@router.get("/events")
def search_events(
    city: str | None = None,
    category_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    keyword: str | None = None,
):
    sql = (
        "SELECT e.event_id, e.title, e.event_date, "
        "v.name AS venue, v.city, c.name AS category "
        "FROM Events e "
        "JOIN Venues v ON v.venue_id = e.venue_id "
        "JOIN Categories c ON c.category_id = e.category_id "
        "WHERE e.status IN ('published', 'completed')"
    )

    args = []

    if not date_from and not date_to:
        sql += " AND e.event_date > NOW()"

    if city:
        sql += " AND v.city = %s"
        args.append(city)

    if category_id is not None:
        sql += " AND e.category_id = %s"
        args.append(category_id)

    if date_from:
        sql += " AND e.event_date >= %s"
        args.append(date_from)

    if date_to:
        sql += " AND e.event_date < %s + INTERVAL 1 DAY"
        args.append(date_to)

    if keyword:
        sql += " AND e.title LIKE %s"
        args.append(f"%{keyword}%")

    with tx() as curr:
        curr.execute(sql + " ORDER BY e.event_date", args)
        events = curr.fetchall()

@router.get("/events/{event_id}/tickets")
def event_tickets(event_id:int):
    with tx() as curr:
        curr.execute(
            "SELECT event_id FROM Events where event_id= %s AND status IN ('published', 'completed')",
            (event_id,),
        )
        if curr.fetchone() is None:
            raise HTTPException(404,"Event not found")
        curr.execute(
            "SELECT ticket_type_id, name, price, available_quantity, "
            "(available_quantity = 0) AS sold_out "
            "FROM Ticket_Types WHERE event_id = %s ORDER BY price",
            (event_id,),
        )
        return curr.fetchall()






