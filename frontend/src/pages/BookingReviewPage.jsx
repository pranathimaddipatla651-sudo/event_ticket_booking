
import { Link, useNavigate } from "react-router-dom";

export default function BookingReviewPage() {
  const navigate = useNavigate();

  let booking = null;

  try {
    booking = JSON.parse(
      sessionStorage.getItem("eventEaseBookingDraft") || "null"
    );
  } catch {
    booking = null;
  }

  if (!booking) {
    return (
      <section className="section">
        <h1>No booking to review</h1>
        <p>Please select an event and try again.</p>
        <Link to="/events">Explore Events</Link>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="booking-card">
        <p className="eyebrow">BOOKING SUMMARY</p>
        <h1>Review your booking</h1>

        <h2>{booking.eventName}</h2>
        <p>Date: {booking.eventDate || "To be announced"}</p>
        <p>Venue: {booking.venue || "To be announced"}</p>
        <p>Ticket type: {booking.ticketType}</p>
        <p>Number of tickets: {booking.quantity}</p>

        <h2>
          Total: ₹{Number(booking.total || 0).toLocaleString("en-IN")}
        </h2>

        <p>
          This is a preview. A booking has not yet been saved to the database.
        </p>

        <button
          className="btn btn-primary"
          onClick={() => navigate("/events")}
        >
          Back to events
        </button>
      </div>
    </section>
  );
}
