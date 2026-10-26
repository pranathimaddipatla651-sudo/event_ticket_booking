from pydantic import BaseModel, Field
from fastapi import HTTPException

from core.waitlist import promote_next, refund_booking

class Item(BaseModel):
    ticket_type_id: int
    quantity: int = Field(gt=0)


def book(curr, user_id, items):
    merged = {}
    for it in items:
        merged[it.ticket_type_id] = merged.get(it.ticket_type_id, 0) + it.quantity

    locked = []
    total = 0

    for tt_id in sorted(merged):
        qty = merged[tt_id]
        curr.execute(
            "SELECT tt.price, tt.available_quantity, e.status, "
            "(e.event_date > NOW()) AS upcoming "
            "FROM Ticket_Types tt JOIN Events e ON e.event_id = tt.event_id "
            "WHERE tt.ticket_type_id = %s "
            "FOR UPDATE OF tt",
            (tt_id,),
        )
        row = curr.fetchone()

        if row is None:
            raise HTTPException(404, f"Ticket type {tt_id} not found")
        if row["status"] != "published" or not row["upcoming"]:
            raise HTTPException(409, f"Ticket type {tt_id} is not open for booking")
        if row["available_quantity"] < qty:
            raise HTTPException(409, f"Not enough tickets left for ticket type {tt_id}")

        locked.append((tt_id, qty, row["price"]))
        total += row["price"] * qty

    curr.execute(
        "INSERT INTO Bookings (user_id, total_amount, status) "
        "VALUES (%s, %s, 'confirmed')",
        (user_id, total),
    )
    booking_id = curr.lastrowid

    for tt_id, qty, price in locked:
        curr.execute(
            "INSERT INTO Booking_Items (booking_id, ticket_type_id, quantity, unit_price) "
            "VALUES (%s, %s, %s, %s)",
            (booking_id, tt_id, qty, price),
        )
        curr.execute(
            "UPDATE Ticket_Types SET available_quantity = available_quantity - %s "
            "WHERE ticket_type_id = %s",
            (qty, tt_id),
        )

    return booking_id

def cancel_booking_tx(cur, booking_id, user_id=None, promote=True):
    """
    Cancel a booking: mark it cancelled, return the tickets to stock, refund the
    payment (Person 4's refund_booking), then offer the freed tickets to the
    waitlist (Person 4's promote_next).
    Pass user_id to check that the booking belongs to that user.
    Pass promote=False when a whole event is cancelled (nobody to promote).
    """
    # Lock the booking row, so two quick clicks on "Cancel" cannot both pass
    cur.execute(
        "SELECT user_id, status FROM Bookings WHERE booking_id = %s FOR UPDATE",
        (booking_id,),
    )
    b = cur.fetchone()

    if b is None:
        raise HTTPException(404, "Booking not found")
    if user_id is not None and b["user_id"] != user_id:
        raise HTTPException(403, "This booking belongs to another user")
    if b["status"] == "cancelled":
        raise HTTPException(409, "Booking is already cancelled")

    # Cannot cancel once the event has started (only when a user cancels their own)
    if promote:
        cur.execute(
            "SELECT (MIN(e.event_date) <= NOW()) AS started "
            "FROM Booking_Items bi "
            "JOIN Ticket_Types tt ON tt.ticket_type_id = bi.ticket_type_id "
            "JOIN Events e ON e.event_id = tt.event_id "
            "WHERE bi.booking_id = %s",
            (booking_id,),
        )
        if cur.fetchone()["started"]:
            raise HTTPException(409, "The event has already started, so it cannot be cancelled")

    cur.execute("UPDATE Bookings SET status = 'cancelled' WHERE booking_id = %s", (booking_id,))

    # Return the tickets to stock (in id order, same as book(), to avoid deadlocks)
    cur.execute(
        "SELECT ticket_type_id, quantity FROM Booking_Items "
        "WHERE booking_id = %s ORDER BY ticket_type_id",
        (booking_id,),
    )
    items = cur.fetchall()
    for it in items:
        cur.execute(
            "UPDATE Ticket_Types SET available_quantity = available_quantity + %s "
            "WHERE ticket_type_id = %s",
            (it["quantity"], it["ticket_type_id"]),
        )

    refund_booking(cur, booking_id)              # Person 4

    if promote:
        for it in items:
            promote_next(cur, it["ticket_type_id"])   # Person 4
