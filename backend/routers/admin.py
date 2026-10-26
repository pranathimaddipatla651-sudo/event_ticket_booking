
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal

from db import tx

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================

class UserStatusUpdate(BaseModel):
    status: Literal["active", "blocked"]


class UserRoleUpdate(BaseModel):
    role: Literal["customer", "organizer", "admin"]


class VenueCreate(BaseModel):
    name: str = Field(..., max_length=120)
    city: str = Field(..., max_length=80)
    address: Optional[str] = Field(None, max_length=255)
    capacity: int = Field(..., gt=0)


class VenueUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=120)
    city: Optional[str] = Field(None, max_length=80)
    address: Optional[str] = Field(None, max_length=255)
    capacity: Optional[int] = Field(None, gt=0)


class CategoryCreate(BaseModel):
    name: str = Field(..., max_length=80)


class CategoryUpdate(BaseModel):
    name: str = Field(..., max_length=80)


# ============================================================
# 1. USER MANAGEMENT
# ============================================================

@router.get("/users")
def get_all_users():
    """Retrieve registered users without exposing password hashes."""
    with tx() as cur:
        cur.execute("""
            SELECT user_id, name, email, phone, city, role, status, created_at
            FROM Users
            ORDER BY user_id ASC
        """)
        return cur.fetchall()


@router.patch("/users/{user_id}/status")
def update_user_status(user_id: int, payload: UserStatusUpdate):
    """Block or activate a user."""
    with tx() as cur:
        cur.execute(
            "UPDATE Users SET status = %s WHERE user_id = %s",
            (payload.status, user_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "message": f"User status updated to {payload.status}",
            "user_id": user_id,
        }


@router.patch("/users/{user_id}/role")
def update_user_role(user_id: int, payload: UserRoleUpdate):
    """Change a user's role."""
    with tx() as cur:
        cur.execute(
            "UPDATE Users SET role = %s WHERE user_id = %s",
            (payload.role, user_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "message": f"User role updated to {payload.role}",
            "user_id": user_id,
        }


# ============================================================
# 2. VENUE MANAGEMENT
# ============================================================

@router.get("/venues")
def get_all_venues():
    """List all venues."""
    with tx() as cur:
        cur.execute("""
            SELECT venue_id, name, city, address, capacity
            FROM Venues
            ORDER BY venue_id ASC
        """)
        return cur.fetchall()


@router.post("/venues", status_code=201)
def create_venue(venue: VenueCreate):
    """Create a venue."""
    with tx() as cur:
        cur.execute("""
            INSERT INTO Venues (name, city, address, capacity)
            VALUES (%s, %s, %s, %s)
        """, (venue.name, venue.city, venue.address, venue.capacity))

        return {
            "message": "Venue created successfully",
            "venue_id": cur.lastrowid,
        }


@router.put("/venues/{venue_id}")
def update_venue(venue_id: int, venue: VenueUpdate):
    """Update venue information."""
    with tx() as cur:
        cur.execute(
            "SELECT venue_id FROM Venues WHERE venue_id = %s",
            (venue_id,),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Venue not found")

        updates = []
        params = []

        if venue.name is not None:
            updates.append("name = %s")
            params.append(venue.name)

        if venue.city is not None:
            updates.append("city = %s")
            params.append(venue.city)

        if venue.address is not None:
            updates.append("address = %s")
            params.append(venue.address)

        if venue.capacity is not None:
            updates.append("capacity = %s")
            params.append(venue.capacity)

        if not updates:
            raise HTTPException(
                status_code=400,
                detail="No fields provided for update",
            )

        params.append(venue_id)

        cur.execute(
            f"UPDATE Venues SET {', '.join(updates)} WHERE venue_id = %s",
            tuple(params),
        )

        return {
            "message": "Venue updated successfully",
            "venue_id": venue_id,
        }


@router.delete("/venues/{venue_id}")
def delete_venue(venue_id: int):
    """Delete a venue if database constraints permit it."""
    with tx() as cur:
        cur.execute(
            "DELETE FROM Venues WHERE venue_id = %s",
            (venue_id,),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Venue not found")

        return {
            "message": "Venue deleted successfully",
            "venue_id": venue_id,
        }


# ============================================================
# 3. CATEGORY MANAGEMENT
# ============================================================

@router.get("/categories")
def get_all_categories():
    """List event categories."""
    with tx() as cur:
        cur.execute("""
            SELECT category_id, name
            FROM Categories
            ORDER BY category_id ASC
        """)
        return cur.fetchall()


@router.post("/categories", status_code=201)
def create_category(category: CategoryCreate):
    """Create an event category."""
    with tx() as cur:
        cur.execute(
            "INSERT INTO Categories (name) VALUES (%s)",
            (category.name,),
        )

        return {
            "message": "Category created successfully",
            "category_id": cur.lastrowid,
        }


@router.put("/categories/{category_id}")
def update_category(category_id: int, category: CategoryUpdate):
    """Update a category."""
    with tx() as cur:
        cur.execute(
            "UPDATE Categories SET name = %s WHERE category_id = %s",
            (category.name, category_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Category not found")

        return {
            "message": "Category updated successfully",
            "category_id": category_id,
        }


@router.delete("/categories/{category_id}")
def delete_category(category_id: int):
    """Delete a category if database constraints permit it."""
    with tx() as cur:
        cur.execute(
            "DELETE FROM Categories WHERE category_id = %s",
            (category_id,),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Category not found")

        return {
            "message": "Category deleted successfully",
            "category_id": category_id,
        }


# ============================================================
# 4. ADMIN DASHBOARD SUMMARY
# ============================================================

@router.get("/dashboard/summary")
def get_dashboard_summary():
    """Return dashboard statistics from MySQL."""
    with tx() as cur:
        cur.execute("""
            SELECT COALESCE(SUM(total_revenue), 0) AS total_revenue
            FROM v_total_revenue
        """)
        revenue_data = cur.fetchone() or {"total_revenue": 0}

        cur.execute("SELECT COUNT(*) AS total_users FROM Users")
        total_users = cur.fetchone()["total_users"]

        cur.execute("SELECT COUNT(*) AS total_venues FROM Venues")
        total_venues = cur.fetchone()["total_venues"]

        cur.execute("SELECT COUNT(*) AS total_categories FROM Categories")
        total_categories = cur.fetchone()["total_categories"]

        cur.execute("SELECT COUNT(*) AS total_events FROM Events")
        total_events = cur.fetchone()["total_events"]

        cur.execute("SELECT COUNT(*) AS total_bookings FROM Bookings")
        total_bookings = cur.fetchone()["total_bookings"]

        cur.execute("""
            SELECT COUNT(*) AS active_bookings
            FROM Bookings
            WHERE LOWER(status) = 'confirmed'
        """)
        active_bookings = cur.fetchone()["active_bookings"]

        cur.execute("""
            SELECT COUNT(*) AS cancelled_bookings
            FROM Bookings
            WHERE LOWER(status) = 'cancelled'
        """)
        cancelled_bookings = cur.fetchone()["cancelled_bookings"]

        return {
            "total_revenue": revenue_data["total_revenue"],
            "total_users": total_users,
            "total_venues": total_venues,
            "total_categories": total_categories,
            "total_events": total_events,
            "total_bookings": total_bookings,
            "active_bookings": active_bookings,
            "cancelled_bookings": cancelled_bookings,
        }


# ============================================================
# 5. RECENT BOOKINGS
# ============================================================

@router.get("/bookings")
def get_recent_bookings():
    """Return recent bookings with their event and ticket details."""
    with tx() as cur:
        cur.execute("""
            SELECT
                b.booking_id,
                b.booking_date,
                b.total_amount,
                b.status,
                e.title AS event,
                COALESCE(SUM(bi.quantity), 0) AS quantity
            FROM Bookings b
            LEFT JOIN Booking_Items bi
                ON bi.booking_id = b.booking_id
            LEFT JOIN Ticket_Types tt
                ON tt.ticket_type_id = bi.ticket_type_id
            LEFT JOIN Events e
                ON e.event_id = tt.event_id
            GROUP BY
                b.booking_id,
                b.booking_date,
                b.total_amount,
                b.status,
                e.title
            ORDER BY b.booking_date DESC, b.booking_id DESC
            LIMIT 20
        """)
        return cur.fetchall()


# ============================================================
# 6. MONTHLY BOOKINGS REPORT
# ============================================================

@router.get("/dashboard/monthly-bookings")
def get_monthly_bookings_report():
    """Return monthly booking and revenue statistics."""
    with tx() as cur:
        cur.execute("""
            SELECT month, bookings, revenue
            FROM v_monthly_bookings
            ORDER BY month DESC
        """)
        return cur.fetchall()


# ============================================================
# 7. TOP USERS REPORT
# ============================================================

@router.get("/dashboard/top-users")
def get_top_users_report():
    """Return top customers ranked by spending."""
    with tx() as cur:
        cur.execute("""
            SELECT user_id, name, bookings, spent
            FROM v_top_users
            LIMIT 10
        """)
        return cur.fetchall()
