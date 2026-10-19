
import { Link } from "react-router-dom";
import { useState } from "react";

function MyBookingsPage() {
  const [bookings, setBookings] = useState(() =>
    JSON.parse(
      localStorage.getItem("eventEaseBookings") || "[]"
    )
  );

  function cancelBooking(id) {
    const updatedBookings = bookings.map((booking) =>
      booking.id === id
        ? { ...booking, status: "Cancelled" }
        : booking
    );

    setBookings(updatedBookings);

    localStorage.setItem(
      "eventEaseBookings",
      JSON.stringify(updatedBookings)
    );
  }

  return (
    <div className="booking-container">
      <div className="booking-card">
        <h1>My Bookings</h1>
        <p>View and manage your event tickets.</p>

        {bookings.length === 0 ? (
          <div>
            <p>You have no bookings yet.</p>
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
              <p><strong>Tickets:</strong> {booking.quantity}</p>
              <p>
                <strong>Total:</strong> ₹
                {booking.total.toLocaleString("en-IN")}
              </p>
              <p>
                <strong>Status:</strong> {booking.status || "Confirmed"}
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Link
                  to={`/ticket/${booking.id}`}
                  className="booking-button"
                  style={{
                    display: "inline-block",
                    width: "auto",
                    textDecoration: "none",
                  }}
                >
                  View Ticket
                </Link>

                {booking.status !== "Cancelled" && (
                  <button
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
