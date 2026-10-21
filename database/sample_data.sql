-- sample_data.sql
-- Demo data for the Event Booking project (MySQL).
-- Run AFTER event_booking_schema_hybrid.sql, on EMPTY tables, with your database selected.
-- ALL sample users have the password:  password123
-- Dates are relative to NOW(), so the data stays valid whenever you run it.

-- (Optional reset. Only on a database nobody else is using, because it deletes everything.)
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE Reviews; TRUNCATE Waitlist; TRUNCATE Payments; TRUNCATE Booking_Items;
-- TRUNCATE Bookings; TRUNCATE Ticket_Types; TRUNCATE Events; TRUNCATE Categories;
-- TRUNCATE Venues; TRUNCATE Users;
-- SET FOREIGN_KEY_CHECKS = 1;
USE event_booking;
-- ============ USERS (1 admin, 2 organizers, 3 customers, 1 blocked customer) ============
INSERT INTO Users (user_id, name, email, password_hash, phone, city, role, status) VALUES
(1, 'Admin Aarav',    'admin@events.com',     '83b8bab9e3f32ef03e7b8d248b8393bc$75b766ecf26f0e680410d2cc32a0bcb976a0d8540ad3af5910d2d7ba08d220e1', '9000000001', 'Ahmedabad', 'admin',     'active'),
(2, 'Organizer Meera', 'meera@events.com',    '83b8bab9e3f32ef03e7b8d248b8393bc$75b766ecf26f0e680410d2cc32a0bcb976a0d8540ad3af5910d2d7ba08d220e1', '9000000002', 'Ahmedabad', 'organizer', 'active'),
(3, 'Organizer Kabir', 'kabir@events.com',    '83b8bab9e3f32ef03e7b8d248b8393bc$75b766ecf26f0e680410d2cc32a0bcb976a0d8540ad3af5910d2d7ba08d220e1', '9000000003', 'Mumbai',    'organizer', 'active'),
(4, 'Riya Shah',       'riya@example.com',    '83b8bab9e3f32ef03e7b8d248b8393bc$75b766ecf26f0e680410d2cc32a0bcb976a0d8540ad3af5910d2d7ba08d220e1', '9000000004', 'Ahmedabad', 'customer',  'active'),
(5, 'Aman Patel',      'aman@example.com',    '83b8bab9e3f32ef03e7b8d248b8393bc$75b766ecf26f0e680410d2cc32a0bcb976a0d8540ad3af5910d2d7ba08d220e1', '9000000005', 'Surat',     'customer',  'active'),
(6, 'Neha Joshi',      'neha@example.com',    '83b8bab9e3f32ef03e7b8d248b8393bc$75b766ecf26f0e680410d2cc32a0bcb976a0d8540ad3af5910d2d7ba08d220e1', '9000000006', 'Mumbai',    'customer',  'active'),
(7, 'Blocked Bob',     'bob@example.com',     '83b8bab9e3f32ef03e7b8d248b8393bc$75b766ecf26f0e680410d2cc32a0bcb976a0d8540ad3af5910d2d7ba08d220e1', '9000000007', 'Surat',     'customer',  'blocked');

-- ============ VENUES ============
INSERT INTO Venues (venue_id, name, city, address, capacity) VALUES
(1, 'Riverfront Hall',        'Ahmedabad', 'Sabarmati Riverfront, Ahmedabad', 500),
(2, 'City Auditorium',        'Surat',     'Athwa Lines, Surat',             300),
(3, 'Mumbai Convention Centre','Mumbai',   'Bandra Kurla Complex, Mumbai',  1000);

-- ============ CATEGORIES ============
INSERT INTO Categories (category_id, name) VALUES
(1, 'Music'),
(2, 'Comedy'),
(3, 'Technology');

-- ============ EVENTS ============
-- Events 1-3 are upcoming, event 4 is in the past (for reviews), event 5 is a draft (hidden from search)
INSERT INTO Events (event_id, organizer_id, venue_id, category_id, title, description, event_date, status) VALUES
(1, 2, 1, 1, 'Rock Night Live',       'An electric night of live rock music.',        DATE_ADD(NOW(), INTERVAL 14 DAY), 'published'),
(2, 2, 2, 2, 'Stand-up Comedy Evening','Five comedians, one hilarious night.',         DATE_ADD(NOW(), INTERVAL 21 DAY), 'published'),
(3, 3, 3, 3, 'Tech Conference 2026',  'Talks and workshops on AI and web.',            DATE_ADD(NOW(), INTERVAL 40 DAY), 'published'),
(4, 2, 1, 1, 'Jazz Evening',          'A relaxed evening of live jazz.',               DATE_SUB(NOW(), INTERVAL 30 DAY), 'completed'),
(5, 3, 3, 3, 'Startup Meetup (draft)','Not announced yet.',                            DATE_ADD(NOW(), INTERVAL 60 DAY), 'draft');

-- ============ TICKET TYPES ============
-- available_quantity starts equal to total; it is corrected at the very end from the bookings.
INSERT INTO Ticket_Types (ticket_type_id, event_id, name, price, total_quantity, available_quantity) VALUES
(1, 1, 'General',   500.00, 100, 100),
(2, 1, 'VIP',      1500.00,  20,  20),
(3, 2, 'General',   300.00,  80,  80),
(4, 2, 'Front Row', 800.00,   2,   2),   -- tiny on purpose: becomes SOLD OUT, good for waitlist testing
(5, 3, 'Standard', 1000.00, 200, 200),
(6, 3, 'Student',   250.00,  50,  50),
(7, 4, 'General',   400.00,  50,  50);

-- ============ BOOKINGS ============
INSERT INTO Bookings (booking_id, user_id, booking_date, total_amount, status) VALUES
(1, 4, DATE_SUB(NOW(), INTERVAL 3 DAY),  1000.00, 'confirmed'),   -- Riya: 2 General for Rock Night
(2, 5, DATE_SUB(NOW(), INTERVAL 2 DAY),  1600.00, 'confirmed'),   -- Aman: 2 Front Row (sells out)
(3, 6, DATE_SUB(NOW(), INTERVAL 1 DAY),  2000.00, 'confirmed'),   -- Neha: 1 General + 1 VIP
(4, 4, DATE_SUB(NOW(), INTERVAL 5 DAY),  3000.00, 'cancelled'),   -- Riya: cancelled booking (refunded)
(5, 4, DATE_SUB(NOW(), INTERVAL 40 DAY),  800.00, 'confirmed'),   -- Riya: attended Jazz Evening
(6, 5, DATE_SUB(NOW(), INTERVAL 40 DAY),  400.00, 'confirmed');   -- Aman: attended Jazz Evening

-- ============ BOOKING ITEMS (unit_price = price frozen at booking time) ============
INSERT INTO Booking_Items (item_id, booking_id, ticket_type_id, quantity, unit_price) VALUES
(1, 1, 1, 2,  500.00),
(2, 2, 4, 2,  800.00),
(3, 3, 1, 1,  500.00),
(4, 3, 2, 1, 1500.00),
(5, 4, 5, 3, 1000.00),
(6, 5, 7, 2,  400.00),
(7, 6, 7, 1,  400.00);

-- ============ PAYMENTS ============
INSERT INTO Payments (payment_id, booking_id, amount, method, status, paid_at, refunded_at) VALUES
(1, 1, 1000.00, 'upi',  'success',  DATE_SUB(NOW(), INTERVAL 3 DAY),  NULL),
(2, 2, 1600.00, 'card', 'success',  DATE_SUB(NOW(), INTERVAL 2 DAY),  NULL),
(3, 3, 2000.00, 'card', 'success',  DATE_SUB(NOW(), INTERVAL 1 DAY),  NULL),
(4, 4, 3000.00, 'upi',  'refunded', DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, 5,  800.00, 'upi',  'success',  DATE_SUB(NOW(), INTERVAL 40 DAY), NULL),
(6, 6,  400.00, 'wallet','success', DATE_SUB(NOW(), INTERVAL 40 DAY), NULL);

-- ============ WAITLIST (Front Row is sold out, two people are waiting) ============
INSERT INTO Waitlist (waitlist_id, user_id, ticket_type_id, quantity, joined_at, status) VALUES
(1, 6, 4, 1, DATE_SUB(NOW(), INTERVAL 5 HOUR), 'waiting'),   -- Neha joined first
(2, 4, 4, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'waiting');   -- Riya joined later

-- ============ REVIEWS (only for the past event, by people who attended) ============
INSERT INTO Reviews (review_id, user_id, event_id, rating, comment, created_at) VALUES
(1, 4, 4, 5, 'Wonderful music and a great atmosphere.', DATE_SUB(NOW(), INTERVAL 28 DAY)),
(2, 5, 4, 4, 'Really enjoyed it, the seating could be better.', DATE_SUB(NOW(), INTERVAL 27 DAY));

-- ============ FIX STOCK: available = total - tickets in CONFIRMED bookings ============
-- (WHERE ticket_type_id > 0 keeps MySQL Workbench "safe update mode" happy)
UPDATE Ticket_Types tt
SET available_quantity = total_quantity - COALESCE((
    SELECT SUM(bi.quantity)
    FROM Booking_Items bi
    JOIN Bookings b ON b.booking_id = bi.booking_id
    WHERE bi.ticket_type_id = tt.ticket_type_id AND b.status = 'confirmed'
), 0)
WHERE tt.ticket_type_id > 0;

-- ============ QUICK CHECKS (run these after the script) ============
-- SELECT ticket_type_id, name, total_quantity, available_quantity FROM Ticket_Types;
--   expected available: 1=97, 2=19, 3=80, 4=0, 5=200, 6=50, 7=47
-- SELECT * FROM v_event_sales;
-- SELECT * FROM v_longest_waitlist;
-- SELECT * FROM v_event_ratings;
