import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000";

function OrganizerDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const storedUser = JSON.parse(
          localStorage.getItem("eventEaseUser") || "null"
        );

        if (
          !storedUser ||
          String(storedUser.role).toLowerCase() !== "organizer"
        ) {
          navigate("/login", { replace: true });
          return;
        }

        if (active) setUser(storedUser);

        // Support different key names for the user's ID.
        const organizerId =
          storedUser.user_id ?? storedUser.id ?? storedUser.userId;

        if (!organizerId) {
          throw new Error(
            "Organizer ID not found in the saved login. Please log in again."
          );
        }

        // Backend route: GET /organizer/events?organizer_id=<id>
        const response = await fetch(
          `${API}/organizer/events?organizer_id=${organizerId}`
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Organizer events API was not found. Check that the organizer router is registered in the backend."
              : "Could not load your events."
          );
        }

        const data = await response.json();

        if (active) {
          setEvents(Array.isArray(data) ? data : data.events || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.message === "Failed to fetch"
              ? "Cannot connect to FastAPI. Please start the backend."
              : err.message || "Something went wrong."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [navigate]);

  const publishedEvents = events.filter(
    (event) => String(event.status).toLowerCase() === "published"
  );

  const upcomingEvents = events.filter(
    (event) =>
      event.event_date &&
      new Date(event.event_date) >= new Date() &&
      String(event.status).toLowerCase() !== "cancelled"
  );

  if (loading) {
    return <div className="organizer-page">Loading dashboard...</div>;
  }

  return (
    <main className="organizer-page">
      <header className="organizer-header">
        <div>
          <p className="organizer-eyebrow">EVENTEASE • ORGANIZER PORTAL</p>
          <h1>Welcome, {user?.name || "Organizer"}!</h1>
          <p>Manage your events and keep track of what is happening.</p>
        </div>

        <Link to="/manage-events" className="organizer-primary-button">
          + Manage Events
        </Link>
      </header>

      {error && <div className="organizer-error">{error}</div>}

      <section className="organizer-stats">
        <article className="organizer-stat-card">
          <span>Total Events</span>
          <strong>{events.length}</strong>
          <small>Events in your account</small>
        </article>

        <article className="organizer-stat-card">
          <span>Published Events</span>
          <strong>{publishedEvents.length}</strong>
          <small>Visible to customers</small>
        </article>

        <article className="organizer-stat-card">
          <span>Upcoming Events</span>
          <strong>{upcomingEvents.length}</strong>
          <small>Scheduled for the future</small>
        </article>
      </section>

      <section className="organizer-section">
        <div className="organizer-section-heading">
          <div>
            <h2>Your Events</h2>
            <p>Review the events you organize.</p>
          </div>

          <Link to="/manage-events">Manage all →</Link>
        </div>

        {events.length === 0 ? (
          <div className="organizer-empty">
            <h3>No events to display</h3>
            <p>
              You have not created any events yet. Create one to see it here.
            </p>
            <Link to="/manage-events" className="organizer-primary-button">
              Go to Manage Events
            </Link>
          </div>
        ) : (
          <div className="organizer-table-wrap">
            <table className="organizer-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Venue</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.event_id}>
                    <td>{event.title}</td>
                    <td>
                      {event.venue_name
                        ? `${event.venue_name}${
                            event.city ? `, ${event.city}` : ""
                          }`
                        : "—"}
                    </td>
                    <td>
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString()
                        : "Not scheduled"}
                    </td>
                    <td>
                      <span className="organizer-status">
                        {event.status || "Draft"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="organizer-quick-actions">
        <Link to="/manage-events">
          <span>📅</span>
          <strong>Manage Events</strong>
          <small>Create, edit, and update your events.</small>
        </Link>

        <Link to="/manage-events">
          <span>🎟️</span>
          <strong>Manage Tickets</strong>
          <small>Configure ticket types, prices, and quantities.</small>
        </Link>

        <Link to="/manage-events">
          <span>📊</span>
          <strong>Track Bookings</strong>
          <small>Review bookings for your events.</small>
        </Link>
      </section>
    </main>
  );
}

export default OrganizerDashboardPage;
