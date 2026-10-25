
import { Link, NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const isAdminLoggedIn =
    localStorage.getItem("eventEaseAdminLoggedIn") === "true";

  function handleAdminLogout() {
    localStorage.removeItem("eventEaseAdminLoggedIn");
    navigate("/admin-login");
    window.location.reload();
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

        <NavLink to="/my-bookings">
          My Bookings
        </NavLink>

        {isAdminLoggedIn && (
          <NavLink to="/admin">
            Admin Dashboard
          </NavLink>
        )}
      </div>

      <div className="navbar-auth">
        {isAdminLoggedIn ? (
          <button
            type="button"
            className="login-link navbar-logout"
            onClick={handleAdminLogout}
          >
            Admin Logout
          </button>
        ) : (
          <NavLink to="/admin-login" className="login-link">
            Admin Login
          </NavLink>
        )}

        <NavLink to="/login" className="login-link">
          Log in
        </NavLink>

        <NavLink to="/register" className="signup-link">
          Sign up
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
