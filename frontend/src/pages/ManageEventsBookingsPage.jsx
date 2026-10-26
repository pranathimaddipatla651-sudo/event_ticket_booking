import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://127.0.0.1:8000";

function formatStatus(status) {
  return String(status || "draft").toLowerCase();
}

export default function ManageEventsBookingsPage() {
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    organizer_id: "",
    venue_id: "",
    category_id: "",
    title: "",
    description: "",
    event_date: "",
    ticket_name: "General Admission",
    price: "",
    total_quantity: "",
    status: "draft",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        "/admin/events",
        "/admin/users",
        "/admin/venues",
        "/admin/categories",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`${API}${endpoint}`)
        )
      );

      const failedIndex = responses.findIndex(
        (response) => !response.ok
      );

      if (failedIndex !== -1) {
        const response = responses[failedIndex];
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.detail ||
            `Could not load ${endpoints[failedIndex]}.`
        );
      }

      const [eventData, userData, venueData, categoryData] =
        await Promise.all(
          responses.map((response) => response.json())
        );

      setEvents(Array.isArray(eventData) ? eventData : []);

      setOrganizers(
        Array.isArray(userData)
          ? userData.filter(
              (user) =>
                String(user.role).toLowerCase() === "organizer" &&
                String(user.status).toLowerCase() === "active"
            )
          : []
      );

      setVenues(Array.isArray(venueData) ? venueData : []);
      setCategories(
        Array.isArray(categoryData) ? categoryData : []
      );
    } catch (err) {
      setError(
        `${err.message} Check that FastAPI is running and the admin endpoints exist.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleAddEvent(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`${API}/admin/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          organizer_id: Number(form.organizer_id),
          venue_id: Number(form.venue_id),
          category_id: Number(form.category_id),
          price: Number(form.price),
          total_quantity: Number(form.total_quantity),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Could not create the event."
        );
      }

      setMessage("Event saved successfully to the database.");
      setForm({
        organizer_id: "",
        venue_id: "",
        category_id: "",
        title: "",
        description: "",
        event_date: "",
        ticket_name: "General Admission",
        price: "",
        total_quantity: "",
        status: "draft",
      });

      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(eventItem) {
    const currentStatus = formatStatus(eventItem.status);

    const newStatus =
      currentStatus === "published" ? "draft" : "published";

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API}/admin/events/${eventItem.event_id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not update event status."
        );
      }

      setMessage(`Event ${newStatus} successfully.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteEvent(eventItem) {
    const confirmed = window.confirm(
      `Delete "${eventItem.title}"? Events with booking history cannot be deleted.`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API}/admin/events/${eventItem.event_id}`,
        { method: "DELETE" }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not delete the event."
        );
      }

      setMessage("Event deleted from the database.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const publishedCount = events.filter(
    (event) => formatStatus(event.status) === "published"
  ).length;

  const draftCount = events.filter(
    (event) => formatStatus(event.status) === "draft"
  ).length;

  return (
    <section className="section page-section manage-page">
      <div className="manage-heading">
        <div>
          <p className="eyebrow">EVENT MANAGEMENT</p>
          <h1 className="page-title">
            Manage Events <span>& Bookings.</span>
          </h1>
          <p className="muted">
            Manage events stored in your EventEase database.
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
          <strong>{publishedCount}</strong>
        </div>

        <div className="manage-stat">
          <span>Drafts</span>
          <strong>{draftCount}</strong>
        </div>
      </div>

      <div className="manage-toolbar">
        <h2>Events from MySQL</h2>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setShowForm((previous) => !previous);
            setMessage("");
            setError("");
          }}
        >
          {showForm ? "Cancel" : "+ Add Event"}
        </button>
      </div>

      {message && (
        <p className="manage-message" role="status">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "#c62828" }}>
          {error}
        </p>
      )}

      {showForm && (
        <form
          className="manage-form"
          onSubmit={handleAddEvent}
        >
          <label htmlFor="title">Event name</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={updateForm}
            maxLength={150}
            placeholder="Enter event name"
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={updateForm}
            placeholder="Describe your event"
          />

          <label htmlFor="organizer_id">Organizer</label>
          <select
            id="organizer_id"
            name="organizer_id"
            value={form.organizer_id}
            onChange={updateForm}
            required
          >
            <option value="">Select an active organizer</option>
            {organizers.map((organizer) => (
              <option
                key={organizer.user_id}
                value={organizer.user_id}
              >
                {organizer.name} (ID: {organizer.user_id})
              </option>
            ))}
          </select>

          <label htmlFor="venue_id">Venue</label>
          <select
            id="venue_id"
            name="venue_id"
            value={form.venue_id}
            onChange={updateForm}
            required
          >
            <option value="">Select a venue</option>
            {venues.map((venue) => (
              <option
                key={venue.venue_id}
                value={venue.venue_id}
              >
                {venue.name} — {venue.city}
              </option>
            ))}
          </select>

          <label htmlFor="category_id">Category</label>
          <select
            id="category_id"
            name="category_id"
            value={form.category_id}
            onChange={updateForm}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option
                key={category.category_id}
                value={category.category_id}
              >
                {category.name}
              </option>
            ))}
          </select>

          <label htmlFor="event_date">Event date</label>
          <input
            id="event_date"
            name="event_date"
            type="date"
            value={form.event_date}
            onChange={updateForm}
            min={new Date().toLocaleDateString("en-CA")}
            required
          />

          <label htmlFor="ticket_name">Ticket type</label>
          <input
            id="ticket_name"
            name="ticket_name"
            value={form.ticket_name}
            onChange={updateForm}
            maxLength={100}
            required
          />

          <label htmlFor="price">Ticket price (₹)</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={updateForm}
            required
          />

          <label htmlFor="total_quantity">Total tickets</label>
          <input
            id="total_quantity"
            name="total_quantity"
            type="number"
            min="1"
            step="1"
            value={form.total_quantity}
            onChange={updateForm}
            required
          />

          <label htmlFor="status">Initial status</label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={updateForm}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Event to Database"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="muted">Loading events from MySQL...</p>
      ) : (
        <div className="manage-event-list">
          {events.map((item) => {
            const status = formatStatus(item.status);

            return (
              <article
                className="manage-event-card"
                key={item.event_id}
              >
                <div className="manage-event-info">
                  <span
                    className={
                      status === "published"
                        ? "event-status published"
                        : "event-status draft"
                    }
                  >
                    {status}
                  </span>

                  <h3>{item.title}</h3>

                  <p>
                    {String(item.event_date).slice(0, 10)}
                    {" · ₹"}
                    {Number(item.price || 0).toLocaleString("en-IN")}
                  </p>

                  {item.venue_name && (
                    <p>
                      {item.venue_name}
                      {item.venue_city
                        ? `, ${item.venue_city}`
                        : ""}
                    </p>
                  )}

                  {item.category_name && (
                    <p>Category: {item.category_name}</p>
                  )}

                  <p>
                    Event ID: {item.event_id}
                    {" · Tickets: "}
                    {item.total_quantity ?? 0}
                  </p>
                </div>

                <div className="manage-event-actions">
                  {status !== "cancelled" &&
                    status !== "completed" && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => toggleStatus(item)}
                      >
                        {status === "published"
                          ? "Unpublish"
                          : "Publish"}
                      </button>
                    )}

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => deleteEvent(item)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}

          {events.length === 0 && (
            <p className="muted">
              No events exist in your database yet. Use Add Event
              to create your first event.
            </p>
          )}
        </div>
      )}

      <p className="manage-note">
        Event records and ticket details are loaded from the backend.
        Changes are saved only when the API request succeeds.
      </p>
    </section>
  );
}