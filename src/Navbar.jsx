
import { Link, NavLink } from "react-router-dom";

function Navbar() {
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

        <NavLink to="/admin">
          Admin Dashboard
        </NavLink>
      </div>

      <div className="navbar-auth">
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
