
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function AdminDashboardPage() {
  const [summary, setSummary] = useState({
    events: [],
    bookings: [],
    users: [],
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        // These values are temporary fallbacks until we connect
        // the dashboard to your actual admin API.
        const events = JSON.parse(
          localStorage.getItem("eventEaseEvents") || "[]"
        );
        const bookings = JSON.parse(
          localStorage.getItem("eventEaseBookings") || "[]"
        );

        setSummary({
          events,
          bookings,
          users: [],
          revenue: bookings
            .filter(
              (booking) =>
                String(booking.status).toLowerCase() !== "cancelled"
            )
            .reduce(
              (sum, booking) => sum + Number(booking.total || 0),
              0
            ),
        });
      } catch {
        setError("Unable to load dashboard information.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const activeBookings = summary.bookings.filter(
    (booking) =>
      String(booking.status).toLowerCase() !== "cancelled"
  );

  const cancelledBookings = summary.bookings.filter(
    (booking) =>
      String(booking.status).toLowerCase() === "cancelled"
  );

  const stats = [
    {
      title: "Total Events",
      value: summary.events.length,
      icon: "🎉",
      color: "purple",
    },
    {
      title: "Total Bookings",
      value: summary.bookings.length,
      icon: "🎟️",
      color: "blue",
    },
    {
      title: "Active Bookings",
      value: activeBookings.length,
      icon: "✓",
      color: "green",
    },
    {
      title: "Cancelled",
      value: cancelledBookings.length,
      icon: "↩",
      color: "orange",
    },
    {
      title: "Booking Revenue",
      value: `₹${summary.revenue.toLocaleString("en-IN")}`,
      icon: "₹",
      color: "pink",
    },
  ];

  if (loading) {
    return (
      <div className="admin-container">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <main className="admin-container">
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">EVENTEASE MANAGEMENT</span>
          <h1>Admin Dashboard</h1>
          <p>Monitor your events, bookings, and sales in one place.</p>
        </div>

        <Link to="/admin/manage" className="admin-manage-button">
          + Manage Events & Bookings
        </Link>
      </header>

      {error && <p className="admin-error">{error}</p>}

      <section className="admin-stats">
        {stats.map((stat) => (
          <article
            className={`admin-stat-card stat-${stat.color}`}
            key={stat.title}
          >
            <div className="admin-stat-top">
              <span className="admin-stat-icon">{stat.icon}</span>
              <span className="admin-stat-label">{stat.title}</span>
            </div>
            <h2>{stat.value}</h2>
          </article>
        ))}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>Recent Bookings</h2>
            <p>Latest customer booking activity</p>
          </div>
          <Link to="/admin/manage" className="admin-view-all">
            Manage bookings →
          </Link>
        </div>

        {summary.bookings.length === 0 ? (
          <div className="admin-empty">
            <span>🎫</span>
            <h3>No bookings yet</h3>
            <p>Customer bookings will appear here when available.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Event</th>
                  <th>Tickets</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {[...summary.bookings].reverse().slice(0, 5).map(
                  (booking, index) => {
                    const status = String(
                      booking.status || "Confirmed"
                    ).toLowerCase();

                    return (
                      <tr key={booking.id ?? booking.booking_id ?? index}>
                        <td>
                          <strong>
                            #{booking.id ?? booking.booking_id ?? "—"}
                          </strong>
                        </td>
                        <td>
                          {booking.eventName ??
                            booking.event ??
                            booking.title ??
                            "Event"}
                        </td>
                        <td>
                          {booking.quantity ??
                            booking.ticket_quantity ??
                            "—"}
                        </td>
                        <td>
                          ₹
                          {Number(
                            booking.total ??
                              booking.total_amount ??
                              0
                          ).toLocaleString("en-IN")}
                        </td>
                        <td>
                          <span
                            className={`admin-status status-${status.replace(
                              /\s+/g,
                              "-"
                            )}`}
                          >
                            {booking.status || "Confirmed"}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-quick-links">
        <Link to="/admin/manage">
          <span>🎪</span>
          <div>
            <strong>Manage Events</strong>
            <p>Create and update event information</p>
          </div>
          <span className="admin-arrow">→</span>
        </Link>

        <Link to="/admin/manage">
          <span>📋</span>
          <div>
            <strong>Manage Bookings</strong>
            <p>Review customer booking records</p>
          </div>
          <span className="admin-arrow">→</span>
        </Link>
      </section>
    </main>
  );
}

export default AdminDashboardPage;
