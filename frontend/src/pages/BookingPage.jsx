
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const events = [
  {
    id: "1",
    name: "Tech Conference 2026",
    date: "November 15, 2026",
    venue: "Hyderabad",
    price: 999,
  },
  {
    id: "2",
    name: "Music Festival",
    date: "November 20, 2026",
    venue: "Bengaluru",
    price: 1499,
  },
  {
    id: "3",
    name: "AI Workshop",
    date: "November 25, 2026",
    venue: "Chennai",
    price: 799,
  },
];

function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const eventId = searchParams.get("eventId") || "1";

  const event = events.find(
    (item) => item.id === eventId
  ) || events[0];

  const [quantity, setQuantity] = useState(1);

  const total = event.price * quantity;

  function handleBooking() {
    const booking = {
      id: Date.now().toString(),
      eventId: event.id,
      eventName: event.name,
      date: event.date,
      venue: event.venue,
      quantity,
      total,
      status: "Confirmed",
    };

    const existingBookings = JSON.parse(
      localStorage.getItem("eventEaseBookings") || "[]"
    );

    existingBookings.push(booking);

    localStorage.setItem(
      "eventEaseBookings",
      JSON.stringify(existingBookings)
    );

    navigate(`/confirmation/${booking.id}`);
  }

  return (
    <div className="booking-container">
      <div className="booking-card">
        <h1>Book Your Tickets</h1>
        <p>Review your event and select your tickets.</p>

        <div className="booking-event">
          <h2>{event.name}</h2>
          <p>📅 {event.date}</p>
          <p>📍 {event.venue}</p>
          <p>Price per ticket: ₹{event.price}</p>
        </div>

        <label htmlFor="quantity">
          Number of tickets
        </label>

        <select
          id="quantity"
          value={quantity}
          onChange={(e) =>
            setQuantity(Number(e.target.value))
          }
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
            (number) => (
              <option key={number} value={number}>
                {number}
              </option>
            )
          )}
        </select>

        <div className="booking-total">
          <span>Total amount</span>
          <strong>₹{total.toLocaleString("en-IN")}</strong>
        </div>

        <button
          className="booking-button"
          onClick={handleBooking}
        >
          Confirm Booking
        </button>
      </div>
    </div>
  );
}

export default BookingPage;
