def refund_booking(cur,booking__id):
    pass 
#person 4 will write this

def promote_next(curr,ticket_type_id):
    pass
#person 4 will write this
from db import tx


def refund_booking(cur, booking_id: int):
    """Mark successful payments of a booking as refunded."""
    cur.execute(
        "UPDATE Payments SET status = 'refunded', refunded_at = NOW() "
        "WHERE booking_id = %s AND status = 'success'", (booking_id,))


def promote_next(cur, tt_id: int):
    """Offer freed-up tickets to the longest-waiting user (30 minute window)."""
    cur.execute(
        "SELECT available_quantity FROM Ticket_Types WHERE ticket_type_id = %s FOR UPDATE",
        (tt_id,))
    row = cur.fetchone()
    if not row:
        return
    cur.execute(
        "SELECT COALESCE(SUM(quantity), 0) AS q FROM Waitlist "
        "WHERE ticket_type_id = %s AND status = 'offered'", (tt_id,))
    free = row["available_quantity"] - int(cur.fetchone()["q"])   # not already promised
    if free <= 0:
        return
    cur.execute(
        """SELECT waitlist_id FROM Waitlist
            WHERE ticket_type_id = %s AND status = 'waiting' AND quantity <= %s
            ORDER BY joined_at LIMIT 1 FOR UPDATE""", (tt_id, free))
    nxt = cur.fetchone()
    if nxt:
        cur.execute(
            "UPDATE Waitlist SET status = 'offered', "
            "offer_expires_at = NOW() + INTERVAL 30 MINUTE WHERE waitlist_id = %s",
            (nxt["waitlist_id"],))


def expire_offers():
    """Run every minute from main.py: expire old offers, pass them to the next person."""
    with tx() as cur:
        cur.execute("SELECT DISTINCT ticket_type_id FROM Waitlist "
                    "WHERE status = 'offered' AND offer_expires_at < NOW()")
        affected = [r["ticket_type_id"] for r in cur.fetchall()]
        cur.execute("UPDATE Waitlist SET status = 'expired' "
                    "WHERE status = 'offered' AND offer_expires_at < NOW()")
        for tt_id in affected:
            promote_next(cur, tt_id)
