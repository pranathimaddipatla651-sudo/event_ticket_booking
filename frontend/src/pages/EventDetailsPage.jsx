
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function formatDate(value) {
  if (!value) return "Date to be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EventDetailsPage() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvent() {
      try {
        setLoading(true);
        setError("");
        setEvent(null);
        setQuantity(1);

        const response = await fetch(`${API_URL}/events`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Could not load events.");
        }

        const data = await response.json();

        const selectedEvent = data.find(
          (item) => String(item.event_id) === String(id)
        );

        if (!selectedEvent) {
          throw new Error("Event not found.");
        }

        setEvent(selectedEvent);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load event details.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEvent();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <section className="section">
        <p>Loading event details...</p>
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="section">
        <h1>Unable to load event</h1>
        <p>{error || "Event not found."}</p>
        <Link to="/events" className="text-link">
          ← Back to events
        </Link>
      </section>
    );
  }

  const tickets = Array.isArray(event.tickets) ? event.tickets : [];

  const availableTickets = tickets.filter(
    (ticket) => Number(ticket.available_quantity) > 0
  );

  const price =
    tickets.length > 0
      ? Math.min(...tickets.map((ticket) => Number(ticket.price)))
      : 0;

  const total = price * quantity;

  return (
    <section className="section details-layout">
      <div className="details-main">
        <Link to="/events" className="text-link">
          ← Back to events
        </Link>

        <div className="details-banner technology">
          <span>🎟️</span>
        </div>

        <p className="eyebrow">
          {(event.category || "EVENT").toUpperCase()}
        </p>

        <h1 className="page-title">{event.title}</h1>

        <p className="muted">
          {event.description || "Join us for this exciting event."}
        </p>

        <div className="details-information">
          <div>
            <span>📅</span>
            <div>
              <strong>Date</strong>
              <p>{formatDate(event.event_date)}</p>
            </div>
          </div>

          <div>
            <span>📍</span>
            <div>
              <strong>Venue</strong>
              <p>
                {event.venue || "Venue to be announced"}
                {event.city ? `, ${event.city}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <aside className="booking-panel">
        <p className="eyebrow">RESERVE YOUR SPOT</p>
        <h2>Book tickets</h2>

        <p className="muted">Price per ticket, starting from</p>
        <h2>
          {tickets.length > 0
            ? `₹${price.toLocaleString("en-IN")}`
            : "Price unavailable"}
        </h2>

        {availableTickets.length > 0 ? (
          <>
            <label htmlFor="quantity">Number of tickets</label>

            <div className="quantity-control">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease tickets"
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(10, availableTickets.reduce(
                      (sum, ticket) =>
                        sum + Number(ticket.available_quantity),
                      0
                    ), q + 1)
                  )
                }
                aria-label="Increase tickets"
              >
                +
              </button>
            </div>

            <div className="price-row">
              <span>
                ₹{price.toLocaleString("en-IN")} × {quantity}
              </span>
              <strong>₹{total.toLocaleString("en-IN")}</strong>
            </div>

            <Link
              to={`/booking?eventId=${event.event_id}`}
              className="btn btn-primary booking-button"
            >
              Continue to book →
            </Link>

            <p className="booking-note">
              Select your ticket type on the next page.
            </p>
          </>
        ) : (
          <p>No tickets are currently available for this event.</p>
        )}
      </aside>
    </section>
  );
}
