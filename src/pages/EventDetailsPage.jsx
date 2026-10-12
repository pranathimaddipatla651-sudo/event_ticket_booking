
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

const events = [
  {
    id: 1,
    name: "Campus Music Festival",
    category: "Music",
    date: "15 November 2026",
    time: "5:00 PM onwards",
    venue: "College Auditorium",
    price: 299,
    emoji: "🎸",
    style: "music",
    description:
      "Enjoy an exciting evening of live music, performances, and unforgettable moments with friends.",
  },
  {
    id: 2,
    name: "Future of Technology",
    category: "Technology",
    date: "20 November 2026",
    time: "10:00 AM onwards",
    venue: "Main Seminar Hall",
    price: 199,
    emoji: "💻",
    style: "technology",
    description:
      "Explore emerging technologies, connect with innovators, and discover ideas shaping the future.",
  },
  {
    id: 3,
    name: "Art & Culture Night",
    category: "Arts",
    date: "25 November 2026",
    time: "4:00 PM onwards",
    venue: "College Open Grounds",
    price: 149,
    emoji: "🎨",
    style: "art",
    description:
      "Experience creativity through art, cultural performances, and student talent.",
  },
  {
    id: 4,
    name: "Startup Connect",
    category: "Technology",
    date: "28 November 2026",
    time: "11:00 AM onwards",
    venue: "Innovation Centre",
    price: 249,
    emoji: "🚀",
    style: "technology",
    description:
      "Meet aspiring founders, exchange ideas, and learn about building new ventures.",
  },
  {
    id: 5,
    name: "Live Acoustic Evening",
    category: "Music",
    date: "5 December 2026",
    time: "6:00 PM onwards",
    venue: "College Amphitheatre",
    price: 199,
    emoji: "🎤",
    style: "music",
    description:
      "Relax with live acoustic performances in a friendly and welcoming atmosphere.",
  },
  {
    id: 6,
    name: "Creative Workshop",
    category: "Arts",
    date: "10 December 2026",
    time: "2:00 PM onwards",
    venue: "Creative Studio",
    price: 99,
    emoji: "🖌️",
    style: "art",
    description:
      "Take part in a hands-on workshop and explore your creative side.",
  },
];

export default function EventDetailsPage() {
  const { id } = useParams();
  const event = events.find((item) => item.id === Number(id));
  const [quantity, setQuantity] = useState(1);

  if (!event) {
    return (
      <section className="section">
        <h1>Event not found</h1>
        <Link to="/events" className="text-link">
          ← Back to events
        </Link>
      </section>
    );
  }

  return (
    <section className="section details-layout">
      <div className="details-main">
        <Link to="/events" className="text-link">
          ← Back to events
        </Link>

        <div className={`details-banner ${event.style}`}>
          <span>{event.emoji}</span>
        </div>

        <p className="eyebrow">{event.category} EVENT</p>
        <h1 className="page-title">{event.name}</h1>
        <p className="muted">{event.description}</p>

        <div className="details-information">
          <div>
            <span>📅</span>
            <div>
              <strong>Date</strong>
              <p>{event.date}</p>
            </div>
          </div>

          <div>
            <span>🕒</span>
            <div>
              <strong>Time</strong>
              <p>{event.time}</p>
            </div>
          </div>

          <div>
            <span>📍</span>
            <div>
              <strong>Venue</strong>
              <p>{event.venue}</p>
            </div>
          </div>
        </div>
      </div>

      <aside className="booking-panel">
        <p className="eyebrow">RESERVE YOUR SPOT</p>
        <h2>Book tickets</h2>

        <p className="muted">Price per ticket</p>
        <h2>₹{event.price}</h2>

        <label htmlFor="quantity">Number of tickets</label>

        <div className="quantity-control">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease tickets"
          >
            −
          </button>

          <span>{quantity}</span>

          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            aria-label="Increase tickets"
          >
            +
          </button>
        </div>

        <div className="price-row">
          <span>₹{event.price} × {quantity}</span>
          <strong>₹{event.price * quantity}</strong>
        </div>

        <Link
          to="/login"
          className="btn btn-primary booking-button"
        >
          Continue to book →
        </Link>

        <p className="booking-note">
          Demo only. Your tickets have not been booked.
        </p>
      </aside>
    </section>
  );
}