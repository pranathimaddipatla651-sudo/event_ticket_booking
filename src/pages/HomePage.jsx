
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div>
      <section className="hero">
        <p className="eyebrow">YOUR NEXT EXPERIENCE STARTS HERE</p>

        <h1>
          Moments worth
          <br />
          showing up for<span>.</span>
        </h1>

        <p>
          Discover exciting events, find your people,
          and make memories that last.
        </p>

        <Link to="/events" className="btn">
          Explore Events →
        </Link>
      </section>

      <section className="section">
        <p className="eyebrow">DISCOVER SOMETHING NEW</p>
        <h2>Find your next favourite event.</h2>

        <div className="event-grid">
          <div className="event-card">
            <div className="event-image music">🎸</div>
            <h3>Campus Music Festival</h3>
            <p>Music · From ₹299</p>
            <Link to="/events/1">View event →</Link>
          </div>

          <div className="event-card">
            <div className="event-image technology">💻</div>
            <h3>Future of Technology</h3>
            <p>Technology · From ₹199</p>
            <Link to="/events/2">View event →</Link>
          </div>

          <div className="event-card">
            <div className="event-image art">🎨</div>
            <h3>Art & Culture Night</h3>
            <p>Art · From ₹149</p>
            <Link to="/events/3">View event →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}