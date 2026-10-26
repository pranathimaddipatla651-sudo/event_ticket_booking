
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed.");
      }

      const user = data.user || data;

      if (!user.role) {
        throw new Error("The login response does not contain a user role.");
      }

      localStorage.setItem("eventEaseUser", JSON.stringify(user));

      const token = data.access_token || data.token;
      if (token) {
        localStorage.setItem("eventEaseToken", token);
      }

      const role = String(user.role).toLowerCase();

      if (role === "admin") {
        localStorage.setItem("eventEaseAdminLoggedIn", "true");
        navigate("/admin", { replace: true });
        return;
      }

      localStorage.removeItem("eventEaseAdminLoggedIn");

      const redirect = searchParams.get("redirect");
      const safeRedirect =
        redirect &&
        redirect.startsWith("/") &&
        !redirect.startsWith("//") &&
        redirect !== "/login"
          ? redirect
          : "/";

      navigate(safeRedirect, { replace: true });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Make sure FastAPI is running."
          : err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome Back!</h1>
        <p className="auth-subtitle">
          Log in to discover and book amazing events.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p style={{ color: "#c62828", marginTop: 12 }}>{error}</p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>

        <p className="auth-switch">
          Are you an admin? <Link to="/admin-login">Admin Login</Link>
        </p>

        <Link to="/" className="back-home">← Back to Home</Link>
      </div>
    </div>
  );
}

export default LoginPage;
