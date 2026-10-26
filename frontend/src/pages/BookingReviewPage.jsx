
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function formatDate(value) {
  if (!value) return "To be announced";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export default function BookingReviewPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  let draft = null;
  let user = null;

  try {
    draft = JSON.parse(
      sessionStorage.getItem("eventEaseBookingDraft") || "null"
    );
    user = JSON.parse(
      localStorage.getItem("eventEaseUser") || "null"
    );
  } catch {
    draft = null;
    user = null;
  }

  async function handleConfirmBooking() {
    if (loading) return;

    if (!user?.user_id) {
      navigate("/login?redirect=%2Fbooking-review");
      return;
    }

    if (!draft?.ticketTypeId || !draft?.quantity) {
      setError("Booking details are missing. Please select your tickets again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number(user.user_id),
          items: [
            {
              ticket_type_id: Number(draft.ticketTypeId),
              quantity: Number(draft.quantity),
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Booking failed. Please try again."
        );
      }

      sessionStorage.removeItem("eventEaseBookingDraft");

      navigate(`/booking-confirmation/${data.booking_id}`, {
        state: {
          bookingId: data.booking_id,
          status: data.status,
        },
      });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check that your backend is running."
          : err.message || "Unable to confirm booking."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!draft) {
    return (
      <section className="section">
        <div className="booking-card">
          <h1>No booking to review</h1>
          <p>Please select an event and choose your tickets first.</p>
          <Link to="/events">Explore Events</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="booking-card">
        <p className="eyebrow">BOOKING SUMMARY</p>
        <h1>Review your booking</h1>

        <h2>{draft.eventName}</h2>
        <p>Date: {formatDate(draft.eventDate)}</p>
        <p>
          Venue: {draft.venue || "To be announced"}
          {draft.city ? `, ${draft.city}` : ""}
        </p>
        <p>Ticket type: {draft.ticketType}</p>
        <p>Number of tickets: {draft.quantity}</p>

        <h2>
          Total: ₹{Number(draft.total || 0).toLocaleString("en-IN")}
        </h2>

        <p className="booking-note">
          The final price and availability will be checked by the server.
        </p>

        {error && (
          <p role="alert" style={{ color: "#c62828" }}>
            {error}
          </p>
        )}

        <button
          className="btn btn-primary"
          type="button"
          onClick={handleConfirmBooking}
          disabled={loading}
        >
          {loading ? "Confirming..." : "Confirm Booking"}
        </button>

        <p>
          <Link to="/events">Back to events</Link>
        </p>
      </div>
    </section>
  );
}
