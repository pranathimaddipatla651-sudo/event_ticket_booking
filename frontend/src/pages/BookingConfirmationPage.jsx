
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function formatDate(value) {
  if (!value) return "Date not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBooking() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/bookings/${bookingId}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "This booking could not be found."
              : "Unable to retrieve your booking details."
          );
        }

        const data = await response.json();
        setBooking(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (bookingId) {
      loadBooking();
    } else {
      setError("No booking ID was provided.");
      setLoading(false);
    }

    return () => controller.abort();
  }, [bookingId]);

  if (loading) {
    return (
      <main className="confirmation-page">
        <div className="confirmation-card loading-card">
          <div className="confirmation-spinner" />
          <h2>Loading your booking...</h2>
          <p>Please wait while we retrieve your ticket details.</p>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="confirmation-page">
        <div className="confirmation-card error-card">
          <div className="confirmation-error-icon">!</div>
          <p className="confirmation-eyebrow">EVENTEASE</p>
          <h1>Booking Not Found</h1>
          <p>{error || "We couldn't find this booking."}</p>
          <Link to="/events" className="confirmation-primary-button">
            Browse Events
          </Link>
        </div>
      </main>
    );
  }

  const items = Array.isArray(booking.items) ? booking.items : [];

  return (
    <main className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-success-icon">
          <svg
            viewBox="0 0 52 52"
            role="img"
            aria-label="Success"
          >
            <circle cx="26" cy="26" r="24" />
            <path d="M15 27l7 7 15-16" />
          </svg>
        </div>

        <p className="confirmation-eyebrow">EVENTEASE · YOUR NEXT EXPERIENCE</p>

        <h1>
          {booking.status?.toLowerCase() === "cancelled"
            ? "Booking Cancelled"
            : "Booking Confirmed!"}
        </h1>

        <p className="confirmation-subtitle">
          {booking.status?.toLowerCase() === "cancelled"
            ? "This booking has been cancelled."
            : "Your booking has been saved successfully. Get ready for a great experience!"}
        </p>

        <div className="confirmation-status">
          <span className="status-dot" />
          {booking.status || "Confirmed"}
        </div>

        <div className="confirmation-booking-id">
          <div>
            <span className="detail-label">BOOKING REFERENCE</span>
            <strong>#{booking.booking_id}</strong>
          </div>

          <div className="ticket-symbol" aria-hidden="true">
            🎟️
          </div>
        </div>

        <div className="confirmation-divider" />

        <section className="confirmation-details">
          <div className="confirmation-section-heading">
            <span className="section-icon">🎉</span>
            <div>
              <h2>Your ticket details</h2>
              <p>Keep these details for your reference.</p>
            </div>
          </div>

          {items.length > 0 ? (
            items.map((item, index) => (
              <article
                className="confirmation-ticket"
                key={`${item.event}-${item.ticket_type}-${index}`}
              >
                <div className="ticket-top">
                  <div>
                    <span className="detail-label">EVENT</span>
                    <h3>{item.event || "Event"}</h3>
                  </div>

                  <span className="ticket-badge">
                    {booking.status?.toLowerCase() === "cancelled"
                      ? "Cancelled"
                      : "E-TICKET"}
                  </span>
                </div>

                <div className="ticket-info-grid">
                  <div className="ticket-info-item">
                    <span className="detail-label">DATE & TIME</span>
                    <strong>{formatDate(item.event_date)}</strong>
                  </div>

                  <div className="ticket-info-item">
                    <span className="detail-label">TICKET TYPE</span>
                    <strong>{item.ticket_type || "General"}</strong>
                  </div>

                  <div className="ticket-info-item">
                    <span className="detail-label">QUANTITY</span>
                    <strong>{item.quantity}</strong>
                  </div>

                  <div className="ticket-info-item">
                    <span className="detail-label">PRICE PER TICKET</span>
                    <strong>
                      ₹{Number(item.unit_price || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                <div className="ticket-subtotal">
                  <span>Ticket subtotal</span>
                  <strong>
                    ₹
                    {(
                      Number(item.unit_price || 0) *
                      Number(item.quantity || 0)
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </article>
            ))
          ) : (
            <p className="confirmation-empty">
              No ticket items were found for this booking.
            </p>
          )}
        </section>

        <div className="confirmation-total">
          <div>
            <span>Total booking amount</span>
            <p>Booking #{booking.booking_id}</p>
          </div>

          <strong>
            ₹{Number(booking.total_amount || 0).toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="confirmation-actions">
          <Link to="/my-bookings" className="confirmation-primary-button">
            View My Bookings →
          </Link>

          <Link to="/events" className="confirmation-secondary-button">
            Explore More Events
          </Link>
        </div>

        <p className="confirmation-footer-note">
          Thank you for choosing EventEase. We hope you have a wonderful time!
        </p>
      </div>
    </main>
  );
}
