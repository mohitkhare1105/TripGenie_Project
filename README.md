# TripGenie AI — Personalized AI Travel Planner

**TripGenie AI** is a modern, full-stack AI-powered travel planning application that generates personalized, day-wise itineraries based on travel destination, duration, budget, number of travellers, travel style, and specific interests. 

The application integrates Google's official Gemini AI SDK (`@google/genai`) to generate structured day-by-day recommendations and couples this with deterministic backend calculation of financial totals, per-person costs, and category breakdowns.

---

## 1. Features

- **Personalized Day-Wise Timeline:** Daily itineraries structured into morning, afternoon, evening, and night activities with titles, durations, categories, descriptions, locations, and suggested times.
- **Server-Side Financial Accuracy:** Budget totals, category breakdowns (transport, accommodation, food, activities, shopping, miscellaneous), and per-person estimates are calculated strictly by backend application code rather than relying on LLM arithmetic.
- **Smart Budget Optimizer:** Interactive optimization workflow that proposes lower-cost local alternatives (e.g., swapping private taxis for local transit or resorts for homestays) while recalculating revised totals on the server.
- **Transparent Pricing Labels:** Clear disclaimers and status badges distinguishing AI planning estimates from live quotations (`under_budget`, `within_budget`, `over_budget`).
- **Strict Input & Output Validation:** Complete Zod schema validation on all incoming request bodies and outgoing AI responses with bounded repair mechanisms.
- **Enterprise-Grade Security:**
  - HTTP security headers via Helmet (`X-Content-Type-Options: nosniff`, hidden `X-Powered-By`).
  - Request tracing via `X-Request-ID`.
  - Configurable CORS origin restriction.
  - Rate limiting on expensive AI endpoints (`express-rate-limit`).
  - Request body size limits (100kb payload cap).
  - In-flight duplicate request debouncing.
  - Secret redaction in server diagnostic logs.
- **Responsive UI:** Modern React + Tailwind CSS interface supporting desktop, tablet, and mobile screen sizes.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript | Interactive, responsive user interface |
| **Styling** | Tailwind CSS, Lucide Icons | Utility-first modern UI components & iconography |
| **Backend** | Node.js, Express.js, TypeScript | REST API, middleware chain, and business logic |
| **AI Integration** | `@google/genai` (Gemini SDK) | Official Gemini model communication (`gemini-2.5-flash`) |
| **Validation** | Zod | Request sanitization and structured AI response validation |
| **Testing** | Node.js Test Runner, Supertest, tsx | 86 automated end-to-end and unit tests |
| **Security** | Helmet, express-rate-limit, CORS | Security headers, abuse prevention, origin control |

---

## 3. Project Structure

```text
TripGenie_Project/
├── Backend/
│   ├── src/
│   │   ├── app.ts                         # Express app, middleware configuration, routes
│   │   ├── server.ts                      # Server entry point & graceful shutdown
│   │   ├── routes/
│   │   │   └── itineraryRoutes.ts         # /api/itineraries route definitions
│   │   ├── controllers/
│   │   │   └── itineraryController.ts     # Generation & budget optimization handlers
│   │   ├── services/
│   │   │   ├── aiService.ts               # Gemini AI communication, retries, bounded repair
│   │   │   ├── budgetService.ts           # Deterministic financial calculations & accounting
│   │   │   └── budgetOptimizerService.ts  # Smart Budget Optimizer workflow
│   │   ├── schemas/
│   │   │   ├── itineraryRequest.ts        # Zod input validation schema
│   │   │   ├── itineraryResponse.ts       # Zod structured AI response schema
│   │   │   └── budgetSchema.ts            # Zod budget breakdown & optimizer schemas
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts            # Centralized error handler (400, 404, 413, 500, etc.)
│   │   │   ├── validateRequest.ts         # Zod body validation middleware
│   │   │   ├── rateLimiter.ts             # In-memory endpoint rate limiter
│   │   │   └── duplicateRequestPrevention.ts # In-flight request debouncing
│   │   ├── utils/
│   │   │   ├── promptBuilder.ts           # Prompt engineering & input sanitization
│   │   │   └── logger.ts                  # Diagnostic logger with secret redaction
│   │   └── tests/
│   │       ├── validation.test.ts         # Request validation test suite
│   │       ├── aiIntegration.test.ts      # Gemini AI integration test suite
│   │       ├── budget.test.ts             # Financial accounting & optimizer test suite
│   │       ├── security.test.ts           # Security headers, CORS, rate limits, 413 limits
│   │       └── e2eIntegration.test.ts     # End-to-end full journey test suite
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx                 # Header navigation & branding
│   │   │   ├── TravelForm.tsx             # Validated travel preference input form
│   │   │   ├── ItineraryDisplay.tsx       # Day timeline, periods, and safe text rendering
│   │   │   ├── BudgetSummary.tsx          # Expense metrics, category cards, warnings
│   │   │   ├── BudgetOptimizerModal.tsx   # Optimizer comparison & trade-offs modal
│   │   │   ├── LoadingState.tsx           # Animated loading tips during AI generation
│   │   │   └── ErrorBanner.tsx            # Contextual error alerts and retry trigger
│   │   ├── services/
│   │   │   └── api.ts                     # Frontend HTTP client & error mapping
│   │   ├── types/
│   │   │   └── index.ts                   # TypeScript interfaces matching backend schemas
│   │   ├── App.tsx                        # Main state container & UI workflow
│   │   ├── main.tsx                       # React application bootstrap
│   │   └── index.css                      # Tailwind CSS directives
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
├── features.md                            # Comprehensive functional specification
└── README.md                              # Full setup & deployment documentation
```

---

## 4. Prerequisites

- **Node.js:** v18.x or higher (v24.x tested and supported)
- **npm:** v9.x or higher
- **Gemini API Key:** An active key from [Google AI Studio](https://aistudio.google.com/)

---

## 5. Environment Configuration

### Backend Configuration (`Backend/.env`)

Copy the template:
```bash
cp Backend/.env.example Backend/.env
```

Configure your variables:
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=20
```

> **Security Note:** `GEMINI_API_KEY` is loaded exclusively on the backend server and is never committed to Git, returned in API responses, or exposed to browser bundles.

### Frontend Configuration (`Frontend/.env`)

Copy the template:
```bash
cp Frontend/.env.example Frontend/.env
```

Configure:
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 6. Installation & Local Development

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### Step 2: Run in Development Mode

Open two terminal sessions:

**Terminal 1 (Backend API Server):**
```bash
cd Backend
npm run dev
# Server runs at http://localhost:5000
```

**Terminal 2 (Frontend React App):**
```bash
cd Frontend
npm run dev
# Frontend runs at http://localhost:5173
```

Open your browser at `http://localhost:5173` to start planning trips!

---

## 7. Testing & Verification

The project includes 86 automated tests covering validation, AI integration, financial calculations, security, and full user journeys.

Run the test suite:
```bash
cd Backend
npm test
```

Run TypeScript type checks:
```bash
# Check backend
cd Backend
npm run typecheck

# Check frontend
cd ../Frontend
npm run typecheck
```

---

## 8. Python FastAPI Backend (Migration Phase 1)

As part of the Python + FastAPI migration, Phase 1 establishes the FastAPI backend foundation running side-by-side with the Express backend:

| Service | Port | Description |
|---|---|---|
| **Express Backend** | `5000` | Full legacy TypeScript backend (Parts 1–6) |
| **FastAPI Backend** | `8000` | Modular FastAPI backend foundation (Phase 1) |
| **React Frontend** | `5173` | Vite development server |

### Setup FastAPI Virtual Environment

```bash
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Running the FastAPI Backend

```bash
cd Backend

# Using the run script (runs on port 8000 by default):
python run.py

# Or directly using Uvicorn:
uvicorn app.main:app --port 8000 --reload
```

- **Health check endpoint:** `http://localhost:8000/api/health`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

### Running FastAPI Automated Tests

```bash
cd Backend

# Run verbose pytest suite:
python -m pytest -v

# Run short traceback pytest:
python -m pytest --tb=short
```

---

## 9. Production Build

To build both services for production:

```bash
# Build Backend (compiles TypeScript to Backend/dist)
cd Backend
npm run build

# Start Production Backend Server
npm start

# Build Frontend (optimizes bundle to Frontend/dist)
cd ../Frontend
npm run build

# Preview Frontend production build locally
npm run preview
```

---

## 9. API Documentation

### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Description:** Verifies server process uptime without consuming Gemini quota.
- **Response:**
  ```json
  {
    "success": true,
    "message": "TripGenie AI backend is running",
    "data": {
      "status": "healthy",
      "uptime": 120,
      "timestamp": "2026-10-30T07:00:00.000Z"
    }
  }
  ```

### 2. Generate Itinerary
- **Endpoint:** `POST /api/itineraries/generate`
- **Rate Limit:** 20 requests per 15 minutes per IP
- **Payload:**
  ```json
  {
    "destination": "Manali",
    "durationDays": 3,
    "budget": 10000,
    "travellers": 2,
    "travelStyle": "adventure",
    "interests": ["nature", "trekking", "local food"],
    "accommodationPreference": "budget",
    "transportPreference": "public transport"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Itinerary generated successfully",
    "data": {
      "trip": { "destination": "Manali", "durationDays": 3, "currency": "INR" },
      "days": [ ... ],
      "budget": {
        "currency": "INR",
        "userBudget": 10000,
        "categoryTotals": {
          "transport": 400,
          "accommodation": 2500,
          "food": 1200,
          "activities": 1800,
          "shopping": 1000,
          "miscellaneous": 0
        },
        "estimatedTotal": 6900,
        "difference": 3100,
        "estimatedPerPerson": 3450,
        "status": "under_budget",
        "isComplete": true
      },
      "notes": [ ... ]
    }
  }
  ```

### 3. Optimize Budget
- **Endpoint:** `POST /api/itineraries/optimize-budget`
- **Description:** Proposes lower-cost itinerary alternatives when costs exceed the target budget.
- **Payload:**
  ```json
  {
    "itinerary": { ... },
    "userBudget": 5000,
    "travellers": 2,
    "travelStyle": "adventure"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Budget optimization completed",
    "data": {
      "originalBudget": { ... },
      "optimizedItinerary": { ... },
      "optimizedBudget": { ... },
      "savings": 5200,
      "achievedTarget": true,
      "tradeOffs": [ ... ]
    }
  }
  ```

---

## 10. Deployment Instructions

Frontend and Backend can be deployed independently to modern cloud platforms:

### Backend Deployment (Render, Railway, or Google Cloud Run)
1. Set the root directory to `Backend`.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Configure environment variables in your platform dashboard:
   - `PORT=5000` (or platform default)
   - `NODE_ENV=production`
   - `CLIENT_ORIGIN=https://your-frontend-domain.com`
   - `GEMINI_API_KEY=your_gemini_api_key`
   - `GEMINI_MODEL=gemini-2.5-flash`

### Frontend Deployment (Vercel, Netlify, or Cloudflare Pages)
1. Set the root directory to `Frontend`.
2. Build command: `npm install && npm run build`
3. Output directory: `dist`
4. Set environment variable:
   - `VITE_API_BASE_URL=https://your-backend-api-domain.com`

---

## 11. Troubleshooting

- **CORS Error in Browser:**
  Ensure `CLIENT_ORIGIN` in `Backend/.env` matches the exact URL of your frontend (e.g., `http://localhost:5173`).
- **HTTP 429 Too Many Requests:**
  Rate limiting has triggered. Wait for the window to reset or adjust `RATE_LIMIT_MAX_REQUESTS` in `Backend/.env`.
- **HTTP 503 Missing Gemini API Key:**
  Verify that `GEMINI_API_KEY` is defined in `Backend/.env` and that the backend server was restarted after setting it.
- **HTTP 413 Payload Too Large:**
  The request exceeds the 100kb body limit. Reduce oversized custom notes or array lengths.
