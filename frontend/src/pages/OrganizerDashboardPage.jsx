
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

       
const response = await fetch(
  `${API}/organizer/events?organizer_id=${storedUser.user_id}`
);


        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "The organizer events API is not available yet. Your backend route needs to be added."
              : `Unable to load events (HTTP ${response.status}).`
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
              ? "Cannot connect to the backend. Make sure FastAPI is running."
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

  const upcomingEvents = events.filter((event) => {
    if (!event.event_date) return false;

    const date = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      !Number.isNaN(date.getTime()) &&
      date >= today &&
      !["cancelled", "completed"].includes(
        String(event.status).toLowerCase()
      )
    );
  });

  const formatDate = (value) => {
    if (!value) return "Date not set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Date not set";

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="organizer-page">
        <div className="organizer-loading">
          <span className="organizer-spinner" />
          <p>Preparing your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="organizer-page">
      <div className="organizer-container">
        <section className="organizer-welcome">
          <div className="organizer-welcome-content">
            <span className="organizer-eyebrow">
              EVENTEASE / ORGANIZER PORTAL
            </span>

            <h1>
              Welcome back, {user?.name?.split(" ")[0] || "Organizer"}!
            </h1>

            <p>
              Your events, your audience, your success. Manage everything
              from one place.
            </p>

            <Link
              to="/manage-events"
              className="organizer-primary-button"
            >
              <span aria-hidden="true">＋</span> Manage your events
            </Link>
          </div>

          <div className="organizer-welcome-art" aria-hidden="true">
            <span className="organizer-art-circle organizer-art-circle-one" />
            <span className="organizer-art-circle organizer-art-circle-two" />
            <span className="organizer-art-ticket">✦</span>
            <span className="organizer-art-caption">MAKE IT AN EVENT</span>
          </div>
        </section>

        {error && (
          <div className="organizer-error" role="alert">
            <span aria-hidden="true">ⓘ</span>
            <div>
              <strong>Unable to load your events</strong>
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="organizer-retry"
            >
              Retry
            </button>
          </div>
        )}

        <section className="organizer-stats">
          <article className="organizer-stat-card">
            <div className="organizer-stat-top">
              <span>Total events</span>
              <span className="organizer-stat-icon organizer-icon-purple">
                ▦
              </span>
            </div>
            <strong>{events.length}</strong>
            <small>Events in your account</small>
          </article>

          <article className="organizer-stat-card">
            <div className="organizer-stat-top">
              <span>Published events</span>
              <span className="organizer-stat-icon organizer-icon-green">
                ✓
              </span>
            </div>
            <strong>{publishedEvents.length}</strong>
            <small>Visible to customers</small>
          </article>

          <article className="organizer-stat-card">
            <div className="organizer-stat-top">
              <span>Upcoming events</span>
              <span className="organizer-stat-icon organizer-icon-orange">
                ◷
              </span>
            </div>
            <strong>{upcomingEvents.length}</strong>
            <small>Scheduled events ahead</small>
          </article>
        </section>

        <section className="organizer-section">
          <div className="organizer-section-heading">
            <div>
              <h2>Your events</h2>
              <p>Keep track of the events you organize.</p>
            </div>

            <Link to="/manage-events" className="organizer-text-link">
              Manage all <span aria-hidden="true">→</span>
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="organizer-empty">
              <div className="organizer-empty-icon" aria-hidden="true">
                ♧
              </div>
              <h3>No events to display yet</h3>
              <p>
                Your events will appear here when they are available from
                the backend.
              </p>
              <Link
                to="/manage-events"
                className="organizer-primary-button"
              >
                Go to Manage Events
              </Link>
            </div>
          ) : (
            <div className="organizer-table-wrap">
              <table className="organizer-table">
                <thead>
                  <tr>
                    <th>Event name</th>
                    <th>Event date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.event_id}>
                      <td>
                        <div className="organizer-event-name">
                          <span className="organizer-event-icon">
                            ✦
                          </span>
                          <div>
                            <strong>{event.title || "Untitled event"}</strong>
                            <small>
                              Event #{event.event_id}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(event.event_date)}</td>
                      <td>
                        <span
                          className={`organizer-status organizer-status-${String(
                            event.status || "draft"
                          )
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "")}`}
                        >
                          <span className="organizer-status-dot" />
                          {event.status || "Draft"}
                        </span>
                      </td>
                      <td>
                        <Link
                          to="/manage-events"
                          className="organizer-row-link"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="organizer-section organizer-tools-section">
          <div className="organizer-section-heading">
            <div>
              <h2>Quick access</h2>
              <p>Everything you need to run a successful event.</p>
            </div>
          </div>

          <div className="organizer-quick-actions">
            <Link to="/manage-events" className="organizer-action-card">
              <span className="organizer-action-icon organizer-icon-purple">
                ▦
              </span>
              <span className="organizer-action-copy">
                <strong>Manage events</strong>
                <small>Create, edit and update your events.</small>
              </span>
              <span className="organizer-action-arrow">↗</span>
            </Link>

            <Link to="/manage-events" className="organizer-action-card">
              <span className="organizer-action-icon organizer-icon-green">
                ▤
              </span>
              <span className="organizer-action-copy">
                <strong>Manage tickets</strong>
                <small>Review ticket types, prices and quantities.</small>
              </span>
              <span className="organizer-action-arrow">↗</span>
            </Link>

            <Link to="/manage-events" className="organizer-action-card">
              <span className="organizer-action-icon organizer-icon-orange">
                ↗
              </span>
              <span className="organizer-action-copy">
                <strong>Track bookings</strong>
                <small>Keep an eye on customer bookings.</small>
              </span>
              <span className="organizer-action-arrow">↗</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default OrganizerDashboardPage;
