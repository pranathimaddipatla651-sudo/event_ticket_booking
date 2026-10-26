# ============================================================
# 8. EVENT MANAGEMENT
# ============================================================

from datetime import date
from fastapi import HTTPException
from pydantic import BaseModel, Field
from typing import Literal


class AdminEventCreate(BaseModel):
    organizer_id: int = Field(..., gt=0)
    venue_id: int = Field(..., gt=0)
    category_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    event_date: date
    status: Literal["draft", "published"] = "draft"
    ticket_name: str = Field(default="General Admission", max_length=100)
    price: float = Field(..., ge=0)
    total_quantity: int = Field(..., gt=0)


class AdminEventStatusUpdate(BaseModel):
    status: Literal["draft", "published", "cancelled", "completed"]


@router.get("/events")
def get_admin_events():
    """Fetch actual events and their ticket information from MySQL."""
    with tx() as cur:
        cur.execute("""
            SELECT
                e.event_id,
                e.organizer_id,
                e.venue_id,
                e.category_id,
                e.title,
                e.description,
                e.event_date,
                e.status,
                v.name AS venue_name,
                v.city AS venue_city,
                c.name AS category_name,
                COALESCE(MIN(tt.price), 0) AS price,
                COALESCE(SUM(tt.total_quantity), 0) AS total_quantity
            FROM Events e
            LEFT JOIN Venues v ON v.venue_id = e.venue_id
            LEFT JOIN Categories c ON c.category_id = e.category_id
            LEFT JOIN Ticket_Types tt ON tt.event_id = e.event_id
            GROUP BY
                e.event_id, e.organizer_id, e.venue_id,
                e.category_id, e.title, e.description,
                e.event_date, e.status, v.name, v.city, c.name
            ORDER BY e.event_date DESC, e.event_id DESC
        """)
        return cur.fetchall()


@router.post("/events", status_code=201)
def create_admin_event(payload: AdminEventCreate):
    """Create an event and its initial ticket type."""
    with tx() as cur:
        # Validate the related records before inserting.
        cur.execute(
            "SELECT user_id FROM Users WHERE user_id = %s AND role = 'organizer'",
            (payload.organizer_id,),
        )
        if not cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Choose a valid organizer account.",
            )

        cur.execute(
            "SELECT venue_id FROM Venues WHERE venue_id = %s",
            (payload.venue_id,),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="Venue not found.")

        cur.execute(
            "SELECT category_id FROM Categories WHERE category_id = %s",
            (payload.category_id,),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="Category not found.")

        cur.execute("""
            INSERT INTO Events
                (organizer_id, venue_id, category_id, title,
                 description, event_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            payload.organizer_id,
            payload.venue_id,
            payload.category_id,
            payload.title.strip(),
            payload.description,
            payload.event_date,
            payload.status,
        ))

        event_id = cur.lastrowid

        cur.execute("""
            INSERT INTO Ticket_Types
                (event_id, name, price, total_quantity, available_quantity)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            event_id,
            payload.ticket_name,
            payload.price,
            payload.total_quantity,
            payload.total_quantity,
        ))

        return {
            "message": "Event created successfully.",
            "event_id": event_id,
        }


@router.patch("/events/{event_id}/status")
def update_admin_event_status(
    event_id: int,
    payload: AdminEventStatusUpdate,
):
    """Update the status of an existing event."""
    with tx() as cur:
        cur.execute(
            "SELECT event_id FROM Events WHERE event_id = %s",
            (event_id,),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Event not found.")

        cur.execute(
            "UPDATE Events SET status = %s WHERE event_id = %s",
            (payload.status, event_id),
        )

        return {
            "message": "Event status updated successfully.",
            "event_id": event_id,
            "status": payload.status,
        }


@router.delete("/events/{event_id}")
def delete_admin_event(event_id: int):
    """Delete an event only if it has no booking history."""
    with tx() as cur:
        cur.execute(
            "SELECT event_id FROM Events WHERE event_id = %s",
            (event_id,),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Event not found.")

        cur.execute("""
            SELECT COUNT(*) AS booking_count
            FROM Booking_Items bi
            JOIN Ticket_Types tt
                ON tt.ticket_type_id = bi.ticket_type_id
            WHERE tt.event_id = %s
        """, (event_id,))

        if cur.fetchone()["booking_count"] > 0:
            raise HTTPException(
                status_code=409,
                detail="This event has booking history. Cancel it instead of deleting it.",
            )

        # Remove dependent ticket types before the event.
        cur.execute(
            "DELETE FROM Ticket_Types WHERE event_id = %s",
            (event_id,),
        )
        cur.execute(
            "DELETE FROM Events WHERE event_id = %s",
            (event_id,),
        )

        return {
            "message": "Event deleted successfully.",
            "event_id": event_id,
        }