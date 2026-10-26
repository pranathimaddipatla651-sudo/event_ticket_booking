
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [summaryResponse, bookingsResponse] = await Promise.all([
          fetch(`${API_URL}/admin/dashboard/summary`),
          fetch(`${API_URL}/admin/bookings`),
        ]);

        if (!summaryResponse.ok) {
          throw new Error("Could not load dashboard statistics.");
        }

        const summaryData = await summaryResponse.json();
        setSummary(summaryData);

        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(
            Array.isArray(bookingsData)
              ? bookingsData
              : bookingsData.bookings || []
          );
        }
      } catch (err) {
        setError(
          `${err.message} Check that your FastAPI backend is running.`
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="admin-container">
        <p>Loading dashboard from database...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="admin-container">
        <h1>Admin Dashboard</h1>
        <p className="admin-error">{error}</p>
        <button
          className="admin-manage-button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </main>
    );
  }

  const stats = [
    {
      title: "Total Users",
      value: summary?.total_users ?? 0,
      icon: "👥",
      color: "purple",
    },
    {
      title: "Total Venues",
      value: summary?.total_venues ?? 0,
      icon: "📍",
      color: "blue",
    },
    {
      title: "Categories",
      value: summary?.total_categories ?? 0,
      icon: "🎭",
      color: "green",
    },
    {
      title: "Total Revenue",
      value: `₹${Number(
        summary?.total_revenue ?? 0
      ).toLocaleString("en-IN")}`,
      icon: "₹",
      color: "pink",
    },
  ];

  return (
    <main className="admin-container">
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">EVENTEASE MANAGEMENT</span>
          <h1>Admin Dashboard</h1>
          <p>Monitor your event platform and database reports.</p>
        </div>

        <Link to="/admin/manage" className="admin-manage-button">
          Manage Events & Bookings →
        </Link>
      </header>

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
            <p>Latest bookings recorded by the system</p>
          </div>

          <Link to="/admin/manage" className="admin-view-all">
            Manage bookings →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="admin-empty">
            <span>🎟️</span>
            <h3>No booking records returned</h3>
            <p>
              The bookings endpoint may not be implemented yet, or there
              may be no bookings.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Event</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {bookings.slice(-5).reverse().map((booking, index) => (
                  <tr
                    key={booking.booking_id ?? booking.id ?? index}
                  >
                    <td>
                      <strong>
                        #{booking.booking_id ?? booking.id ?? "—"}
                      </strong>
                    </td>
                    <td>
                      {booking.event ?? booking.eventName ?? "Event"}
                    </td>
                    <td>
                      ₹
                      {Number(
                        booking.total_amount ?? booking.total ?? 0
                      ).toLocaleString("en-IN")}
                    </td>
                    <td>
                      <span
                        className={`admin-status status-${String(
                          booking.status || "confirmed"
                        ).toLowerCase()}`}
                      >
                        {booking.status || "Confirmed"}
                      </span>
                    </td>
                  </tr>
                ))}
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
            <p>Manage event information and ticket availability.</p>
          </div>
          <span className="admin-arrow">→</span>
        </Link>

        <Link to="/admin/manage">
          <span>📋</span>
          <div>
            <strong>Manage Bookings</strong>
            <p>Review customer bookings and their status.</p>
          </div>
          <span className="admin-arrow">→</span>
        </Link>
      </section>
    </main>
  );
}

export default AdminDashboardPage;
