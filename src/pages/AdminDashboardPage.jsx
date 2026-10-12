
import { Link } from "react-router-dom";

function AdminDashboardPage() {
  const events = JSON.parse(
    localStorage.getItem("eventEaseEvents") || "[]"
  );

  const bookings = JSON.parse(
    localStorage.getItem("eventEaseBookings") || "[]"
  );

  const activeBookings = bookings.filter(
    (booking) => booking.status !== "Cancelled"
  );

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "Cancelled"
  );

  const totalRevenue = activeBookings.reduce(
    (sum, booking) => sum + Number(booking.total || 0),
    0
  );

  const stats = [
    {
      title: "Total Events",
      value: events.length,
      icon: "🎉",
    },
    {
      title: "Total Bookings",
      value: bookings.length,
      icon: "🎟️",
    },
    {
      title: "Active Bookings",
      value: activeBookings.length,
      icon: "✅",
    },
    {
      title: "Cancelled Bookings",
      value: cancelledBookings.length,
      icon: "❌",
    },
    {
      title: "Booking Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      icon: "💰",
    },
  ];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome to the EventEase administration panel.</p>
        </div>

        <Link to="/admin/manage" className="admin-manage-button">
          Manage Events & Bookings
        </Link>
      </div>

      <div className="admin-stats">
        {stats.map((stat) => (
          <div className="admin-stat-card" key={stat.title}>
            <span className="admin-stat-icon">{stat.icon}</span>
            <p>{stat.title}</p>
            <h2>{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <h2>Recent Bookings</h2>

        {bookings.length === 0 ? (
          <p>No bookings have been made yet.</p>
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
                {[...bookings].reverse().slice(0, 5).map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{booking.eventName}</td>
                    <td>{booking.quantity}</td>
                    <td>
                      ₹{Number(booking.total).toLocaleString("en-IN")}
                    </td>
                    <td>
                      <span
                        className={
                          booking.status === "Cancelled"
                            ? "admin-status-cancelled"
                            : "admin-status-confirmed"
                        }
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
      </div>
    </div>
  );
}

export default AdminDashboardPage;
