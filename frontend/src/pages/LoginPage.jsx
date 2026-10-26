
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Login failed. Please check your credentials."
        );
      }

      const user = data.user || data;

      if (!user.role || !user.user_id) {
        throw new Error(
          "The login response is missing the user ID or role."
        );
      }

      const role = String(user.role).toLowerCase();

      if (!["customer", "organizer", "admin"].includes(role)) {
        throw new Error("Your account has an unsupported role.");
      }

      // Save the logged-in user.
      localStorage.setItem(
        "eventEaseUser",
        JSON.stringify(user)
      );

      // Save a token only if the backend actually returns one.
      const token = data.access_token || data.token;

      if (token) {
        localStorage.setItem("eventEaseToken", token);
      } else {
        localStorage.removeItem("eventEaseToken");
      }

      // Clear the old admin UI flag before setting it when needed.
      localStorage.removeItem("eventEaseAdminLoggedIn");

      // Redirect based on the role returned by FastAPI.
      if (role === "admin") {
        localStorage.setItem("eventEaseAdminLoggedIn", "true");
        navigate("/admin", { replace: true });
        return;
      }

      if (role === "organizer") {
        navigate("/organizer", { replace: true });
        return;
      }

      // Customers return to the requested page, if it is safe.
      const redirect = searchParams.get("redirect");

      const safeRedirect =
        redirect &&
        redirect.startsWith("/") &&
        !redirect.startsWith("//") &&
        redirect !== "/login" &&
        redirect !== "/admin" &&
        redirect !== "/organizer"
          ? redirect
          : "/";

      navigate(safeRedirect, { replace: true });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Make sure FastAPI is running."
          : err.message || "Something went wrong. Please try again."
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
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <p
              role="alert"
              style={{ color: "#c62828", marginTop: 12 }}
            >
              {error}
            </p>
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
          Don't have an account?{" "}
          <Link to="/register">Sign Up</Link>
        </p>

        <p className="auth-switch">
          Are you an organizer? Contact your administrator
          to get organizer access.
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;
