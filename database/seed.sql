-- ============================================================
-- Airport Baggage Tracking System Seed Data
-- ============================================================

USE baggage_tracking;

-- 1. USERS
-- Passwords:
-- staff@baggagetrack.com -> staff123 ($2a$10$7vU0o3u5q0U6w30tD8V8seU40m7vMsqUoI4o7JvQy1dYw5tN.h2C2)
-- passenger@baggagetrack.com -> passenger123 ($2a$10$bIek6j2X4jPjO/vU8yX5yeEcfiI12RkY.bI0p5pXy1hS0hL1.9yvO)
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Airport Operations Staff', 'staff@baggagetrack.com', '$2a$10$7vU0o3u5q0U6w30tD8V8seU40m7vMsqUoI4o7JvQy1dYw5tN.h2C2', 'STAFF'),
(2, 'Rahul Sharma', 'passenger@baggagetrack.com', '$2a$10$bIek6j2X4jPjO/vU8yX5yeEcfiI12RkY.bI0p5pXy1hS0hL1.9yvO', 'PASSENGER'),
(3, 'Priya Patel', 'priya.patel@example.com', '$2a$10$bIek6j2X4jPjO/vU8yX5yeEcfiI12RkY.bI0p5pXy1hS0hL1.9yvO', 'PASSENGER');

-- 2. FLIGHTS
INSERT INTO flights (id, flight_number, origin, destination, departure_time, arrival_time, status) VALUES
(1, 'AI302', 'Delhi Airport', 'Mumbai Airport', '09:00', '11:10', 'DEPARTED'),
(2, 'AI405', 'Mumbai Airport', 'Delhi Airport', '10:00', '12:15', 'SCHEDULED'),
(3, 'AI210', 'Delhi Airport', 'Bangalore Airport', '08:30', '11:00', 'ARRIVED');

-- 3. BAGGAGE
INSERT INTO baggage (id, tag_number, flight_id, passenger_id, weight, status, current_location, updated_at) VALUES
(1, 'BG10001', 1, 2, 18.50, 'IN TRANSIT', 'Delhi Airport', NOW()),
(2, 'BG10002', 1, 2, 21.20, 'ARRIVED', 'Delhi Airport', NOW()),
(3, 'BG10003', 2, 3, 16.80, 'DELAYED', 'Mumbai Airport', NOW()),
(4, 'BG10004', 3, 2, 19.10, 'CLAIMED', 'Delhi Airport', NOW());

-- 4. BAGGAGE MOVEMENTS (Tracking History for BG10001)
INSERT INTO baggage_movements (baggage_id, timestamp, status, location, remarks) VALUES
(1, '08:30', 'CHECKED IN', 'Delhi Airport', 'Checked in at Terminal 3 Counter B12'),
(1, '08:42', 'SECURITY', 'Delhi Airport', 'Security screening passed at Inspection Bay 4'),
(1, '08:55', 'SORTED', 'Delhi Airport', 'Automated sorting completed to Cart 14'),
(1, '09:20', 'LOADED', 'Delhi Airport', 'Loaded into Boeing 777 cargo hold door 2'),
(1, '09:35', 'IN TRANSIT', 'Delhi Airport', 'Flight AI302 pushback and departure en route to Mumbai');

-- Movements for BG10002
INSERT INTO baggage_movements (baggage_id, timestamp, status, location, remarks) VALUES
(2, '07:15', 'CHECKED IN', 'Delhi Airport', 'Checked in at Terminal 3 Counter B14'),
(2, '07:35', 'SECURITY', 'Delhi Airport', 'Security screening cleared'),
(2, '08:10', 'SORTED', 'Delhi Airport', 'Sorted for flight AI302'),
(2, '08:50', 'LOADED', 'Delhi Airport', 'Loaded into front compartment'),
(2, '09:20', 'ARRIVED', 'Delhi Airport', 'Unloaded at carousel bay');

-- Movements for BG10003
INSERT INTO baggage_movements (baggage_id, timestamp, status, location, remarks) VALUES
(3, '08:15', 'CHECKED IN', 'Mumbai Airport', 'Checked in at Terminal 2'),
(3, '08:30', 'SECURITY', 'Mumbai Airport', 'Security clearance granted'),
(3, '09:05', 'DELAYED', 'Mumbai Airport', 'Flight connection delayed due to weather');

-- Movements for BG10004
INSERT INTO baggage_movements (baggage_id, timestamp, status, location, remarks) VALUES
(4, '06:30', 'CHECKED IN', 'Delhi Airport', 'Checked in at Counter A04'),
(4, '07:00', 'SECURITY', 'Delhi Airport', 'Security clearance verified'),
(4, '07:30', 'SORTED', 'Delhi Airport', 'Baggage sorting complete'),
(4, '08:00', 'LOADED', 'Delhi Airport', 'Loaded onto flight AI210'),
(4, '08:30', 'IN TRANSIT', 'Delhi Airport', 'En route to Bangalore'),
(4, '08:55', 'CLAIMED', 'Delhi Airport', 'Baggage claimed by passenger at Carousel 2');

-- 5. INCIDENTS
INSERT INTO incidents (id, baggage_id, reported_by, type, description, status) VALUES
(1, 1, 1, 'DAMAGED BAGGAGE', 'Minor scratch and zipper tear reported on outer pocket', 'OPEN'),
(2, 3, 1, 'DELAYED', 'Baggage missed connection transfer due to tight turnaround', 'INVESTIGATING');
