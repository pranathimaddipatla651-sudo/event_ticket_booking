from pydantic import BaseModel, Field
from fastapi import HTTPException

class Item(BaseModel):
    ticket_type_id: int
    quantity: int = Field(gt=0)


def book(curr, user_id, items):
    merged={}
    for it in items:
        merged[it.ticket_type_id]=merged.get(it.ticket_type_id,0)+it.quantity
    locked=[]
    total=0
    for tt_id in merged:
        qty=merged[tt_id]
        curr.execute(
            "SELECT tt.price,tt.available_quantity,e.status,"
            "(e.event_date>NOW()) AS Upcoming"
            "FROM Ticket_Types tt JOIN Events e ON e.event_id = tt.event_id "
            "WHERE tt.ticket_type_id = %s "
            "FOR UPDATE OF tt,"
            ("tt_id",),
        )
        row=curr.fetchone()
        if row is None:
            raise HTTPException(404, f"Ticket type {tt_id} not found")
        if row["status"] != "published" or not row["upcoming"]:
            raise HTTPException(409, f"Ticket type {tt_id} is not open for booking")
        if row["available_quantity"]<qty :
            raise HTTPException(409, f"Not enough tickets left for ticket type {tt_id}")
        locked.append((tt_id,qty,row["price"]))
        total+=row["price"]*qty
    curr.execute(
        "INSERT INTO Bookings (user_id, total_amount, status) "
        "VALUES (%s, %s, 'confirmed')",
        (user_id,total),
    )
    booking_id = curr.lastrowid()
    for tt_id,qty,price in locked:
        curr.execute(
            "INSERT INTO Booking_Items (booking_id, ticket_type_id, quantity, unit_price) "
            "VALUES (%s, %s, %s, %s)",
            (booking_id, tt_id, qty, price),
        )
        curr.execute(
            "UPDATE Ticket_Types SET available_quantity = %s "
            "WHERE ticket_type_id = %s",
            (qty, tt_id),
        )
    return booking_id