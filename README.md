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
  [users, flights, baggage, baggage_movements, incidents]
```

* **Frontend:** React 19, TypeScript, React Router, Tailwind CSS, Lucide React icons.
* **Backend:** Node.js, Express.js, TypeScript, bcrypt, jsonwebtoken, mysql2.
* **Database:** MySQL relational database with ACID transactions and foreign key cascades (includes zero-configuration persistent storage fallback for instant demo environments).

---

## 🚀 Application Routes

The application features exactly 7 core routes:

1. `/` — **Home:** Clean landing page with primary baggage tracking search and operational overview cards.
2. `/login` — **Passenger & Staff Login:** Centered login interface with credential switching and role-based redirect.
3. `/passenger/dashboard` — **Passenger Dashboard:** Overview of passenger flights, baggage counts, and active luggage status badges.
4. `/track` — **Track Baggage (Main Demo Page):** Real-time status lookup, large metadata card, and comprehensive vertical tracking timeline.
5. `/staff/dashboard` — **Staff Dashboard:** Information-dense operations overview with 5 live statistics cards, filtering, and searchable baggage table.
6. `/staff/update-baggage` — **Update Baggage:** Staff status modification form executing database transactions to record new movements and update luggage state.
7. `/staff/incidents` — **Incident Management:** Incident reporting form and live investigation tracking table.

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

# Seed initial flights, users, baggage, and movement histories
mysql -u root -p baggage_tracking < database/seed.sql
```

### 3. Configure Environment Variables
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

Sample baggage tags pre-seeded for testing:
* `BG10001` (Flight AI302 — IN TRANSIT / ARRIVED)
* `BG10002` (Flight AI302 — ARRIVED)
* `BG10003` (Flight AI405 — DELAYED)
* `BG10004` (Flight AI210 — CLAIMED)

---

## 📡 REST API Documentation

### 1. Authentication
* **POST `/api/auth/login`**
  * **Purpose:** Authenticate staff or passenger and issue JWT token.
  * **Auth:** Public
  * **Body:**
    ```json
    {
      "email": "staff@baggagetrack.com",
      "password": "staff123"
    }
    ```
  * **Response (200 OK):**
    ```json
    {
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 1,
        "name": "Airport Operations Staff",
        "email": "staff@baggagetrack.com",
        "role": "STAFF"
      }
    }
    ```

### 2. Baggage Lookup
* **GET `/api/baggage/:tagNumber`**
  * **Purpose:** Retrieve baggage details and linked flight information.
  * **Auth:** Public
  * **Response (200 OK):**
    ```json
    {
      "id": 1,
      "tag_number": "BG10001",
      "flight_number": "AI302",
      "origin": "Delhi Airport",
      "destination": "Mumbai Airport",
      "weight": 18.5,
      "status": "IN TRANSIT",
      "current_location": "Delhi Airport",
      "passenger_name": "Rahul Sharma"
    }
    ```

* **GET `/api/baggage/:tagNumber/movements`**
  * **Purpose:** Retrieve chronological tracking timeline for a baggage piece.
  * **Auth:** Public
  * **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "timestamp": "08:30",
        "status": "CHECKED IN",
        "location": "Delhi Airport",
        "remarks": "Checked in at Terminal 3 Counter B12"
      },
      {
        "id": 2,
        "timestamp": "08:42",
        "status": "SECURITY",
        "location": "Delhi Airport",
        "remarks": "Security screening passed at Inspection Bay 4"
      }
    ]
    ```

### 3. Operations & Baggage Management
* **GET `/api/baggage`**
  * **Purpose:** Retrieve all baggage records with search and status filtering.
  * **Auth:** Airport Staff
  * **Query Params:** `?status=IN%20TRANSIT&search=BG10001`
  * **Response (200 OK):** Array of baggage items.

* **GET `/api/baggage/statistics`**
  * **Purpose:** Aggregated baggage statistics calculated using SQL COUNT queries.
  * **Auth:** Airport Staff
  * **Response (200 OK):**
    ```json
    {
      "total": 1245,
      "inTransit": 320,
      "delayed": 14,
      "missing": 3,
      "claimed": 908
    }
    ```

* **POST `/api/baggage/:tagNumber/movements`**
  * **Purpose:** Update baggage status and insert new movement record in one database transaction.
  * **Auth:** Airport Staff
  * **Body:**
    ```json
    {
      "status": "ARRIVED",
      "location": "Delhi Airport",
      "remarks": "Baggage arrived successfully"
    }
    ```
  * **Response (200 OK):**
    ```json
    {
      "message": "Baggage status updated successfully.",
      "baggage": { ... },
      "movement": { ... }
    }
    ```

### 4. Incident Management
* **GET `/api/incidents`**
  * **Purpose:** Retrieve recent baggage incidents.
  * **Auth:** Airport Staff
  * **Query Params:** `?status=OPEN`
  * **Response (200 OK):** Array of incidents.

* **POST `/api/incidents`**
  * **Purpose:** Log a new baggage incident.
  * **Auth:** Airport Staff
  * **Body:**
    ```json
    {
      "baggageTag": "BG10001",
      "type": "DAMAGED BAGGAGE",
      "description": "Minor damage reported"
    }
    ```
  * **Response (201 Created):**
    ```json
    {
      "message": "Incident reported successfully.",
      "incident": { ... }
    }
    ```

### 5. Passenger Dashboard
* **GET `/api/passenger/dashboard`**
  * **Purpose:** Retrieve passenger profile, flight itineraries, and linked baggage.
  * **Auth:** Passenger
  * **Response (200 OK):** Passenger dashboard payload.

---

## 🎯 Final Demonstration Workflow

1. Open **Home** (`/`).
2. Enter tag `BG10001` and click **TRACK**.
3. View baggage information card and vertical movement timeline.
4. Click **Login** (`/login`) and authenticate as **Staff** (`staff@baggagetrack.com` / `staff123`).
5. In **Staff Dashboard**, inspect live operational statistics and table.
6. Navigate to **Update Baggage** (`/staff/update-baggage`).
7. Enter `BG10001`, select status `ARRIVED`, enter remarks, click **UPDATE**.
8. Notice database transaction confirmation.
9. Return to **Track Baggage** (`/track?tag=BG10001`) to see status is now `ARRIVED` and the new movement is appended to the timeline.
10. Navigate to **Incident Management** (`/staff/incidents`) and report an incident; refresh the browser and verify the incident persists.
