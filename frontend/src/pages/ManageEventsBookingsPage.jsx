
import { useState } from "react";
import { Link } from "react-router-dom";

const initialEvents = [
  {
    id: 1,
    title: "Campus Music Festival",
    date: "2026-11-15",
    price: 299,
    status: "Published",
  },
  {
    id: 2,
    title: "Future of Technology",
    date: "2026-11-20",
    price: 199,
    status: "Published",
  },
  {
    id: 3,
    title: "Art & Culture Night",
    date: "2026-11-25",
    price: 149,
    status: "Draft",
  },
];

export default function ManageEventsBookingsPage() {
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  function addEvent(event) {
    event.preventDefault();

    setEvents((previous) => [
      ...previous,
      {
        id: Date.now(),
        title: title.trim(),
        date,
        price: Number(price),
        status: "Draft",
      },
    ]);

    setTitle("");
    setDate("");
    setPrice("");
    setShowForm(false);
    setMessage("Event added to this page as a draft.");
  }

  function toggleStatus(id) {
    setEvents((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              status:
                item.status === "Published" ? "Draft" : "Published",
            }
          : item
      )
    );
    setMessage("Event status updated for this session.");
  }

  function deleteEvent(id) {
    if (!window.confirm("Are you sure you want to remove this event?")) {
      return;
    }

    setEvents((previous) => previous.filter((item) => item.id !== id));
    setMessage("Event removed from this page.");
  }

  return (
    <section className="section page-section manage-page">
      <div className="manage-heading">
        <div>
          <p className="eyebrow">EVENT MANAGEMENT</p>
          <h1 className="page-title">
            Manage Events <span>& Bookings.</span>
          </h1>
          <p className="muted">
            Create events and manage their publishing status.
          </p>
        </div>

        <Link to="/admin" className="secondary-button">
          ← Admin Dashboard
        </Link>
      </div>

      <div className="manage-summary">
        <div className="manage-stat">
          <span>Total Events</span>
          <strong>{events.length}</strong>
        </div>
        <div className="manage-stat">
          <span>Published</span>
          <strong>
            {events.filter((event) => event.status === "Published").length}
          </strong>
        </div>
        <div className="manage-stat">
          <span>Drafts</span>
          <strong>
            {events.filter((event) => event.status === "Draft").length}
          </strong>
        </div>
      </div>

      <div className="manage-toolbar">
        <h2>Events</h2>
        <button
          className="primary-button"
          onClick={() => {
            setShowForm(!showForm);
            setMessage("");
          }}
        >
          {showForm ? "Cancel" : "+ Add Event"}
        </button>
      </div>

      {message && <p className="manage-message">{message}</p>}

      {showForm && (
        <form className="manage-form" onSubmit={addEvent}>
          <label htmlFor="eventTitle">Event name</label>
          <input
            id="eventTitle"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter event name"
            required
          />

          <label htmlFor="eventDate">Event date</label>
          <input
            id="eventDate"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            min="2026-01-01"
            required
          />

          <label htmlFor="eventPrice">Ticket price (₹)</label>
          <input
            id="eventPrice"
            type="number"
            min="0"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Enter ticket price"
            required
          />

          <button type="submit" className="primary-button">
            Save Event
          </button>
        </form>
      )}

      <div className="manage-event-list">
        {events.map((event) => (
          <article className="manage-event-card" key={event.id}>
            <div className="manage-event-info">
              <span
                className={
                  event.status === "Published"
                    ? "event-status published"
                    : "event-status draft"
                }
              >
                {event.status}
              </span>
              <h3>{event.title}</h3>
              <p>
                {event.date} · ₹{event.price}
              </p>
            </div>

            <div className="manage-event-actions">
              <button
                className="secondary-button"
                onClick={() => toggleStatus(event.id)}
              >
                {event.status === "Published" ? "Unpublish" : "Publish"}
              </button>
              <button
                className="danger-button"
                onClick={() => deleteEvent(event.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {events.length === 0 && (
          <p className="muted">No events yet. Add your first event.</p>
        )}
      </div>

      <p className="manage-note">
        Demo page: changes are temporary and are not saved to MySQL yet.
        Booking management will be connected to the backend during integration.
      </p>
    </section>
  );
}
