# ✈ BaggageTrack — Airport Baggage Tracking System

A modern, responsive web application used by airport passengers and airport operations staff to track baggage throughout its journey from check-in counter to arrival carousel.

---

## 🛠 System Architecture

```
React (TypeScript + Vite + Tailwind CSS + Lucide React)
                           │
                           ▼ (REST APIs)
    Node.js + Express.js + TypeScript (server.ts)
                           │
                           ▼
          MySQL Database (baggage_tracking)
   [users, flights, passenger_bookings, baggage, baggage_movements, incidents]
```

* **Frontend:** React 19, TypeScript, React Router, Tailwind CSS, Lucide React icons.
* **Backend:** Node.js, Express.js, TypeScript, bcrypt, jsonwebtoken, mysql2.
* **Database:** MySQL relational database with ACID transactions, foreign keys, and indexes (includes zero-configuration simulated relational store fallback for instant preview).

---

## 🚀 Application Routes

The application features 9 core routes:

1. `/` — **Home:** Landing page with dual baggage tracking search (by Tag barcode or PNR) and operational overview.
2. `/login` — **Passenger & Staff Login:** Centered login interface with credential switching and role-based redirect.
3. `/passenger/dashboard` — **Passenger Dashboard:** Overview of passenger flights, PNR booking references, and active checked baggage.
4. `/passenger/report-issue` — **Passenger Report Issue:** Dedicated passenger form to file delayed, damaged, or missing baggage claims directly into airport operations.
5. `/track` — **Track Baggage (Main Demo Page):** Real-time status lookup supporting both **Baggage Tag** and **PNR Booking Number** search modes with complete vertical movement timeline.
6. `/staff/dashboard` — **Staff Dashboard:** Information-dense operations overview with 5 live statistics cards, filtering, PNR references, and searchable baggage table.
7. `/staff/add-baggage` — **Register New Baggage:** Staff registration form to check-in new luggage with PNR association and initial movement tracking.
8. `/staff/update-baggage` — **Update Baggage:** Staff status modification form executing database transactions to record new movements and update luggage state.
9. `/staff/incidents` — **Incident Management:** Incident reporting form and live investigation tracking table.

---

## 📦 Database Setup (MySQL)

### 1. Create MySQL Database
```bash
CREATE DATABASE baggage_tracking;
```

### 2. Run Schema & Seed Scripts
```bash
# Apply schema (tables, foreign keys, and indexes)
mysql -u root -p baggage_tracking < database/schema.sql

# Seed initial flights, users, PNR bookings, baggage, and movement histories
mysql -u root -p baggage_tracking < database/seed.sql
```

### 3. Migrating an Existing Database to PNR Architecture
If you have an existing `baggage_tracking` database with data you wish to preserve, run the migration script:
```bash
mysql -u root -p baggage_tracking < database/migration_pnr.sql
```
This script creates `passenger_bookings`, links existing baggage items via `booking_id`, and safely updates foreign keys without data loss.

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=3000
VITE_API_URL="/api"
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD="your_password"
DB_NAME="baggage_tracking"
JWT_SECRET="baggagetrack_super_secret_jwt_key_2026"
```

---

## 🔑 Demo Credentials

| Role | User Name | Email | Password | Initial Redirect |
|---|---|---|---|---|
| **Passenger** | **Godwin** | `godwin@baggagetrack.com` | `passenger123` | `/passenger/dashboard` |
| **Airport Staff** | **Anu** | `anu@baggagetrack.com` | `staff123` | `/staff/dashboard` |
| **Airport Staff** | **Gauthami** | `gauthami@baggagetrack.com` | `staff123` | `/staff/dashboard` |

*(Generic aliases `passenger@baggagetrack.com` and `staff@baggagetrack.com` are also supported for quick login).*

Sample demo PNRs and baggage tags:
* **PNR `ABC123`** (Passenger: Godwin, Flight: AI302) — Linked to baggage `BG10001`, `BG10002`, `BG10005`
* **PNR `XYZ789`** (Passenger: Godwin, Flight: AI210) — Linked to baggage `BG10004`
* **PNR `DEL405`** (Passenger: Priya Patel, Flight: AI405) — Linked to baggage `BG10003`, `BG10006`
* **PNR `BLR210`** (Passenger: Priya Patel, Flight: AI210) — Linked to baggage `BG10007`

---

## 📡 REST API Documentation

### 1. Authentication
* **POST `/api/auth/login`**
  * **Auth:** Public
  * **Body:** `{"email": "anu@baggagetrack.com", "password": "staff123"}`
  * **Response:** Returns JWT token and user profile object.

### 2. Baggage Registration & Management
* **POST `/api/baggage`**
  * **Purpose:** Register a new baggage item and create its initial movement record in a single database transaction.
  * **Auth:** Staff Only (`STAFF` role)
  * **Body:**
    ```json
    {
      "tagNumber": "BG10008",
      "pnrNumber": "ABC123",
      "passengerName": "Godwin",
      "flightNumber": "AI302",
      "weight": 18.5,
      "status": "CHECKED IN",
      "currentLocation": "Delhi Airport - Terminal 3",
      "remarks": "Registered at baggage check-in counter"
    }
    ```
  * **Response (201 Created):**
    ```json
    {
      "message": "Baggage registered successfully.",
      "tagNumber": "BG10008",
      "pnrNumber": "ABC123",
      "baggage": { ... }
    }
    ```

* **GET `/api/baggage`**
  * **Purpose:** Retrieve all baggage records with search and status filtering.
  * **Auth:** Staff Only
  * **Query Params:** `?status=IN%20TRANSIT&search=BG10001`

* **GET `/api/baggage/statistics`**
  * **Purpose:** Live non-hardcoded counts of Total, In Transit, Delayed, Missing, and Claimed bags.
  * **Auth:** Staff Only

* **POST `/api/baggage/:tagNumber/movements`**
  * **Purpose:** Update baggage status and append a new milestone in a single transaction.
  * **Auth:** Staff Only

### 3. PNR Bookings & Flight Itineraries
* **GET `/api/bookings/:pnrNumber/baggage`**
  * **Purpose:** Retrieve all baggage items linked to a booking reference along with passenger and flight details.
  * **Auth:** Public
  * **Response (200 OK):**
    ```json
    {
      "pnr_number": "ABC123",
      "booking_id": 1,
      "passenger_name": "Godwin",
      "flight_number": "AI302",
      "origin": "Delhi Airport",
      "destination": "Mumbai Airport",
      "baggage": [
        { "tag_number": "BG10001", "weight": 18.5, "status": "IN TRANSIT", ... },
        { "tag_number": "BG10002", "weight": 21.2, "status": "ARRIVED", ... }
      ]
    }
    ```

* **GET `/api/flights`**
  * **Purpose:** Retrieve active airline flights for dropdown selection during baggage registration.
  * **Auth:** Public / Authenticated

### 4. Baggage Tracking & Public Lookup
* **GET `/api/baggage/:tagNumber`**
  * **Purpose:** Retrieve single baggage record with PNR reference and flight details.
  * **Auth:** Public

* **GET `/api/baggage/:tagNumber/movements`**
  * **Purpose:** Retrieve full chronological tracking milestones for a baggage tag.
  * **Auth:** Public

### 5. Passenger Dashboard
* **GET `/api/passenger/dashboard`**
  * **Purpose:** Retrieve live flights, bookings, and baggage for the authenticated passenger.
  * **Auth:** Passenger (`PASSENGER` role)

---

## 🎯 Key User Workflows

### Staff Baggage Registration Workflow
1. Log in as staff using Anu (`anu@baggagetrack.com` / `staff123`).
2. Click **Add Baggage** in the sidebar or from the Staff Dashboard header.
3. Enter Tag Number (e.g. `BG10012`), PNR (e.g. `ABC123`), select Flight, enter Weight, and click **REGISTER BAGGAGE**.
4. The system validates the input, ensures tag uniqueness, attaches the luggage to the PNR booking, records the initial movement milestone in a transaction, and displays a success notification with direct actions.
5. Click **View in Track Baggage** to immediately inspect the live tracking timeline for the new luggage piece.

### PNR-Based Passenger Tracking Workflow
1. Open Track Baggage (`/track`).
2. Toggle to **By PNR Booking**.
3. Enter PNR `ABC123` (or click one of the demo chips).
4. View the booking summary, flight itinerary, and all bags under that PNR.
5. Click any individual baggage card to inspect its full vertical milestone journey.
