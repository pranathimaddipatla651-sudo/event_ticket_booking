
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("eventEaseUser") || "null");
  } catch {
    return null;
  }
}

function MyBookingsPage() {
  const navigate = useNavigate();
  const [user] = useState(readUser);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate(
        `/login?redirect=${encodeURIComponent("/my-bookings")}`,
        { replace: true }
      );
      return;
    }

    try {
      const saved = JSON.parse(
        localStorage.getItem("eventEaseBookings") || "[]"
      );

      const userKey = String(user.user_id ?? user.id ?? user.email ?? "");

      setBookings(
        saved.filter((booking) => {
          // Older browser-only bookings may not have an owner field.
          if (booking.userKey == null) return true;
          return String(booking.userKey) === userKey;
        })
      );
    } catch {
      setBookings([]);
    }
  }, [navigate, user]);

  function cancelBooking(id) {
    const updated = bookings.map((booking) =>
      String(booking.id) === String(id)
        ? { ...booking, status: "Cancelled" }
        : booking
    );

    setBookings(updated);

    // Preserve other saved records in the browser.
    const allBookings = JSON.parse(
      localStorage.getItem("eventEaseBookings") || "[]"
    );

    const updatedAll = allBookings.map((booking) =>
      String(booking.id) === String(id)
        ? { ...booking, status: "Cancelled" }
        : booking
    );

    localStorage.setItem("eventEaseBookings", JSON.stringify(updatedAll));
  }

  if (!user) return null;

  return (
    <div className="booking-container">
      <div className="booking-card">
        <h1>My Bookings</h1>
        <p>View and manage your event tickets.</p>

        {bookings.length === 0 ? (
          <div>
            <p>You have no bookings saved here yet.</p>
            <Link to="/events" className="booking-button">
              Explore Events
            </Link>
          </div>
        ) : (
          bookings.map((booking) => (
            <div className="booking-event" key={booking.id}>
              <h2>{booking.eventName}</h2>

              <p><strong>Booking ID:</strong> {booking.id}</p>
              <p><strong>Date:</strong> {booking.date}</p>
              <p><strong>Venue:</strong> {booking.venue}</p>
              <p><strong>Ticket type:</strong> {booking.ticketType || "Standard"}</p>
              <p><strong>Tickets:</strong> {booking.quantity}</p>
              <p>
                <strong>Total:</strong>{" "}
                ₹{Number(booking.total || 0).toLocaleString("en-IN")}
              </p>
              <p>
                <strong>Status:</strong> {booking.status || "Pending"}
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {booking.status !== "Cancelled" && (
                  <Link
                    to={`/ticket/${booking.id}`}
                    className="booking-button"
                    style={{ width: "auto", textDecoration: "none" }}
                  >
                    View Ticket
                  </Link>
                )}

                {booking.status !== "Cancelled" && (
                  <button
                    type="button"
                    className="booking-button"
                    style={{ background: "#c0392b", width: "auto" }}
                    onClick={() => cancelBooking(booking.id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyBookingsPage;
