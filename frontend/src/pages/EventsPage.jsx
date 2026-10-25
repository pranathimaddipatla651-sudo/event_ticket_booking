
import { useState } from "react";
import { Link } from "react-router-dom";

const events = [
  {
    id: 1,
    name: "Campus Music Festival",
    category: "Music",
    date: "15 November 2026",
    price: 299,
    emoji: "🎸",
    style: "music",
  },
  {
    id: 2,
    name: "Future of Technology",
    category: "Technology",
    date: "20 November 2026",
    price: 199,
    emoji: "💻",
    style: "technology",
  },
  {
    id: 3,
    name: "Art & Culture Night",
    category: "Arts",
    date: "25 November 2026",
    price: 149,
    emoji: "🎨",
    style: "art",
  },
  {
    id: 4,
    name: "Startup Connect",
    category: "Technology",
    date: "28 November 2026",
    price: 249,
    emoji: "🚀",
    style: "technology",
  },
  {
    id: 5,
    name: "Live Acoustic Evening",
    category: "Music",
    date: "5 December 2026",
    price: 199,
    emoji: "🎤",
    style: "music",
  },
  {
    id: 6,
    name: "Creative Workshop",
    category: "Arts",
    date: "10 December 2026",
    price: 99,
    emoji: "🖌️",
    style: "art",
  },
];

const categories = ["All", "Music", "Technology", "Arts"];
const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function parseEventDate(dateString) {
  const date = new Date(dateString);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");

  // Start with November 2026, when the first events are scheduled.
  const [displayedMonth, setDisplayedMonth] = useState(
    new Date(2026, 10, 1)
  );

  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Display six calendar rows, including dates from adjacent months.
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    return new Date(year, month, index - firstDay + 1);
  });

  const eventsByDate = {};

  events.forEach((event) => {
    const key = dateKey(parseEventDate(event.date));
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  });

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || event.category === category;

    const matchesDate =
      !selectedDate ||
      dateKey(parseEventDate(event.date)) === selectedDate;

    return matchesSearch && matchesCategory && matchesDate;
  });

  function changeMonth(amount) {
    setDisplayedMonth(new Date(year, month + amount, 1));
  }

  function selectDay(day) {
    setSelectedDate(dateKey(day));
    setDisplayedMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  function clearDate() {
    setSelectedDate("");
  }

  return (
    <section className="section page-section">
      <p className="eyebrow">FIND YOUR NEXT EXPERIENCE</p>
      <h1 className="page-title">
        Explore events<span>.</span>
      </h1>
      <p className="muted">
        Discover events, meet people, and make memories.
      </p>

      <div className="event-calendar">
        <div className="calendar-heading">
          <div>
            <p className="calendar-kicker">PLAN YOUR EXPERIENCE</p>
            <h2>
              {displayedMonth.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>

          <div className="calendar-navigation">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              &#8249;
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              &#8250;
            </button>
          </div>
        </div>

        <div className="calendar-weekdays">
          {weekdays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day, index) => {
            const key = dateKey(day);
            const hasEvents = Boolean(eventsByDate[key]?.length);
            const isSelected = selectedDate === key;
            const isCurrentMonth = day.getMonth() === month;
            const isToday = key === dateKey(new Date());

            return (
              <button
                type="button"
                key={`${key}-${index}`}
                className={[
                  "calendar-day",
                  !isCurrentMonth ? "outside-month" : "",
                  isSelected ? "selected-day" : "",
                  isToday ? "today-day" : "",
                  hasEvents ? "has-events" : "",
                ].filter(Boolean).join(" ")}
                aria-label={`${formatDate(day)}${hasEvents ? ", events available" : ""}`}
                aria-pressed={isSelected}
                onClick={() => selectDay(day)}
              >
                <span>{day.getDate()}</span>
                {hasEvents && <i className="event-dot" />}
              </button>
            );
          })}
        </div>

        <div className="calendar-legend">
          <span><i className="event-dot" /> Events scheduled</span>
          {selectedDate && (
            <button type="button" onClick={clearDate}>
              Show all dates
            </button>
          )}
        </div>
      </div>

      {selectedDate && (
        <p className="selected-date-label">
          Showing events for {formatDate(
            new Date(
              Number(selectedDate.slice(0, 4)),
              Number(selectedDate.slice(5, 7)) - 1,
              Number(selectedDate.slice(8, 10))
            )
          )}
        </p>
      )}

      <input
        className="search-input"
        type="search"
        placeholder="Search events by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="filters">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={`filter-btn ${category === item ? "active" : ""}`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="muted event-results-count">
        {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
      </p>

      <div className="event-grid">
        {filteredEvents.map((event) => (
          <article className="event-card" key={event.id}>
            <div className={`event-image ${event.style}`}>
              <span>{event.emoji}</span>
              <span className="event-category">{event.category}</span>
            </div>

            <div className="event-info">
              <p className="event-date">{event.date}</p>
              <h3>{event.name}</h3>
              <div className="event-bottom">
                <strong>₹{event.price}</strong>
                <Link className="text-link" to={`/events/${event.id}`}>
                  View details →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <p className="no-events-message">
          No events found for this selection. Try another date or clear your filters.
        </p>
      )}
    </section>
  );
}
