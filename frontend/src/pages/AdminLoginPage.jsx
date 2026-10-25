
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AdminLoginPage() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Temporary credentials for frontend demonstration only.
    if (adminId === "admin" && password === "Admin@123") {
      localStorage.setItem("eventEaseAdminLoggedIn", "true");
      navigate("/admin");
    } else {
      setError("Invalid Admin ID or password. Please try again.");
    }
  }

  return (
    <section className="section page-section admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon">🔐</div>

        <p className="eyebrow">RESTRICTED ACCESS</p>
        <h1 className="page-title">Admin Login<span>.</span></h1>
        <p className="muted">
          Sign in to manage EventEase events and bookings.
        </p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label htmlFor="adminId">Admin ID</label>
          <input
            id="adminId"
            type="text"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            placeholder="Enter your Admin ID"
            required
          />

          <label htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <p className="admin-login-error">{error}</p>}

          <button type="submit" className="primary-button">
            Log in to Dashboard →
          </button>
        </form>

        <Link to="/" className="admin-back-link">
          ← Back to Home
        </Link>
      </div>
    </section>
  );
}
