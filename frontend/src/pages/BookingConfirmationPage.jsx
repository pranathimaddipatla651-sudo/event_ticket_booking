
import { Link, useParams } from "react-router-dom";

function BookingConfirmationPage() {
  const { id } = useParams();

  const bookings = JSON.parse(
    localStorage.getItem("eventEaseBookings") || "[]"
  );

  const booking = bookings.find(
    (item) => item.id === id
  );

  if (!booking) {
    return (
      <div className="booking-container">
        <div className="booking-card">
          <h1>Booking Not Found</h1>
          <p>Please make a booking first.</p>
          <Link to="/events">Browse Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="booking-card">
        <h1>🎉 Booking Confirmed!</h1>
        <p>Your demo booking has been saved successfully.</p>

        <hr />

        <h2>{booking.eventName}</h2>
        <p><strong>Booking ID:</strong> {booking.id}</p>
        <p><strong>Date:</strong> {booking.date}</p>
        <p><strong>Venue:</strong> {booking.venue}</p>
        <p><strong>Tickets:</strong> {booking.quantity}</p>
        <p>
          <strong>Total Paid:</strong> ₹
          {booking.total.toLocaleString("en-IN")}
        </p>

        <Link
          to="/my-bookings"
          className="booking-button"
          style={{
            display: "block",
            textAlign: "center",
            textDecoration: "none",
            boxSizing: "border-box",
            marginTop: "20px",
          }}
        >
          View My Bookings
        </Link>

        <p>
          <Link to="/events">Explore More Events</Link>
        </p>
      </div>
    </div>
  );
}

export default BookingConfirmationPage;
