
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelingId, setCancelingId] = useState(null);

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("eventEaseUser") || "null");
  } catch {
    user = null;
  }

  async function loadBookings(signal) {
    if (!user?.user_id) {
      setError("Please log in to view your bookings.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/users/${user.user_id}/bookings`,
        { signal }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load bookings.");
      }

      setBookings(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(
          err.message === "Failed to fetch"
            ? "Cannot connect to the backend. Check that it is running."
            : err.message
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadBookings(controller.signal);
    return () => controller.abort();
  }, []);

  async function handleCancel(bookingId) {
    if (!user?.user_id) return;

    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setCancelingId(bookingId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/cancel?user_id=${user.user_id}`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to cancel booking.");
      }

      await loadBookings();
    } catch (err) {
      setError(err.message || "Unable to cancel booking.");
    } finally {
      setCancelingId(null);
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="booking-card">
          <h1>My Bookings</h1>
          <p>Loading your bookings...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="booking-card">
        <h1>My Bookings</h1>
        <p>View and manage your event tickets.</p>

        {error && (
          <p role="alert" style={{ color: "#c62828" }}>
            {error}
          </p>
        )}

        {!user?.user_id ? (
          <Link to="/login">Log in</Link>
        ) : bookings.length === 0 ? (
          <>
            <p>You have no bookings saved here yet.</p>
            <Link to="/events" className="btn btn-primary">
              Explore Events
            </Link>
          </>
        ) : (
          <div className="my-bookings-list">
            {bookings.map((booking) => (
              <article
                key={`${booking.booking_id}-${booking.ticket_type}`}
                className="booking-item"
              >
                <h2>{booking.event}</h2>

                <p>
                  <strong>Booking ID:</strong> #{booking.booking_id}
                </p>

                <p>
                  <strong>Ticket:</strong> {booking.ticket_type}
                </p>

                <p>
                  <strong>Quantity:</strong> {booking.quantity}
                </p>

                <p>
                  <strong>Price per ticket:</strong>{" "}
                  ₹{Number(booking.unit_price).toLocaleString("en-IN")}
                </p>

                <p>
                  <strong>Booking total:</strong>{" "}
                  ₹{Number(booking.total_amount).toLocaleString("en-IN")}
                </p>

                <p>
                  <strong>Status:</strong> {booking.status}
                </p>

                <Link to={`/booking-confirmation/${booking.booking_id}`}>
                  View booking
                </Link>

                {booking.status !== "cancelled" && (
                  <div>
                    <button
                      type="button"
                      onClick={() => handleCancel(booking.booking_id)}
                      disabled={cancelingId === booking.booking_id}
                    >
                      {cancelingId === booking.booking_id
                        ? "Cancelling..."
                        : "Cancel booking"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
  <div className="my-bookings-container">
  <div className="my-bookings-header">
    <h1>My Bookings</h1>
    <p>View and manage your event tickets.</p>
  </div>

  <div className="booking-list">
    {/* Keep your existing booking map here */}
    <div className="booking-item">
      {/* Keep your existing event and booking details here */}
    </div>
  </div>
</div>
}
