from fastapi import APIRouter

router=APIRouter(tags=["payments"])

@router.get("/payments-ping")
def ping():
    return {"message":"payments router works"}

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from core.booking import Item, book
from core.waitlist import promote_next  # noqa: F401  (re-exported for tests)
from db import tx

router = APIRouter(tags=["Payments, waitlist, reviews (Person 4)"])


class PaymentIn(BaseModel):
    booking_id: int
    method: str = Field(pattern="^(card|upi|netbanking|wallet)$")


class WaitlistIn(BaseModel):
    user_id: int
    ticket_type_id: int
    quantity: int = Field(default=1, gt=0)


class ReviewIn(BaseModel):
    user_id: int
    event_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


# ---- payments
@router.post("/payments", status_code=201)
def pay(body: PaymentIn):
    with tx() as cur:
        cur.execute("SELECT total_amount, status FROM Bookings WHERE booking_id = %s FOR UPDATE",
                    (body.booking_id,))
        b = cur.fetchone()
        if not b:
            raise HTTPException(404, "Booking not found")
        if b["status"] != "confirmed":
            raise HTTPException(409, "Only confirmed bookings can be paid")
        cur.execute("SELECT 1 FROM Payments WHERE booking_id = %s AND status = 'success'",
                    (body.booking_id,))
        if cur.fetchone():
            raise HTTPException(409, "Booking is already paid")
        # A real gateway call would go here; we record a successful payment.
        cur.execute("INSERT INTO Payments (booking_id, amount, method, status, paid_at) "
                    "VALUES (%s, %s, %s, 'success', NOW())",
                    (body.booking_id, b["total_amount"], body.method))
        return {"payment_id": cur.lastrowid, "status": "success", "amount": b["total_amount"]}


@router.get("/bookings/{booking_id}/payments")
def booking_payments(booking_id: int):
    with tx() as cur:
        cur.execute("SELECT * FROM Payments WHERE booking_id = %s ORDER BY payment_id", (booking_id,))
        return cur.fetchall()


# ---- waitlist
@router.post("/waitlist", status_code=201)
def join_waitlist(body: WaitlistIn):
    with tx() as cur:
        cur.execute("SELECT available_quantity FROM Ticket_Types WHERE ticket_type_id = %s",
                    (body.ticket_type_id,))
        tt = cur.fetchone()
        if not tt:
            raise HTTPException(404, "Ticket type not found")
        if tt["available_quantity"] >= body.quantity:
            raise HTTPException(409, "Tickets are available, book them directly")
        cur.execute("SELECT 1 FROM Waitlist WHERE user_id = %s AND ticket_type_id = %s "
                    "AND status IN ('waiting','offered')", (body.user_id, body.ticket_type_id))
        if cur.fetchone():
            raise HTTPException(409, "You are already on this waitlist")
        cur.execute("INSERT INTO Waitlist (user_id, ticket_type_id, quantity) VALUES (%s, %s, %s)",
                    (body.user_id, body.ticket_type_id, body.quantity))
        return {"waitlist_id": cur.lastrowid, "status": "waiting"}


@router.get("/users/{user_id}/waitlist")
def my_waitlist(user_id: int):
    with tx() as cur:
        cur.execute("SELECT * FROM Waitlist WHERE user_id = %s ORDER BY joined_at DESC", (user_id,))
        return cur.fetchall()


@router.post("/waitlist/{waitlist_id}/accept")
def accept_offer(waitlist_id: int):
    with tx() as cur:
        cur.execute("SELECT * FROM Waitlist WHERE waitlist_id = %s FOR UPDATE", (waitlist_id,))
        w = cur.fetchone()
        if not w:
            raise HTTPException(404, "Waitlist entry not found")
        cur.execute("SELECT %s > NOW() AS ok", (w["offer_expires_at"],))
        if w["status"] != "offered" or not cur.fetchone()["ok"]:
            raise HTTPException(409, "No active offer (it may have expired)")
        booking_id = book(cur, w["user_id"],
                          [Item(ticket_type_id=w["ticket_type_id"], quantity=w["quantity"])])
        cur.execute("UPDATE Waitlist SET status = 'booked' WHERE waitlist_id = %s", (waitlist_id,))
    return {"booking_id": booking_id, "status": "confirmed"}


@router.get("/reports/longest-waitlist")
def longest_waitlist():
    with tx() as cur:
        cur.execute("SELECT * FROM v_longest_waitlist")
        return cur.fetchall()


# ---- reviews
@router.post("/reviews", status_code=201)
def post_review(body: ReviewIn):
    with tx() as cur:
        cur.execute("SELECT event_date, status FROM Events WHERE event_id = %s", (body.event_id,))
        e = cur.fetchone()
        if not e:
            raise HTTPException(404, "Event not found")
        cur.execute("SELECT %s < NOW() AS over", (e["event_date"],))
        if not cur.fetchone()["over"] or e["status"] == "cancelled":
            raise HTTPException(409, "Reviews open only after an event has taken place")
        cur.execute(
            """SELECT 1 FROM Bookings b
                 JOIN Booking_Items bi ON bi.booking_id = b.booking_id
                 JOIN Ticket_Types tt ON tt.ticket_type_id = bi.ticket_type_id
                WHERE b.user_id = %s AND b.status = 'confirmed' AND tt.event_id = %s LIMIT 1""",
            (body.user_id, body.event_id))
        if not cur.fetchone():
            raise HTTPException(403, "Only attendees with a confirmed booking can review")
        cur.execute("INSERT INTO Reviews (user_id, event_id, rating, comment) VALUES (%s,%s,%s,%s)",
                    (body.user_id, body.event_id, body.rating, body.comment))
        return {"review_id": cur.lastrowid}


@router.get("/events/{event_id}/reviews")
def event_reviews(event_id: int):
    with tx() as cur:
        cur.execute("SELECT * FROM v_event_ratings WHERE event_id = %s", (event_id,))
        summary = cur.fetchone() or {"event_id": event_id, "avg_rating": None, "reviews": 0}
        cur.execute("SELECT r.review_id, u.name, r.rating, r.comment, r.created_at "
                    "FROM Reviews r JOIN Users u ON u.user_id = r.user_id "
                    "WHERE r.event_id = %s ORDER BY r.created_at DESC", (event_id,))
        return {"summary": summary, "reviews": cur.fetchall()}
