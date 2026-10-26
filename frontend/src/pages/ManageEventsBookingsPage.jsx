import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://127.0.0.1:8000";

const emptyForm = {
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
};

const normalizeStatus = (status) =>
  String(status || "draft").toLowerCase();

export default function ManageEventsBookingsPage() {
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch events from MySQL through FastAPI.
  const loadEvents = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API}/admin/events`);

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load events from the database."
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("The events API did not return a list.");
      }

      setEvents(data);
      setError("");
    } catch (err) {
      setError(
        `${err.message}. Check that FastAPI and MySQL are running.`
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Load events and the related dropdown data.
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setLoading(true);
      setError("");

      try {
        const paths = [
          "/admin/events",
          "/admin/users",
          "/admin/venues",
          "/admin/categories",
        ];

        const responses = await Promise.all(
          paths.map((path) => fetch(`${API}${path}`))
        );

        const results = await Promise.all(
          responses.map(async (response, index) => {
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
              throw new Error(
                `${paths[index]}: ${
                  data.detail || `HTTP ${response.status}`
                }`
              );
            }

            return data;
          })
        );

        if (cancelled) return;

        const [eventData, userData, venueData, categoryData] = results;

        setEvents(Array.isArray(eventData) ? eventData : []);

        setOrganizers(
          (Array.isArray(userData) ? userData : []).filter(
            (user) =>
              String(user.role).toLowerCase() === "organizer" &&
              String(user.status).toLowerCase() === "active"
          )
        );

        setVenues(Array.isArray(venueData) ? venueData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh the events list every 10 seconds so external database
  // changes are picked up without a manual page refresh.
  useEffect(() => {
    const timer = setInterval(() => {
      loadEvents(false);
    }, 10000);

    return () => clearInterval(timer);
  }, [loadEvents]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleAddEvent(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/admin/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        throw new Error(data.detail || "Could not create the event.");
      }

      setMessage("Event saved to MySQL successfully.");
      setForm(emptyForm);
      setShowForm(false);

      await loadEvents(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item) {
    const current = normalizeStatus(item.status);
    const next = current === "published" ? "draft" : "published";

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/admin/events/${item.event_id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Could not update event status.");
      }

      setMessage(`Event ${next} successfully.`);
      await loadEvents(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteEvent(item) {
    if (
      !window.confirm(
        `Delete "${item.title}"? Events with booking history cannot be deleted.`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/admin/events/${item.event_id}`,
        { method: "DELETE" }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Could not delete the event.");
      }

      setMessage("Event deleted from MySQL.");
      await loadEvents(true);
    } catch (err) {
      setError(err.message);
    }
  }

  const published = events.filter(
    (item) => normalizeStatus(item.status) === "published"
  ).length;

  const drafts = events.filter(
    (item) => normalizeStatus(item.status) === "draft"
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
            Events shown here are loaded from your database.
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
          <strong>{published}</strong>
        </div>

        <div className="manage-stat">
          <span>Drafts</span>
          <strong>{drafts}</strong>
        </div>
      </div>

      <div className="manage-toolbar">
        <h2>Events from MySQL</h2>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setShowForm((value) => !value);
            setError("");
            setMessage("");
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
        <div role="alert" style={{ color: "#b42318", margin: "16px 0" }}>
          <p>{error}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => loadEvents(true)}
          >
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <form className="manage-form" onSubmit={handleAddEvent}>
          <label htmlFor="title">Event name</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleFormChange}
            maxLength={150}
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleFormChange}
          />

          <label htmlFor="organizer_id">Organizer</label>
          <select
            id="organizer_id"
            name="organizer_id"
            value={form.organizer_id}
            onChange={handleFormChange}
            required
          >
            <option value="">Select organizer</option>
            {organizers.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.name} (ID: {user.user_id})
              </option>
            ))}
          </select>

          <label htmlFor="venue_id">Venue</label>
          <select
            id="venue_id"
            name="venue_id"
            value={form.venue_id}
            onChange={handleFormChange}
            required
          >
            <option value="">Select venue</option>
            {venues.map((venue) => (
              <option key={venue.venue_id} value={venue.venue_id}>
                {venue.name} — {venue.city}
              </option>
            ))}
          </select>

          <label htmlFor="category_id">Category</label>
          <select
            id="category_id"
            name="category_id"
            value={form.category_id}
            onChange={handleFormChange}
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
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
            onChange={handleFormChange}
            min={new Date().toLocaleDateString("en-CA")}
            required
          />

          <label htmlFor="ticket_name">Ticket type</label>
          <input
            id="ticket_name"
            name="ticket_name"
            value={form.ticket_name}
            onChange={handleFormChange}
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
            onChange={handleFormChange}
            required
          />

          <label htmlFor="total_quantity">Number of tickets</label>
          <input
            id="total_quantity"
            name="total_quantity"
            type="number"
            min="1"
            step="1"
            value={form.total_quantity}
            onChange={handleFormChange}
            required
          />

          <label htmlFor="status">Initial status</label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleFormChange}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Event to MySQL"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="muted">Loading events from MySQL...</p>
      ) : (
        <div className="manage-event-list">
          {events.map((item) => {
            const status = normalizeStatus(item.status);

            return (
              <article className="manage-event-card" key={item.event_id}>
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
                      {item.venue_city ? `, ${item.venue_city}` : ""}
                    </p>
                  )}

                  {item.category_name && <p>{item.category_name}</p>}

                  <p>
                    Event ID: {item.event_id}
                    {" · Tickets: "}
                    {item.total_quantity ?? 0}
                  </p>
                </div>

                <div className="manage-event-actions">
                  {status !== "cancelled" && status !== "completed" && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => changeStatus(item)}
                    >
                      {status === "published" ? "Unpublish" : "Publish"}
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

          {events.length === 0 && !error && (
            <p className="muted">
              No events found in MySQL. Add an event or check your database.
            </p>
          )}
        </div>
      )}

      <p className="manage-note">
        This page refreshes its event list every 10 seconds. Changes are
        saved only when the backend confirms the request.
      </p>
    </section>
  );
}
