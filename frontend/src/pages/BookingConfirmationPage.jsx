
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not find this booking."
          );
        }

        setBooking(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message === "Failed to fetch"
              ? "Cannot connect to the backend. Check that your server is running."
              : err.message
          );
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
      setError("Booking ID is missing.");
      setLoading(false);
    }

    return () => controller.abort();
  }, [bookingId]);

  if (loading) {
    return (
      <section className="section">
        <div className="booking-card">
          <h1>Loading confirmation...</h1>
        </div>
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="section">
        <div className="booking-card">
          <h1>Unable to load booking</h1>
          <p>{error || "Booking not found."}</p>
          <Link to="/my-bookings">My Bookings</Link>
          {" · "}
          <Link to="/events">Explore Events</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="booking-card">
        <p className="eyebrow">EVENTEASE</p>

        <h1>Booking Confirmed!</h1>
        <p>Your booking details have been retrieved from the database.</p>

        <h2>Booking ID: #{booking.booking_id}</h2>

        <p>
          <strong>Status:</strong> {booking.status}
        </p>

        <p>
          <strong>Total paid/amount:</strong>{" "}
          ₹{Number(booking.total_amount).toLocaleString("en-IN")}
        </p>

        <hr />

        <h2>Ticket details</h2>

        {booking.items?.map((item, index) => (
          <div key={index}>
            <h3>{item.event}</h3>
            <p>Date: {item.event_date || "To be announced"}</p>
            <p>Ticket type: {item.ticket_type}</p>
            <p>Quantity: {item.quantity}</p>
            <p>
              Price per ticket: ₹
              {Number(item.unit_price).toLocaleString("en-IN")}
            </p>
          </div>
        ))}

        <p>
          <Link to="/my-bookings" className="btn btn-primary">
            View My Bookings
          </Link>
        </p>

        <Link to="/events">Explore more events</Link>
      </div>
    </section>
  );
}
