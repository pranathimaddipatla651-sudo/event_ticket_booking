
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from db import tx

router = APIRouter(prefix="/organizer", tags=["organizer"])


# =====================================================
# REQUEST MODELS
# =====================================================

class EventCreate(BaseModel):
    organizer_id: int = Field(gt=0)
    venue_id: int = Field(gt=0)
    category_id: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=150)
    description: Optional[str] = None
    event_date: datetime
    status: Literal["draft", "published"] = "draft"


class EventUpdate(BaseModel):
    venue_id: Optional[int] = Field(default=None, gt=0)
    category_id: Optional[int] = Field(default=None, gt=0)
    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    status: Optional[Literal["draft", "published", "completed"]] = None


class TicketCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    total_quantity: int = Field(gt=0)


class TicketUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=60)
    price: Optional[Decimal] = Field(
        default=None, ge=0, max_digits=10, decimal_places=2
    )
    total_quantity: Optional[int] = Field(default=None, gt=0)


# =====================================================
# HELPER: VERIFY EVENT OWNERSHIP
# =====================================================

def get_owned_event(cursor, event_id: int, organizer_id: int):
    cursor.execute(
        """
        SELECT event_id, organizer_id, venue_id, category_id,
               title, description, event_date, status, created_at
        FROM Events
        WHERE event_id = %s AND organizer_id = %s
        """,
        (event_id, organizer_id),
    )

    event = cursor.fetchone()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found or not owned by this organizer",
        )

    return event


# =====================================================
# 1. TEST ORGANIZER ROUTER
# GET /organizer/ping
# =====================================================

@router.get("/ping")
def ping():
    return {"message": "Organizer router working fine"}


# =====================================================
# 2. CREATE EVENT
# POST /organizer/events
# =====================================================

@router.post("/events", status_code=201)
def create_event(data: EventCreate):

    with tx() as cursor:
        # Verify that the user exists and is an active organizer.
        cursor.execute(
            """
            SELECT user_id
            FROM Users
            WHERE user_id = %s
              AND role = 'organizer'
              AND status = 'active'
            """,
            (data.organizer_id,),
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=403,
                detail="An active organizer account is required",
            )

        cursor.execute(
            "SELECT venue_id FROM Venues WHERE venue_id = %s",
            (data.venue_id,),
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Venue not found")

        cursor.execute(
            "SELECT category_id FROM Categories WHERE category_id = %s",
            (data.category_id,),
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Category not found")

        cursor.execute(
            """
            INSERT INTO Events
                (organizer_id, venue_id, category_id, title,
                 description, event_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data.organizer_id,
                data.venue_id,
                data.category_id,
                data.title.strip(),
                data.description,
                data.event_date,
                data.status,
            ),
        )

        event_id = cursor.lastrowid

    return {
        "message": "Event created successfully",
        "event_id": event_id,
    }


# =====================================================
# 3. VIEW ORGANIZER'S EVENTS
# GET /organizer/events?organizer_id=1
# =====================================================

@router.get("/events")
def list_events(organizer_id: int = Query(gt=0)):

    with tx() as cursor:
        cursor.execute(
            """
            SELECT e.event_id, e.organizer_id, e.venue_id,
                   e.category_id, e.title, e.description,
                   e.event_date, e.status, e.created_at,
                   v.name AS venue_name, v.city,
                   c.name AS category_name
            FROM Events e
            JOIN Venues v ON v.venue_id = e.venue_id
            JOIN Categories c ON c.category_id = e.category_id
            WHERE e.organizer_id = %s
            ORDER BY e.event_date
            """,
            (organizer_id,),
        )

        events = cursor.fetchall()

    return {"events": events}


# =====================================================
# 4. VIEW ONE EVENT
# GET /organizer/events/1?organizer_id=1
# =====================================================

@router.get("/events/{event_id}")
def get_event(event_id: int, organizer_id: int = Query(gt=0)):

    with tx() as cursor:
        event = get_owned_event(cursor, event_id, organizer_id)

    return event


# =====================================================
# 5. UPDATE EVENT
# PUT /organizer/events/1?organizer_id=1
# =====================================================

@router.put("/events/{event_id}")
def update_event(
    event_id: int,
    data: EventUpdate,
    organizer_id: int = Query(gt=0),
):

    updates = data.dict(exclude_unset=True)

    if not updates:
        raise HTTPException(status_code=400, detail="No changes supplied")

    if "title" in updates:
        if updates["title"] is None or not updates["title"].strip():
            raise HTTPException(status_code=422, detail="Title cannot be empty")
        updates["title"] = updates["title"].strip()

    if "venue_id" in updates and updates["venue_id"] is None:
        raise HTTPException(status_code=422, detail="Venue ID cannot be null")

    if "category_id" in updates and updates["category_id"] is None:
        raise HTTPException(status_code=422, detail="Category ID cannot be null")

    if "event_date" in updates and updates["event_date"] is None:
        raise HTTPException(status_code=422, detail="Event date cannot be null")

    if "status" in updates and updates["status"] is None:
        raise HTTPException(status_code=422, detail="Status cannot be null")

    allowed_columns = {
        "venue_id", "category_id", "title",
        "description", "event_date", "status"
    }

    with tx() as cursor:
        get_owned_event(cursor, event_id, organizer_id)

        if "venue_id" in updates:
            cursor.execute(
                "SELECT venue_id FROM Venues WHERE venue_id = %s",
                (updates["venue_id"],),
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Venue not found")

        if "category_id" in updates:
            cursor.execute(
                "SELECT category_id FROM Categories WHERE category_id = %s",
                (updates["category_id"],),
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Category not found")

        # Column names come only from the fixed allowlist above.
        columns = [key for key in updates if key in allowed_columns]
        set_clause = ", ".join(f"{column} = %s" for column in columns)
        values = [updates[column] for column in columns]

        cursor.execute(
            f"""
            UPDATE Events
            SET {set_clause}
            WHERE event_id = %s AND organizer_id = %s
            """,
            values + [event_id, organizer_id],
        )

    return {"message": "Event updated successfully"}


# =====================================================
# 6. CANCEL EVENT
# POST /organizer/events/1/cancel?organizer_id=1
# =====================================================

@router.post("/events/{event_id}/cancel")
def cancel_event(event_id: int, organizer_id: int = Query(gt=0)):

    with tx() as cursor:
        get_owned_event(cursor, event_id, organizer_id)

        cursor.execute(
            """
            UPDATE Events
            SET status = 'cancelled'
            WHERE event_id = %s
              AND organizer_id = %s
              AND status IN ('draft', 'published')
            """,
            (event_id, organizer_id),
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=409,
                detail="Event cannot be cancelled from its current status",
            )

    return {
        "message": "Event cancelled. Coordinate refunds with the payments module."
    }


# =====================================================
# 7. ADD TICKET TYPE
# POST /organizer/events/1/tickets?organizer_id=1
# =====================================================

@router.post("/events/{event_id}/tickets", status_code=201)
def create_ticket(
    event_id: int,
    data: TicketCreate,
    organizer_id: int = Query(gt=0),
):

    with tx() as cursor:
        event = get_owned_event(cursor, event_id, organizer_id)

        if event["status"] != "published":
            raise HTTPException(
                status_code=409,
                detail="Tickets can only be added to published events",
            )

        cursor.execute(
            """
            INSERT INTO Ticket_Types
                (event_id, name, price, total_quantity, available_quantity)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                event_id,
                data.name.strip(),
                data.price,
                data.total_quantity,
                data.total_quantity,
            ),
        )

        ticket_type_id = cursor.lastrowid

    return {
        "message": "Ticket type created successfully",
        "ticket_type_id": ticket_type_id,
    }


# =====================================================
# 8. VIEW TICKET TYPES
# GET /organizer/events/1/tickets?organizer_id=1
# =====================================================

@router.get("/events/{event_id}/tickets")
def list_tickets(
    event_id: int,
    organizer_id: int = Query(gt=0),
):

    with tx() as cursor:
        get_owned_event(cursor, event_id, organizer_id)

        cursor.execute(
            """
            SELECT ticket_type_id, event_id, name, price,
                   total_quantity, available_quantity,
                   total_quantity - available_quantity AS sold,
                   CASE
                       WHEN available_quantity = 0 THEN 'SOLD OUT'
                       WHEN available_quantity <= total_quantity * 0.1
                           THEN 'NEARLY SOLD OUT'
                       ELSE 'OK'
                   END AS alert
            FROM Ticket_Types
            WHERE event_id = %s
            ORDER BY price
            """,
            (event_id,),
        )

        tickets = cursor.fetchall()

    return {"tickets": tickets}


# =====================================================
# 9. UPDATE TICKET TYPE
# PUT /organizer/tickets/1?organizer_id=1
# =====================================================

@router.put("/tickets/{ticket_type_id}")
def update_ticket(
    ticket_type_id: int,
    data: TicketUpdate,
    organizer_id: int = Query(gt=0),
):

    updates = data.dict(exclude_unset=True)

    if not updates:
        raise HTTPException(status_code=400, detail="No changes supplied")

    if "name" in updates:
        if updates["name"] is None or not updates["name"].strip():
            raise HTTPException(status_code=422, detail="Ticket name cannot be empty")
        updates["name"] = updates["name"].strip()

    if "price" in updates and updates["price"] is None:
        raise HTTPException(status_code=422, detail="Price cannot be null")

    if "total_quantity" in updates and updates["total_quantity"] is None:
        raise HTTPException(status_code=422, detail="Quantity cannot be null")

    with tx() as cursor:
        cursor.execute(
            """
            SELECT tt.*, e.organizer_id, e.status AS event_status
            FROM Ticket_Types tt
            JOIN Events e ON e.event_id = tt.event_id
            WHERE tt.ticket_type_id = %s
            FOR UPDATE
            """,
            (ticket_type_id,),
        )

        ticket = cursor.fetchone()

        if not ticket or ticket["organizer_id"] != organizer_id:
            raise HTTPException(
                status_code=404,
                detail="Ticket type not found or not owned by this organizer",
            )

        if ticket["event_status"] != "published":
            raise HTTPException(
                status_code=409,
                detail="Tickets can only be edited for published events",
            )

        sold = ticket["total_quantity"] - ticket["available_quantity"]
        new_total = updates.get("total_quantity", ticket["total_quantity"])

        if new_total < sold:
            raise HTTPException(
                status_code=409,
                detail=f"Total quantity cannot be less than tickets sold ({sold})",
            )

        new_available = new_total - sold
        new_name = updates.get("name", ticket["name"])
        new_price = updates.get("price", ticket["price"])

        cursor.execute(
            """
            UPDATE Ticket_Types
            SET name = %s,
                price = %s,
                total_quantity = %s,
                available_quantity = %s
            WHERE ticket_type_id = %s
            """,
            (new_name, new_price, new_total, new_available, ticket_type_id),
        )

    return {"message": "Ticket type updated successfully"}


# =====================================================
# 10. DELETE TICKET TYPE
# DELETE /organizer/tickets/1?organizer_id=1
# =====================================================

@router.delete("/tickets/{ticket_type_id}")
def delete_ticket(
    ticket_type_id: int,
    organizer_id: int = Query(gt=0),
):

    with tx() as cursor:
        cursor.execute(
            """
            SELECT tt.ticket_type_id, tt.event_id, e.organizer_id,
                   e.status AS event_status
            FROM Ticket_Types tt
            JOIN Events e ON e.event_id = tt.event_id
            WHERE tt.ticket_type_id = %s
            """,
            (ticket_type_id,),
        )

        ticket = cursor.fetchone()

        if not ticket or ticket["organizer_id"] != organizer_id:
            raise HTTPException(
                status_code=404,
                detail="Ticket type not found or not owned by this organizer",
            )

        if ticket["event_status"] != "draft":
            raise HTTPException(
                status_code=409,
                detail="Only ticket types belonging to draft events can be deleted",
            )

        cursor.execute(
            "SELECT COUNT(*) AS total FROM Booking_Items WHERE ticket_type_id = %s",
            (ticket_type_id,),
        )

        if cursor.fetchone()["total"] > 0:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete a ticket type with booking records",
            )

        cursor.execute(
            "DELETE FROM Ticket_Types WHERE ticket_type_id = %s",
            (ticket_type_id,),
        )

    return {"message": "Ticket type deleted successfully"}


# =====================================================
# 11. EVENT SALES REPORT
# GET /organizer/sales?organizer_id=1
# =====================================================

@router.get("/sales")
def event_sales(organizer_id: int = Query(gt=0)):

    with tx() as cursor:
        cursor.execute(
            """
            SELECT v.event_id, v.title, v.ticket_type,
                   v.total_quantity, v.sold, v.available_quantity,
                   v.alert, v.revenue
            FROM v_event_sales v
            JOIN Events e ON e.event_id = v.event_id
            WHERE e.organizer_id = %s
            ORDER BY e.event_date DESC, v.ticket_type
            """,
            (organizer_id,),
        )

        rows = cursor.fetchall()

    return {"sales": rows}


# =====================================================
# 12. SALES SUMMARY FOR EACH EVENT
# GET /organizer/events/1/sales?organizer_id=1
# =====================================================

@router.get("/events/{event_id}/sales")
def single_event_sales(
    event_id: int,
    organizer_id: int = Query(gt=0),
):

    with tx() as cursor:
        get_owned_event(cursor, event_id, organizer_id)

        cursor.execute(
            """
            SELECT event_id, title, ticket_type, total_quantity,
                   sold, available_quantity, alert, revenue
            FROM v_event_sales
            WHERE event_id = %s
            ORDER BY ticket_type
            """,
            (event_id,),
        )

        rows = cursor.fetchall()

    return {"event_id": event_id, "sales": rows}
