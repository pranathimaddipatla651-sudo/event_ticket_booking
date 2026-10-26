
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function formatDate(value) {
  if (!value) return "Date to be announced";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [ticketTypeId, setTicketTypeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("eventEaseUser") || "null");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!user) {
      const intendedPage = `/booking?eventId=${encodeURIComponent(eventId || "")}`;
      navigate(
        `/login?redirect=${encodeURIComponent(intendedPage)}`,
        { replace: true }
      );
    }
  }, [navigate, eventId, user]);

  useEffect(() => {
    if (!user || !eventId) {
      setLoading(false);
      if (!eventId) setError("No event was selected. Please choose an event first.");
      return;
    }

    const controller = new AbortController();

    async function loadEvent() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/events`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Could not load events from the server.");
        }

        const data = await response.json();
        const selectedEvent = data.find(
          (item) => String(item.event_id) === String(eventId)
        );

        if (!selectedEvent) {
          throw new Error("This event was not found or is no longer available.");
        }

        setEvent(selectedEvent);

        const tickets = Array.isArray(selectedEvent.tickets)
          ? selectedEvent.tickets
          : [];

        const firstAvailable = tickets.find(
          (ticket) => Number(ticket.available_quantity) > 0
        );

        setTicketTypeId(
          firstAvailable ? String(firstAvailable.ticket_type_id) : ""
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load this event.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadEvent();
    return () => controller.abort();
  }, [eventId, user]);

  const tickets = Array.isArray(event?.tickets) ? event.tickets : [];
  const selectedTicket = tickets.find(
    (ticket) => String(ticket.ticket_type_id) === ticketTypeId
  );
  const price = selectedTicket ? Number(selectedTicket.price) : 0;
  const available = selectedTicket
    ? Number(selectedTicket.available_quantity)
    : 0;
  const total = price * quantity;

  function handleBooking() {
    if (!user) {
      navigate(
        `/login?redirect=${encodeURIComponent(
          `/booking?eventId=${eventId}`
        )}`
      );
      return;
    }

    if (!selectedTicket || available < quantity) {
      setError("Please select a ticket type with enough tickets available.");
      return;
    }

    /*
      This only prepares a local preview. It does not create a database
      booking. The backend booking endpoint must be connected before
      confirming a real reservation or taking payment.
    */
    const draft = {
      eventId: event.event_id,
      eventName: event.title,
      eventDate: event.event_date,
      venue: event.venue,
      city: event.city,
      ticketTypeId: selectedTicket.ticket_type_id,
      ticketType: selectedTicket.name,
      quantity,
      total,
    };

    sessionStorage.setItem("eventEaseBookingDraft", JSON.stringify(draft));
    navigate("/booking-review");
  }

  if (!user) return null;

  if (loading) {
    return <div className="booking-container"><p>Loading event...</p></div>;
  }

  if (error || !event) {
    return (
      <div className="booking-container">
        <div className="booking-card">
          <h1>Unable to book this event</h1>
          <p>{error || "Event not found."}</p>
          <Link to="/events">Back to events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="booking-card">
        <h1>Book Your Tickets</h1>
        <p>Review your event and select your ticket type.</p>

        <div className="booking-event">
          <h2>{event.title}</h2>
          <p>📅 {formatDate(event.event_date)}</p>
          <p>📍 {event.venue}{event.city ? `, ${event.city}` : ""}</p>
        </div>

        {tickets.length === 0 ? (
          <p>No ticket types are currently listed for this event.</p>
        ) : (
          <>
            <label htmlFor="ticketType">Ticket type</label>
            <select
              id="ticketType"
              value={ticketTypeId}
              onChange={(e) => {
                setTicketTypeId(e.target.value);
                setError("");
              }}
              required
            >
              {tickets.map((ticket) => (
                <option
                  key={ticket.ticket_type_id}
                  value={String(ticket.ticket_type_id)}
                  disabled={Number(ticket.available_quantity) < 1}
                >
                  {ticket.name} — ₹{Number(ticket.price).toLocaleString("en-IN")}
                  {" "}
                  ({ticket.available_quantity} left)
                </option>
              ))}
            </select>

            <label htmlFor="quantity">Number of tickets</label>
            <select
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              {Array.from(
                { length: Math.min(10, Math.max(0, available)) },
                (_, index) => index + 1
              ).map((number) => (
                <option key={number} value={number}>{number}</option>
              ))}
            </select>

            <div className="booking-total">
              <span>Total amount</span>
              <strong>₹{total.toLocaleString("en-IN")}</strong>
            </div>

            {error && <p style={{ color: "#c62828" }}>{error}</p>}

            <button
              className="booking-button"
              type="button"
              onClick={handleBooking}
              disabled={!selectedTicket || available < 1}
            >
              Continue
            </button>
          </>
        )}

        <p>
          <Link to={`/events/${event.event_id}`}>Back to event details</Link>
        </p>
      </div>
    </div>
  );
}

export default BookingPage;
