-- Event Booking System: MySQL 8 schema (hybrid version)
-- DB keeps: constraints, locking support, safety triggers, report views.
-- Application does: booking transaction, cancellation, refunds, waitlist promotion, offer expiry.
CREATE DATABASE IF NOT EXISTS event_booking;
USE event_booking;

-- ============ PERSON 1: Admin panel ============
CREATE TABLE Users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  city          VARCHAR(80),
  role          ENUM('customer','organizer','admin') NOT NULL DEFAULT 'customer',
  status        ENUM('active','blocked') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Venues (
  venue_id INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(120) NOT NULL,
  city     VARCHAR(80)  NOT NULL,
  address  VARCHAR(255),
  capacity INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE Categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80) NOT NULL UNIQUE
);

-- ============ PERSON 2: Events and tickets ============
CREATE TABLE Events (
  event_id     INT AUTO_INCREMENT PRIMARY KEY,
  organizer_id INT NOT NULL,
  venue_id     INT NOT NULL,
  category_id  INT NOT NULL,
  title        VARCHAR(150) NOT NULL,
  description  TEXT,
  event_date   DATETIME NOT NULL,
  status       ENUM('draft','published','cancelled','completed') NOT NULL DEFAULT 'published',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES Users(user_id),
  FOREIGN KEY (venue_id)     REFERENCES Venues(venue_id),
  FOREIGN KEY (category_id)  REFERENCES Categories(category_id),
  INDEX idx_event_date (event_date),
  INDEX idx_event_search (category_id, event_date)
);

CREATE TABLE Ticket_Types (
  ticket_type_id     INT AUTO_INCREMENT PRIMARY KEY,
  event_id           INT NOT NULL,
  name               VARCHAR(60) NOT NULL,           -- e.g. General, VIP
  price              DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  total_quantity     INT NOT NULL CHECK (total_quantity > 0),
  available_quantity INT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
  UNIQUE (event_id, name),
  CHECK (available_quantity >= 0 AND available_quantity <= total_quantity)
);

-- ============ PERSON 3: Bookings ============
CREATE TABLE Bookings (
  booking_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status       ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  INDEX idx_booking_user (user_id)
);

CREATE TABLE Booking_Items (
  item_id        INT AUTO_INCREMENT PRIMARY KEY,
  booking_id     INT NOT NULL,
  ticket_type_id INT NOT NULL,
  quantity       INT NOT NULL CHECK (quantity > 0),
  unit_price     DECIMAL(10,2) NOT NULL,              -- price frozen at booking time
  FOREIGN KEY (booking_id)     REFERENCES Bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_type_id) REFERENCES Ticket_Types(ticket_type_id)
);

-- ============ PERSON 4: Payments, waitlist, reviews ============
CREATE TABLE Payments (
  payment_id  INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  method      ENUM('card','upi','netbanking','wallet') NOT NULL,
  status      ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  paid_at     DATETIME,
  refunded_at DATETIME,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);

CREATE TABLE Waitlist (
  waitlist_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  ticket_type_id   INT NOT NULL,
  quantity         INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  joined_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status           ENUM('waiting','offered','booked','expired') NOT NULL DEFAULT 'waiting',
  offer_expires_at DATETIME,
  FOREIGN KEY (user_id)        REFERENCES Users(user_id),
  FOREIGN KEY (ticket_type_id) REFERENCES Ticket_Types(ticket_type_id),
  INDEX idx_wait_queue (ticket_type_id, status, joined_at)
);

CREATE TABLE Reviews (
  review_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  event_id   INT NOT NULL,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES Users(user_id),
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
  UNIQUE (user_id, event_id)                          -- one review per user per event
);

-- ======================================================
-- SAFETY TRIGGERS (rules that must hold no matter who writes the data)
-- ======================================================
DELIMITER //
CREATE TRIGGER trg_check_stock BEFORE INSERT ON Booking_Items
FOR EACH ROW
BEGIN
  DECLARE v_avail INT;
  SELECT available_quantity INTO v_avail
    FROM Ticket_Types WHERE ticket_type_id = NEW.ticket_type_id;
  IF v_avail < NEW.quantity THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not enough tickets available';
  END IF;
END //

CREATE TRIGGER trg_block_blocked_user BEFORE INSERT ON Bookings
FOR EACH ROW
BEGIN
  IF (SELECT status FROM Users WHERE user_id = NEW.user_id) = 'blocked' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Blocked users cannot book';
  END IF;
END //
DELIMITER ;

-- ======================================================
-- REPORT VIEWS
-- ======================================================
-- P1: admin dashboard
CREATE VIEW v_total_revenue AS
  SELECT SUM(amount) AS total_revenue FROM Payments WHERE status = 'success';

CREATE VIEW v_monthly_bookings AS
  SELECT DATE_FORMAT(booking_date,'%Y-%m') AS month, COUNT(*) AS bookings,
        SUM(total_amount) AS revenue
  FROM Bookings WHERE status = 'confirmed' GROUP BY month;

CREATE VIEW v_top_users AS
  SELECT u.user_id, u.name, COUNT(b.booking_id) AS bookings, SUM(b.total_amount) AS spent
  FROM Users u JOIN Bookings b ON b.user_id = u.user_id AND b.status = 'confirmed'
  GROUP BY u.user_id ORDER BY spent DESC;

-- P2: sales, alerts, revenue per event
CREATE VIEW v_event_sales AS
  SELECT e.event_id, e.title, tt.name AS ticket_type, tt.total_quantity,
        tt.total_quantity - tt.available_quantity AS sold,
        tt.available_quantity,
        CASE WHEN tt.available_quantity = 0 THEN 'SOLD OUT'
              WHEN tt.available_quantity <= tt.total_quantity * 0.1 THEN 'NEARLY SOLD OUT'
              ELSE 'OK' END AS alert,
         (tt.total_quantity - tt.available_quantity) * tt.price AS revenue
  FROM Events e JOIN Ticket_Types tt ON tt.event_id = e.event_id;

-- P4: ratings and longest waitlist
CREATE VIEW v_event_ratings AS
  SELECT event_id, ROUND(AVG(rating),2) AS avg_rating, COUNT(*) AS reviews
  FROM Reviews GROUP BY event_id;

CREATE VIEW v_longest_waitlist AS
  SELECT e.title, tt.name AS ticket_type, COUNT(*) AS waiting
  FROM Waitlist w
  JOIN Ticket_Types tt ON tt.ticket_type_id = w.ticket_type_id
  JOIN Events e ON e.event_id = tt.event_id
  WHERE w.status = 'waiting'
  GROUP BY tt.ticket_type_id ORDER BY waiting DESC;

-- P3: search and filter example
-- SELECT e.* FROM Events e JOIN Venues v ON v.venue_id = e.venue_id
-- WHERE v.city = 'Ahmedabad' AND e.category_id = 2
--   AND e.event_date BETWEEN '2026-11-01' AND '2026-11-30' AND e.status = 'published';
