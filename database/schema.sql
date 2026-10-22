-- ============================================================
-- Airport Baggage Tracking System Database Schema
-- Database: baggage_tracking
-- ============================================================

CREATE DATABASE IF NOT EXISTS baggage_tracking;
USE baggage_tracking;

-- 1. DROP EXISTING TABLES IN REVERSE ORDER OF DEPENDENCY
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS baggage_movements;
DROP TABLE IF EXISTS baggage;
DROP TABLE IF EXISTS passenger_bookings;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS users;

-- 2. USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('PASSENGER', 'STAFF') NOT NULL DEFAULT 'PASSENGER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. FLIGHTS TABLE
CREATE TABLE flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL UNIQUE,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departure_time VARCHAR(20) NOT NULL,
    arrival_time VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PASSENGER BOOKINGS (PNR) TABLE
CREATE TABLE passenger_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pnr_number VARCHAR(20) NOT NULL UNIQUE,
    passenger_id INT NOT NULL,
    flight_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_passenger FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_flight FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_bookings_pnr ON passenger_bookings(pnr_number);
CREATE INDEX idx_bookings_passenger_id ON passenger_bookings(passenger_id);
CREATE INDEX idx_bookings_flight_id ON passenger_bookings(flight_id);

-- 5. BAGGAGE TABLE
CREATE TABLE baggage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag_number VARCHAR(50) NOT NULL UNIQUE,
    booking_id INT NOT NULL,
    flight_id INT NOT NULL,
    passenger_id INT NOT NULL,
    weight DECIMAL(5, 2) NOT NULL,
    status ENUM(
        'CHECKED IN',
        'SECURITY',
        'SORTED',
        'LOADED',
        'IN TRANSIT',
        'ARRIVED',
        'DELAYED',
        'MISSING',
        'CLAIMED'
    ) NOT NULL DEFAULT 'CHECKED IN',
    current_location VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_baggage_booking FOREIGN KEY (booking_id) REFERENCES passenger_bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_baggage_flight FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
    CONSTRAINT fk_baggage_passenger FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_baggage_tag_number ON baggage(tag_number);
CREATE INDEX idx_baggage_booking_id ON baggage(booking_id);
CREATE INDEX idx_baggage_status ON baggage(status);
CREATE INDEX idx_baggage_flight_id ON baggage(flight_id);
CREATE INDEX idx_baggage_passenger_id ON baggage(passenger_id);

-- 6. BAGGAGE MOVEMENTS TABLE
CREATE TABLE baggage_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    baggage_id INT NOT NULL,
    timestamp VARCHAR(50) NOT NULL,
    status ENUM(
        'CHECKED IN',
        'SECURITY',
        'SORTED',
        'LOADED',
        'IN TRANSIT',
        'ARRIVED',
        'DELAYED',
        'MISSING',
        'CLAIMED'
    ) NOT NULL,
    location VARCHAR(150) NOT NULL,
    remarks TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movements_baggage FOREIGN KEY (baggage_id) REFERENCES baggage(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_movements_baggage_id ON baggage_movements(baggage_id);

-- 7. INCIDENTS TABLE
CREATE TABLE incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    baggage_id INT NOT NULL,
    reported_by INT NOT NULL,
    type ENUM(
        'DAMAGED BAGGAGE',
        'DELAYED',
        'MISSING',
        'WRONG DESTINATION',
        'SECURITY ISSUE',
        'OTHER'
    ) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('OPEN', 'INVESTIGATING', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_incidents_baggage FOREIGN KEY (baggage_id) REFERENCES baggage(id) ON DELETE CASCADE,
    CONSTRAINT fk_incidents_user FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_incidents_baggage_id ON incidents(baggage_id);
CREATE INDEX idx_incidents_status ON incidents(status);
