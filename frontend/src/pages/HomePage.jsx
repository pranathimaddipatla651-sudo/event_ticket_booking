
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(price);
}

function getEventStyle(category) {
  const name = String(category || "").toLowerCase();

  if (name.includes("music")) return "music";
  if (name.includes("tech")) return "technology";
  if (name.includes("art") || name.includes("culture")) return "art";

  return "other";
}

function getEventEmoji(category) {
  const name = String(category || "").toLowerCase();

  if (name.includes("music")) return "🎸";
  if (name.includes("tech")) return "💻";
  if (name.includes("comedy")) return "😂";
  if (name.includes("art") || name.includes("culture")) return "🎨";
  if (name.includes("startup") || name.includes("business")) return "🚀";
  if (name.includes("workshop")) return "🛠️";
  if (name.includes("sport")) return "🏆";

  return "🎟️";
}

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/events`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load events from the server.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The server returned an invalid events list.");
        }

        const formattedEvents = data.map((event) => {
          const tickets = Array.isArray(event.tickets)
            ? event.tickets
            : [];

          const prices = tickets
            .map((ticket) => Number(ticket.price))
            .filter(
              (price) => Number.isFinite(price) && price >= 0
            );

          return {
            id: event.event_id,
            name: event.title || "Untitled event",
            category: event.category || "Other",
            description:
              event.description || "Discover this exciting event.",
            date: event.event_date,
            venue: event.venue || "Venue to be announced",
            city: event.city || "",
            price: prices.length ? Math.min(...prices) : null,
          };
        });

        setEvents(formattedEvents);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error loading home page events:", err);
          setError(err.message || "Unable to load events.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => controller.abort();
  }, []);

  return (
    <div className="home-page">
      <section className="hero">
        <p className="eyebrow">YOUR NEXT EXPERIENCE STARTS HERE</p>

        <h1>
          Moments worth
          <br />
          showing up for<span>.</span>
        </h1>

        <p>
          Discover exciting events, find your people,
          and make memories that last.
        </p>

        <Link to="/events" className="btn">
          Explore Events →
        </Link>
      </section>

      <section className="section">
        <p className="eyebrow">DISCOVER SOMETHING NEW</p>

        <h2>Find your next favourite event.</h2>

        {loading && (
          <p className="home-events-message">
            Loading events and ticket prices...
          </p>
        )}

        {!loading && error && (
          <div className="home-events-message">
            <p>{error}</p>
            <button
              type="button"
              className="btn"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="home-events-message">
            <p>No upcoming published events are available right now.</p>
            <Link to="/events" className="btn">
              Explore Events →
            </Link>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="event-grid">
            {events.map((event) => (
              <article className="event-card" key={event.id}>
                <div
                  className={`event-image ${getEventStyle(
                    event.category
                  )}`}
                >
                  {getEventEmoji(event.category)}
                </div>

                <div className="home-event-info">
                  <p className="home-event-category">
                    {event.category}
                  </p>

                  <h3>{event.name}</h3>

                  <p className="home-event-description">
                    {event.description}
                  </p>

                  <p className="home-event-location">
                    📍 {event.venue}
                    {event.city ? `, ${event.city}` : ""}
                  </p>

                  <p className="home-event-price">
                    {event.price !== null
                      ? `From ₹${formatPrice(event.price)}`
                      : "Price unavailable"}
                  </p>

                  <Link
                    to={`/events/${event.id}`}
                    className="home-event-link"
                  >
                    View event →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="home-view-all">
          <Link to="/events" className="btn">
            View all events →
          </Link>
        </div>
      </section>
    </div>
  );
}
