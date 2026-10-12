
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

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || event.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <section className="section page-section">
      <p className="eyebrow">FIND YOUR NEXT EXPERIENCE</p>
      <h1 className="page-title">Explore events<span>.</span></h1>
      <p className="muted">
        Discover events, meet people, and make memories.
      </p>

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
            className={`filter-btn ${category === item ? "active" : ""}`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

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
                <Link
                  className="text-link"
                  to={`/events/${event.id}`}
                >
                  View details →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <p>No events found. Try another search.</p>
      )}
    </section>
  );
}