from datetime import datetime
from typing import Literal, Optional
 
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
 
from core.booking import cancel_booking_tx
from db import tx
 
router = APIRouter(prefix="/admin", tags=["admin"])
 
 
# ============================================================
# MODELS
# ============================================================
class StatusIn(BaseModel):
    status: Literal["active", "blocked"]
 
 
class RoleIn(BaseModel):
    role: Literal["customer", "organizer", "admin"]
 
 
class VenueIn(BaseModel):
    name: str = Field(min_length=1)
    city: str = Field(min_length=1)
    address: Optional[str] = None
    capacity: int = Field(gt=0)
 
 
class CategoryIn(BaseModel):
    name: str = Field(min_length=1)
 
 
class AdminEventCreate(BaseModel):
    organizer_id: int = Field(..., gt=0)
    venue_id: int = Field(..., gt=0)
    category_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    event_date: datetime
    status: Literal["draft", "published"] = "draft"
    ticket_name: str = Field(default="General Admission", max_length=100)
    price: float = Field(..., ge=0)
    total_quantity: int = Field(..., gt=0)
 
 
class AdminEventStatusUpdate(BaseModel):
    status: Literal["draft", "published", "cancelled", "completed"]
 
 
# ============================================================
# 1. DASHBOARD  (uses the report views from the schema)
# ============================================================
@router.get("/dashboard")
def dashboard():
    with tx() as cur:
        cur.execute("SELECT * FROM v_total_revenue")
        revenue = cur.fetchone()
        cur.execute("SELECT * FROM v_monthly_bookings ORDER BY month")
        monthly = cur.fetchall()
        cur.execute("SELECT * FROM v_top_users LIMIT 5")
        top = cur.fetchall()
    return {
        "total_revenue": (revenue or {}).get("total_revenue") or 0,
        "monthly_bookings": monthly,
        "top_users": top,
    }
 
 
# ============================================================
# 2. USERS
# ============================================================
@router.get("/users")
def list_users(role: Optional[str] = None, status: Optional[str] = None):
    sql = "SELECT user_id, name, email, phone, city, role, status, created_at FROM Users WHERE 1 = 1"
    args = []
    if role:
        sql += " AND role = %s"
        args.append(role)
    if status:
        sql += " AND status = %s"
        args.append(status)
    with tx() as cur:
        cur.execute(sql + " ORDER BY user_id", args)
        return cur.fetchall()
 
 
@router.patch("/users/{user_id}/status")
def set_user_status(user_id: int, body: StatusIn):
    with tx() as cur:
        cur.execute("SELECT user_id FROM Users WHERE user_id = %s", (user_id,))
        if cur.fetchone() is None:
            raise HTTPException(404, "User not found")
        cur.execute("UPDATE Users SET status = %s WHERE user_id = %s", (body.status, user_id))
    return {"user_id": user_id, "status": body.status}
 
 
@router.patch("/users/{user_id}/role")
def set_user_role(user_id: int, body: RoleIn):
    with tx() as cur:
        cur.execute("SELECT user_id FROM Users WHERE user_id = %s", (user_id,))
        if cur.fetchone() is None:
            raise HTTPException(404, "User not found")
        cur.execute("UPDATE Users SET role = %s WHERE user_id = %s", (body.role, user_id))
    return {"user_id": user_id, "role": body.role}
 
 
# ============================================================
# 3. VENUES
# ============================================================
@router.get("/venues")
def list_venues():
    with tx() as cur:
        cur.execute("SELECT * FROM Venues ORDER BY venue_id")
        return cur.fetchall()
 
 
@router.post("/venues", status_code=201)
def add_venue(body: VenueIn):
    with tx() as cur:
        cur.execute(
            "INSERT INTO Venues (name, city, address, capacity) VALUES (%s, %s, %s, %s)",
            (body.name, body.city, body.address, body.capacity),
        )
        return {"venue_id": cur.lastrowid}
 
 
@router.put("/venues/{venue_id}")
def edit_venue(venue_id: int, body: VenueIn):
    with tx() as cur:
        cur.execute("SELECT venue_id FROM Venues WHERE venue_id = %s", (venue_id,))
        if cur.fetchone() is None:
            raise HTTPException(404, "Venue not found")
        cur.execute(
            "UPDATE Venues SET name = %s, city = %s, address = %s, capacity = %s WHERE venue_id = %s",
            (body.name, body.city, body.address, body.capacity, venue_id),
        )
    return {"venue_id": venue_id, "updated": True}
 
 
@router.delete("/venues/{venue_id}")
def delete_venue(venue_id: int):
    with tx() as cur:      # the foreign key blocks deleting a venue that still has events
        cur.execute("SELECT venue_id FROM Venues WHERE venue_id = %s", (venue_id,))
        if cur.fetchone() is None:
            raise HTTPException(404, "Venue not found")
        cur.execute("DELETE FROM Venues WHERE venue_id = %s", (venue_id,))
    return {"venue_id": venue_id, "deleted": True}
 
 
# ============================================================
# 4. CATEGORIES
# ============================================================
@router.get("/categories")
def list_categories():
    with tx() as cur:
        cur.execute("SELECT * FROM Categories ORDER BY category_id")
        return cur.fetchall()
 
 
@router.post("/categories", status_code=201)
def add_category(body: CategoryIn):
    with tx() as cur:
        cur.execute("INSERT INTO Categories (name) VALUES (%s)", (body.name,))
        return {"category_id": cur.lastrowid}
 
 
@router.put("/categories/{category_id}")
def edit_category(category_id: int, body: CategoryIn):
    with tx() as cur:
        cur.execute("SELECT category_id FROM Categories WHERE category_id = %s", (category_id,))
        if cur.fetchone() is None:
            raise HTTPException(404, "Category not found")
        cur.execute("UPDATE Categories SET name = %s WHERE category_id = %s", (body.name, category_id))
    return {"category_id": category_id, "updated": True}
 
 
@router.delete("/categories/{category_id}")
def delete_category(category_id: int):
    with tx() as cur:
        cur.execute("SELECT category_id FROM Categories WHERE category_id = %s", (category_id,))
        if cur.fetchone() is None:
            raise HTTPException(404, "Category not found")
        cur.execute("DELETE FROM Categories WHERE category_id = %s", (category_id,))
    return {"category_id": category_id, "deleted": True}
 
 
# ============================================================
# 5. EVENT MANAGEMENT
# ============================================================
@router.get("/events")
def get_admin_events():
    """All events (any status) with venue, category, lowest price and total tickets."""
    with tx() as cur:
        cur.execute("""
            SELECT
                e.event_id, e.organizer_id, e.venue_id, e.category_id,
                e.title, e.description, e.event_date, e.status,
                v.name AS venue_name, v.city AS venue_city, c.name AS category_name,
                COALESCE(MIN(tt.price), 0) AS price,
                COALESCE(SUM(tt.total_quantity), 0) AS total_quantity
            FROM Events e
            LEFT JOIN Venues v ON v.venue_id = e.venue_id
            LEFT JOIN Categories c ON c.category_id = e.category_id
            LEFT JOIN Ticket_Types tt ON tt.event_id = e.event_id
            GROUP BY
                e.event_id, e.organizer_id, e.venue_id, e.category_id, e.title,
                e.description, e.event_date, e.status, v.name, v.city, c.name
            ORDER BY e.event_date DESC, e.event_id DESC
        """)
        return cur.fetchall()
 
 
@router.post("/events", status_code=201)
def create_admin_event(payload: AdminEventCreate):
    """Create an event and its first ticket type, in one transaction."""
    with tx() as cur:
        cur.execute(
            "SELECT user_id FROM Users WHERE user_id = %s AND role = 'organizer'",
            (payload.organizer_id,),
        )
        if not cur.fetchone():
            raise HTTPException(400, "Choose a valid organizer account.")
 
        cur.execute("SELECT venue_id FROM Venues WHERE venue_id = %s", (payload.venue_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Venue not found.")
 
        cur.execute("SELECT category_id FROM Categories WHERE category_id = %s", (payload.category_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Category not found.")
 
        cur.execute(
            "INSERT INTO Events (organizer_id, venue_id, category_id, title, description, event_date, status) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (payload.organizer_id, payload.venue_id, payload.category_id,
            payload.title.strip(), payload.description, payload.event_date, payload.status),
        )
        event_id = cur.lastrowid

        cur.execute(
            "INSERT INTO Ticket_Types (event_id, name, price, total_quantity, available_quantity) "
            "VALUES (%s, %s, %s, %s, %s)",
            (event_id, payload.ticket_name, payload.price,
            payload.total_quantity, payload.total_quantity),
        )
        return {"message": "Event created successfully.", "event_id": event_id} 

@router.patch("/events/{event_id}/status")
def update_admin_event_status(event_id: int, payload: AdminEventStatusUpdate):
    """Change an event's status. Cancelling also cancels and refunds its bookings."""
    with tx() as cur:
        cur.execute("SELECT event_id, status FROM Events WHERE event_id = %s FOR UPDATE", (event_id,))
        event = cur.fetchone()
        if not event:
            raise HTTPException(404, "Event not found.")

        cancelled_bookings = 0
        if payload.status == "cancelled" and event["status"] != "cancelled":
            cur.execute(
                "SELECT DISTINCT b.booking_id FROM Bookings b "
                "JOIN Booking_Items bi ON bi.booking_id = b.booking_id "
                "JOIN Ticket_Types tt ON tt.ticket_type_id = bi.ticket_type_id "
                "WHERE tt.event_id = %s AND b.status = 'confirmed' "
                "ORDER BY b.booking_id",
                (event_id,),
            )
            for row in cur.fetchall():
                cancel_booking_tx(cur, row["booking_id"], promote=False)   # refunds + returns stock
                cancelled_bookings += 1
            cur.execute(
                "UPDATE Waitlist w JOIN Ticket_Types tt ON tt.ticket_type_id = w.ticket_type_id "
                "SET w.status = 'expired' "
                "WHERE tt.event_id = %s AND w.status IN ('waiting', 'offered')",
                (event_id,),
            )

        cur.execute("UPDATE Events SET status = %s WHERE event_id = %s", (payload.status, event_id))

        return {
            "message": "Event status updated successfully.",
            "event_id": event_id,
            "status": payload.status,
            "bookings_cancelled": cancelled_bookings,
        }


@router.delete("/events/{event_id}")
def delete_admin_event(event_id: int):
    """Delete an event only if it has no booking history."""
    with tx() as cur:
        cur.execute("SELECT event_id FROM Events WHERE event_id = %s", (event_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Event not found.")

        cur.execute(
            "SELECT COUNT(*) AS booking_count FROM Booking_Items bi "
            "JOIN Ticket_Types tt ON tt.ticket_type_id = bi.ticket_type_id "
            "WHERE tt.event_id = %s",
            (event_id,),
        )
        if cur.fetchone()["booking_count"] > 0:
            raise HTTPException(409, "This event has booking history. Cancel it instead of deleting it.")

        cur.execute("DELETE FROM Ticket_Types WHERE event_id = %s", (event_id,))
        cur.execute("DELETE FROM Events WHERE event_id = %s", (event_id,))
        return {"message": "Event deleted successfully.", "event_id": event_id}
@router.get("/dashboard/summary")
def dashboard_summary():
    with tx() as cur:
        cur.execute("SELECT COUNT(*) AS n FROM Users")
        total_users = cur.fetchone()["n"]
        cur.execute("SELECT COUNT(*) AS n FROM Venues")
        total_venues = cur.fetchone()["n"]
        cur.execute("SELECT COUNT(*) AS n FROM Categories")
        total_categories = cur.fetchone()["n"]
        cur.execute("SELECT * FROM v_total_revenue")
        revenue = cur.fetchone()
    return {
        "total_users": total_users,
        "total_venues": total_venues,
        "total_categories": total_categories,
        "total_revenue": float((revenue or {}).get("total_revenue") or 0),
    }


@router.get("/bookings")
def list_bookings():
    """All bookings, oldest first (the dashboard shows the last 5, newest first)."""
    with tx() as cur:
        cur.execute("""
            SELECT b.booking_id,
                b.status,
                b.total_amount,
                MIN(e.title) AS event
            FROM Bookings b
            LEFT JOIN Booking_Items bi ON bi.booking_id = b.booking_id
            LEFT JOIN Ticket_Types tt ON tt.ticket_type_id = bi.ticket_type_id
            LEFT JOIN Events e ON e.event_id = tt.event_id
            GROUP BY b.booking_id, b.status, b.total_amount
            ORDER BY b.booking_id
        """)
        return cur.fetchall()