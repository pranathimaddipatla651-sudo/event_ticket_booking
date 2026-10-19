
import { Link, useParams } from "react-router-dom";

function TicketDetailsPage() {
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
          <h1>Ticket Not Found</h1>
          <p>
            We could not find this booking.
            Please check your booking details.
          </p>

          <Link to="/my-bookings">
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = booking.status === "Cancelled";

  return (
    <div className="booking-container">
      <div className="booking-card">
        <h1>
          {isCancelled
            ? "Cancelled Ticket"
            : "🎟️ Your EventEase Ticket"}
        </h1>

        {isCancelled ? (
          <p style={{ color: "red", fontWeight: "bold" }}>
            This ticket has been cancelled and is no longer valid.
          </p>
        ) : (
          <p>Your booking is confirmed. Keep these details for reference.</p>
        )}

        <hr />

        <h2>{booking.eventName}</h2>

        <p>
          <strong>Booking ID:</strong> {booking.id}
        </p>

        <p>
          <strong>Date:</strong> {booking.date}
        </p>

        <p>
          <strong>Venue:</strong> {booking.venue}
        </p>

        <p>
          <strong>Number of tickets:</strong> {booking.quantity}
        </p>

        <p>
          <strong>Total amount:</strong> ₹
          {Number(booking.total).toLocaleString("en-IN")}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          <span
            style={{
              color: isCancelled ? "red" : "green",
              fontWeight: "bold",
            }}
          >
            {booking.status || "Confirmed"}
          </span>
        </p>

        {!isCancelled && (
          <button
            className="booking-button"
            onClick={() => window.print()}
          >
            Print Ticket
          </button>
        )}

        <Link
          to="/my-bookings"
          style={{
            display: "block",
            marginTop: "20px",
          }}
        >
          Back to My Bookings
        </Link>

        <Link
          to="/events"
          style={{
            display: "block",
            marginTop: "12px",
          }}
        >
          Explore More Events
        </Link>
      </div>
    </div>
  );
}

export default TicketDetailsPage;
