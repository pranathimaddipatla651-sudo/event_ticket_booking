
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./Navbar";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingPage from "./pages/BookingPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import TicketDetailsPage from "./pages/TicketDetailsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import "./App.css";
import "./index.css";

function PlaceholderPage({ title }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <h1>{title}</h1>
        <p>
          This feature is under development.
          We are working to make your EventEase experience better!
        </p>

        <a href="/" className="primary-button">
          Back to Home
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/events" element={<EventsPage />} />

          <Route
          path="/events/:id"
          element={<EventDetailsPage />}
          />
          <Route path="/booking" element={<BookingPage />} />
          <Route
          path="/confirmation/:id"
          element={<BookingConfirmationPage />}
          />

         <Route
          path="/my-bookings"
          element={<MyBookingsPage />}
          />
         <Route
          path="/ticket/:id"
          element={<TicketDetailsPage />}
         />

        <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route
          path="/admin"
          element={<AdminDashboardPage />}
          />

          <Route
            path="*"
            element={<PlaceholderPage title="404 - Page Not Found" />}
          />
        </Routes>
      </main>

      <footer className="footer">
        <p>
          © {new Date().getFullYear()} EventEase. All rights reserved.
        </p>
      </footer>
    </BrowserRouter>
  );
}

export default App;
