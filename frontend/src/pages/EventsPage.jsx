
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(price);
}

function formatDate(dateValue) {
  if (!dateValue) return "Date to be announced";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCategoryIcon(category) {
  const name = String(category || "").toLowerCase();

  if (name.includes("music")) return "🎵";
  if (name.includes("tech")) return "💻";
  if (name.includes("comedy")) return "😂";
  if (name.includes("art")) return "🎨";
  if (name.includes("startup") || name.includes("business")) return "🚀";
  if (name.includes("workshop")) return "🛠️";
  if (name.includes("sport")) return "🏆";
  if (name.includes("culture")) return "🎭";

  return "🎟️";
}

function getEventDateValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/events`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Could not load events. Server returned ${response.status}.`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "The events API did not return a list. Check your backend endpoint."
          );
        }

        const formattedEvents = data.map((event) => {
          const tickets = Array.isArray(event.tickets)
            ? event.tickets
            : [];

          // Get the lowest actual ticket price from the database.
          const prices = tickets
            .map((ticket) => Number(ticket.price))
            .filter(
              (price) => Number.isFinite(price) && price >= 0
            );

          return {
            ...event,
            id: event.event_id,
            name: event.title || "Untitled event",
            category: event.category || "Other",
            date: event.event_date,
            venue: event.venue || "Venue not available",
            city: event.city || "",
            description:
              event.description || "Join us for this exciting event.",
            venueAddress: event.venue_address || "",
            tickets,
            price: prices.length > 0 ? Math.min(...prices) : null,
          };
        });

        setEvents(formattedEvents);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error loading events:", err);
          setError(
            err.message ||
              "Unable to load events. Please check your backend."
          );
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

  // Build category options from the actual database response.
  const categories = useMemo(() => {
    const names = [
      ...new Set(
        events
          .map((event) => event.category)
          .filter(Boolean)
      ),
    ];

    return ["All", ...names.sort((a, b) => a.localeCompare(b))];
  }, [events]);

  // Apply search, category, and date filters.
  const filteredEvents = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !searchText ||
        [
          event.name,
          event.description,
          event.category,
          event.venue,
          event.city,
        ].some((value) =>
          String(value || "").toLowerCase().includes(searchText)
        );

      const matchesCategory =
        selectedCategory === "All" ||
        event.category === selectedCategory;

      const matchesDate =
        !selectedDate ||
        getEventDateValue(event.date) === selectedDate;

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [events, search, selectedCategory, selectedDate]);

  return (
    <main className="events-page">
      <section className="events-hero">
        <div className="events-hero-content">
          <span className="events-eyebrow">YOUR NEXT EXPERIENCE</span>

          <h1>Discover Events</h1>

          <p>
            Find exciting events, explore new experiences, and book
            your tickets with EventEase.
          </p>

          <div className="events-search">
            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, categories, venues or cities..."
              aria-label="Search events"
            />
          </div>
        </div>
      </section>

      <section className="events-content">
        <div className="events-section-heading">
          <div>
            <h2>Upcoming Events</h2>
            <p>Explore events and choose the experience you love.</p>
          </div>

          {!loading && (
            <span className="events-count">
              {filteredEvents.length}{" "}
              {filteredEvents.length === 1 ? "event" : "events"}
            </span>
          )}
        </div>

        <div className="events-filters">
          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? "category-filter active"
                    : "category-filter"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="date-filter">
            <label htmlFor="event-date">Choose date</label>

            <input
              id="event-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            {selectedDate && (
              <button
                type="button"
                className="clear-date"
                onClick={() => setSelectedDate("")}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="events-message">
            <span className="events-spinner" />
            <p>Loading events and ticket prices...</p>
          </div>
        )}

        {!loading && error && (
          <div className="events-message events-error">
            <h3>Unable to load events</h3>
            <p>{error}</p>
            <p>
              Make sure your FastAPI backend and MySQL database are
              running, then refresh this page.
            </p>
            <button
              type="button"
              className="events-retry"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <div className="events-message">
            <div className="events-empty-icon">🎟️</div>
            <h3>No events found</h3>
            <p>
              Try another search, category, or date.
            </p>
            <button
              type="button"
              className="events-retry"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
                setSelectedDate("");
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filteredEvents.length > 0 && (
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <article className="event-card" key={event.id}>
                <div className="event-card-art">
                  <span className="event-card-icon">
                    {getCategoryIcon(event.category)}
                  </span>

                  <span className="event-category-badge">
                    {event.category}
                  </span>

                  <div className="event-card-date">
                    <span>{formatDate(event.date)}</span>
                  </div>
                </div>

                <div className="event-card-body">
                  <h3>{event.name}</h3>

                  <p className="event-description">
                    {event.description}
                  </p>

                  <div className="event-meta">
                    <span aria-hidden="true">📍</span>
                    <span>
                      {event.venue}
                      {event.city ? `, ${event.city}` : ""}
                    </span>
                  </div>

                  {event.venueAddress && (
                    <div className="event-address">
                      {event.venueAddress}
                    </div>
                  )}

                  <div className="event-card-footer">
                    <div className="event-price">
                      <span className="event-price-label">
                        Ticket price
                      </span>

                      <strong>
                        {event.price !== null
                          ? `From ₹${formatPrice(event.price)}`
                          : "Price unavailable"}
                      </strong>
                    </div>

                    <Link
                      to={`/events/${event.id}`}
                      className="event-details-button"
                    >
                      View details <span aria-hidden="true">→</span>
                    </Link>
                  </div>

                  {event.tickets.length > 0 && (
                    <p className="event-ticket-count">
                      {event.tickets.length} ticket{" "}
                      {event.tickets.length === 1 ? "type" : "types"}{" "}
                      available in the database
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
