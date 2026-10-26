
import { Link, NavLink, useNavigate } from "react-router-dom";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("eventEaseUser") || "null");
  } catch {
    return null;
  }
}

function Navbar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const role = String(user?.role || "").toLowerCase();
  const loggedIn = Boolean(user);

  function logout() {
    localStorage.removeItem("eventEaseUser");
    localStorage.removeItem("eventEaseToken");
    localStorage.removeItem("eventEaseAdminLoggedIn");

    navigate("/", { replace: true });
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        EventEase
      </Link>

      <div className="navbar-links">
        <NavLink to="/" end>
          Home
        </NavLink>

        <NavLink to="/events">
          Explore Events
        </NavLink>

        {role === "customer" && (
          <NavLink to="/my-bookings">
            My Bookings
          </NavLink>
        )}

        {role === "admin" && (
          <NavLink to="/admin">
            Admin Dashboard
          </NavLink>
        )}

        {role === "organizer" && (
          <NavLink to="/organizer">
            Organizer Dashboard
          </NavLink>
        )}
      </div>

      <div className="navbar-auth">
        {!loggedIn ? (
          <>
            <NavLink to="/login" className="login-link">
              Log in
            </NavLink>

            <NavLink to="/register" className="signup-link">
              Sign up
            </NavLink>
          </>
        ) : (
          <>
            <span className="login-link">
              Hi, {user.name || user.full_name || user.email || "User"}
            </span>

            <button
              type="button"
              className="login-link navbar-logout"
              onClick={logout}
            >
              Log out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
