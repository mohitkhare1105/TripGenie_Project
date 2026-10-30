# TripGenie AI — REST API Documentation (FastAPI Backend)

This document provides complete technical specifications for the TripGenie AI backend API, covering request parameters, response envelopes, validation constraints, and error codes.

---

## 1. Base URL & Protocol

- **Development Port:** `http://localhost:8000`
- **Prefix:** `/api`
- **Envelope Standard:** All responses adhere to the unified envelope:
  ```json
  {
    "success": true,
    "message": "Descriptive status message",
    "data": { ... },
    "errors": null
  }
  ```

---

## 2. Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Unconditional service health & uptime probe |
| `GET` | `/api/health/database` | Public | Diagnostic database connectivity probe |
| `POST` | `/api/itineraries/generate` | Optional | Generate structured day-wise itinerary & budget |
| `POST` | `/api/itineraries/optimize-budget` | Optional | Propose lower-cost itinerary alternative |
| `GET` | `/api/users/me` | Bearer | Get authenticated user profile |
| `PUT` | `/api/users/me/profile` | Bearer | Update user profile fields |
| `GET` | `/api/users/me/preferences` | Bearer | Get user default travel preferences |
| `PUT` | `/api/users/me/preferences` | Bearer | Upsert user default travel preferences |
| `GET` | `/api/trips` | Bearer | List user's saved trips (paginated) |
| `POST` | `/api/trips` | Bearer | Persist a trip |
| `GET` | `/api/trips/{trip_id}` | Bearer | Retrieve trip details (user ownership enforced) |
| `PUT` | `/api/trips/{trip_id}` | Bearer | Update saved trip |
| `DELETE` | `/api/trips/{trip_id}` | Bearer | Delete saved trip |

---

## 3. Itinerary Endpoints

### 3.1 Generate Itinerary

- **Endpoint:** `POST /api/itineraries/generate`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>` (optional)

#### Request Body Schema (`ItineraryRequest`)
```json
{
  "destination": "Manali",
  "durationDays": 4,
  "budget": 25000,
  "travellers": 2,
  "travelStyle": "adventure",
  "startingCity": "Delhi",
  "interests": ["trekking", "nature"],
  "accommodationPreference": "budget",
  "transportPreference": "public transport",
  "dietaryPreferences": ["vegetarian"],
  "additionalNotes": "Prefer scenic walking routes."
}
```

#### Field Constraints:
- `destination`: String (1-100 characters). Required.
- `durationDays`: Integer (1-30 days). Required.
- `budget`: Numeric (1 to 10,000,000 INR). Required.
- `travellers`: Integer (1-50 travellers). Required.
- `travelStyle`: Enum: `adventure`, `relaxation`, `family`, `solo`, `culture`, `food`. Required.
- `startingCity`: String (1-100 characters). Optional.
- `interests`: Array of strings (up to 15 items, max 50 chars each). Optional.
- `accommodationPreference`: Enum: `budget`, `standard`, `comfort`. Optional.
- `transportPreference`: Enum: `public transport`, `walking`, `taxi`, `rental vehicle`. Optional.
- `dietaryPreferences`: Array of strings or string. Optional.
- Strict schema forbids unexpected properties.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Itinerary generated successfully",
  "data": {
    "trip": {
      "destination": "Manali",
      "durationDays": 4,
      "currency": "INR"
    },
    "days": [
      {
        "day": 1,
        "theme": "Arrival & Pine Valley Trails",
        "activities": [
          {
            "period": "morning",
            "title": "Hadimba Temple Forest Walk",
            "description": "Walk among ancient deodar cedar trees.",
            "category": "sightseeing",
            "durationMinutes": 90,
            "estimatedCost": 100,
            "costStatus": "ai_estimate",
            "pricingType": "per_person",
            "location": "Dhungri"
          }
        ]
      }
    ],
    "budget": {
      "currency": "INR",
      "userBudget": 25000,
      "categoryTotals": {
        "transport": 3000,
        "accommodation": 8000,
        "food": 5000,
        "activities": 2500,
        "shopping": 1500,
        "miscellaneous": 500
      },
      "estimatedTotal": 20500,
      "difference": 4500,
      "estimatedPerPerson": 10250,
      "status": "under_budget",
      "isComplete": true,
      "unestimatedCategories": [],
      "warning": null
    },
    "notes": ["Carry warm clothing for evening hours."]
  }
}
```

---

### 3.2 Smart Budget Optimizer

- **Endpoint:** `POST /api/itineraries/optimize-budget`
- **Purpose:** Proposes lower-cost activity, dining, and lodging alternatives while deterministically recalculating revised totals.

#### Request Body Schema (`OptimizeBudgetRequest`)
```json
{
  "itinerary": { ... },
  "userBudget": 18000,
  "travellers": 2,
  "travelStyle": "adventure",
  "interests": ["trekking"]
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Budget optimization completed",
  "data": {
    "originalBudget": { ... },
    "optimizedItinerary": { ... },
    "optimizedBudget": { ... },
    "savings": 2500,
    "achievedTarget": true,
    "tradeOffs": [
      "Swapped private taxi transfers for local scenic bus routes.",
      "Selected authentic local homestay accommodation."
    ]
  }
}
```

---

## 4. Error Responses

- **400 Bad Request (Validation):**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "data": null,
    "errors": [
      {
        "field": "destination",
        "message": "Destination cannot be empty",
        "type": "string_too_short"
      }
    ]
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Missing Authorization header with Bearer token",
    "data": null,
    "errors": null
  }
  ```

- **413 Payload Too Large:**
  ```json
  {
    "success": false,
    "message": "Request body exceeds size limit of 100 KB",
    "data": null,
    "errors": null
  }
  ```

- **429 Too Many Requests (In-Flight Debouncing):**
  ```json
  {
    "success": false,
    "message": "A request with the same parameters is currently in flight. Please wait for it to complete.",
    "data": null,
    "errors": null
  }
  ```

- **503 Service Unavailable (AI Provider Unconfigured):**
  ```json
  {
    "success": false,
    "message": "Groq AI service is not configured. Please set GROQ_API_KEY in environment.",
    "data": null,
    "errors": null
  }
  ```

---

## 5. Phase 4: Groq AI Provider Integration

TripGenie AI utilizes **Groq Cloud API** (`openai/gpt-oss-120b`) as its primary LLM provider for fast, structured itinerary generation and budget optimization via JSON mode.

### 5.1 Configuration
- `GROQ_API_KEY`: Groq Cloud API key (`gsk_...`)
- `GROQ_MODEL`: Model name (default: `openai/gpt-oss-120b`)
- `GROQ_TIMEOUT`: Request timeout in seconds (default: `30.0`)
- `GROQ_MAX_RETRIES`: Number of bounded retries for transient errors (default: `1`)

### 5.2 Provider-Independent Architecture
- `ItineraryProvider` abstract base class decouples LLM generation from application logic.
- Groq output is enforced via `response_format={"type": "json_object"}` and strictly validated against Pydantic `ItineraryResponse`.
- **Deterministic Budget Arithmetic:** Groq never calculates final financial totals; all cost calculations, category aggregation, and budget status assignments are executed deterministically on the backend via `BudgetService`.

---

## 6. Destination Images (Unsplash API)

- **Endpoint:** `GET /api/images/destination`
- **Query Parameters:**
  - `query` (string, required): Destination name (e.g., `"Goa, India"`).
  - `count` (integer, optional, default: 4): Number of images to retrieve (1–10).
- **Behavior:**
  - Calls Unsplash API securely server-side.
  - Automatically provides curated high-resolution photography fallbacks if `UNSPLASH_ACCESS_KEY` is omitted or API is unavailable.
  - Returns photographer attribution (`name`, `photographer_url`, `unsplash_url`).

