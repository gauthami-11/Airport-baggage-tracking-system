-- ============================================================
-- Airport Baggage Tracking System Migration Script
-- Purpose: Add Passenger Bookings & PNR Support without losing data
-- Database: baggage_tracking
-- ============================================================

USE baggage_tracking;

-- 1. Create passenger_bookings table if not exists
CREATE TABLE IF NOT EXISTS passenger_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pnr_number VARCHAR(20) NOT NULL UNIQUE,
    passenger_id INT NOT NULL,
    flight_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_passenger FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_flight FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON passenger_bookings(pnr_number);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON passenger_bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_flight_id ON passenger_bookings(flight_id);

-- 2. Add booking_id column to baggage table if not present
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'baggage' 
    AND COLUMN_NAME = 'booking_id'
);

SET @sql_add_col = IF(@col_exists = 0, 'ALTER TABLE baggage ADD COLUMN booking_id INT NULL AFTER tag_number', 'SELECT 1');
PREPARE stmt_add FROM @sql_add_col;
EXECUTE stmt_add;
DEALLOCATE PREPARE stmt_add;

-- 3. Populate passenger_bookings from existing baggage records
-- Seed realistic PNRs for existing passenger/flight pairs
INSERT IGNORE INTO passenger_bookings (pnr_number, passenger_id, flight_id)
SELECT 
    CASE 
        WHEN b.passenger_id = 3 AND b.flight_id = 1 THEN 'ABC123'
        WHEN b.passenger_id = 3 AND b.flight_id = 3 THEN 'XYZ789'
        WHEN b.passenger_id = 4 AND b.flight_id = 2 THEN 'DEL405'
        WHEN b.passenger_id = 4 AND b.flight_id = 3 THEN 'BLR210'
        ELSE CONCAT('PNR', LPAD(b.passenger_id * 100 + b.flight_id, 4, '0'))
    END AS pnr_number,
    b.passenger_id,
    b.flight_id
FROM baggage b
GROUP BY b.passenger_id, b.flight_id;

-- 4. Update baggage records with their new booking_id
UPDATE baggage b
JOIN passenger_bookings pb ON b.passenger_id = pb.passenger_id AND b.flight_id = pb.flight_id
SET b.booking_id = pb.id
WHERE b.booking_id IS NULL;

-- 5. Add index on booking_id
CREATE INDEX IF NOT EXISTS idx_baggage_booking_id ON baggage(booking_id);
