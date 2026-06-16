# 🌱 Climeo - Intelligent Carbon DNA Tracker & AI Eco Coach

Climeo is a premium, progressive web application (PWA) designed to analyze, track, and simulate your digital green twin. Powered by a backend Groq AI proxy and a local prediction service, Climeo maps out your Carbon DNA and coaches you towards a sustainable future.

---

## Chosen Vertical

**Sustainability and climate action assistant.** Climeo is designed for students, professionals, and households who want practical guidance for reducing daily carbon impact without reading complex sustainability reports.

## Approach and Logic

Climeo first builds a user context through onboarding: travel distance, commute mode, diet, AC usage, shopping frequency, and yearly flights. That profile is converted into an Eco Score, annual footprint estimate, and Carbon DNA category breakdown.

After onboarding, the app uses three decision layers:

*   **Rule-based carbon engines** calculate emissions and savings from user inputs with deterministic category factors.
*   **Context-aware AI coaching** sends recent activity, Eco Score, goals, and streak data to the Flask `/api/chat` proxy so the browser never directly calls Groq.
*   **Prediction logic** estimates next-month emissions from category totals. If a trained Random Forest model is generated locally, the service uses it; otherwise it falls back to a lightweight deterministic estimator so the app remains usable without storing a large model artifact in Git.

## Assumptions Made

*   Emission factors are simplified educational estimates, not certified carbon accounting values.
*   Supabase is used for authentication, profiles, activity logs, challenge progress, and leaderboard data.
*   The repository intentionally excludes generated model binaries to keep the public submission below the 10 MB limit.
*   Groq and Supabase credentials are supplied through local `.env` files and are not committed.

---

## 🚀 Key Features

*   **5-Screen Carbon DNA Onboarding**: A tactile lifestyle survey measuring Transport, Diet, AC Usage, Shopping, and Flights. Computes your starting **Eco Score (1-100)**, **Annual Footprint (Tons CO₂)**, and **Carbon DNA Breakdown**.
*   **AI Coach Conversational Assistant**: Chat with your virtual eco-coach powered by Llama 3.3 through a Flask proxy for real-time actionable feedback based on your profile and logs.
*   **Slider-Based Quick Action Logging**: Log daily green actions (Transit, Diet, Power) with premium glassmorphic sliders. Displays a comparative real-time carbon bar graph against a standard Gas SUV/Beef baseline, and awards an **SUV Kilometer Avoidance** equivalency badge.
*   **Carbon Twin Simulator**: An interactive playground letting you simulate changes in your weekly driving, meat meals, AC usage, and shopping habits to predict annual CO₂ and weekly financial savings.
*   **Automated Challenges & Live Leaderboard**: Earn Eco Score XP through active logs. Commuting green, eating plant-based, and saving power automatically unlock database challenges, updating a global community leaderboard queried live from Supabase.
*   **PWA Installability**: Full offline-first caching via a service worker and locked standalone viewports for a native iOS/Android look and feel.
*   **Auditable Black & White PDF Export**: Generate structured, clean sustainability audit documentation for your records via jsPDF.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19 (TypeScript), Vite, Tailwind CSS V4, Lucide Icons, jsPDF.
*   **Backend & DB**: Supabase (PostgreSQL with RLS, Auth, Migrations, Storage Buckets).
*   **AI Engine**: Flask-proxied Groq API (Llama 3.3-70b-versatile model).
*   **Machine Learning**: Flask (Python 3), optional Scikit-Learn Random Forest Regression, Supabase-py.

---

## 📁 Repository Structure

*   `/src`: Frontend source code containing components, router, hooks, and pages.
    *   `/pages`: `Dashboard`, `Onboarding`, `Impact`, `AICoach`, `ActivityTracker`, `Simulator`, `Challenges`, `Community`, `Profile`.
    *   `/context`: `AppContext.tsx` managing Supabase connections, user state, and challenge updates.
    *   `/lib`: `groq.ts` and `supabase.ts` SDK clients.
*   `/public`: PWA assets (`manifest.json`, `sw.js` cache worker, icons).
*   `/ml-service`: Flask backend for forecasting user emissions.
    *   `app.py`: REST endpoints for AI chat, AI recommendations, and footprint predictions.
    *   `predict.py`: User footprint aggregation queries and prediction model.
    *   `train_model.py`: Script to train and save the regression model.
*   `/supabase`: Local database SQL schemas, storage configs, and seed files.

---

## ⚙️ Setup & Installation

### 1. Database Configuration (Supabase)
Create a Supabase project and execute the SQL schemas located in `/supabase/migrations`:
1. Apply the main schema migration:
   ```sql
   -- Run 20260611000000_eco_pulse_v2.sql in your Supabase SQL editor
   ```
2. Make sure RLS is configured for tables: `profiles`, `activities`, `carbon_calculations`, `predictions`, `challenges`, `user_challenges`.
3. Set up the avatar storage bucket under `storage.avatars` and apply bucket policies.

### 2. Frontend Configuration
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

### 3. Machine Learning Flask Service Setup
1. Navigate to the `/ml-service` directory:
   ```bash
   cd ml-service
   ```
2. Install python dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```
3. Create a `.env` in the repository root containing backend credentials:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-service-role-key
   GROQ_API_KEY=your-groq-api-key
   ```
4. Run the Flask application (runs on port `5001`):
   ```bash
   python3 app.py
   ```

---

## 📈 ML Forecasting Engine

The prediction route `/api/predict` receives the user's current footprint breakdown by category (`transport`, `food`, `energy`, `shopping`, `waste`) and returns a next-month estimate.

*   If `ml-service/models/rf_carbon_model.pkl` exists locally, the service uses the trained Random Forest model.
*   If the model artifact is not present, the service uses a deterministic weighted estimator to keep the submission lightweight and functional.
*   To regenerate the optional model artifact locally, run `python3 train_model.py` inside `/ml-service`.

---

## Testing and Validation

The project includes unit and integration tests for calculation engines, AI proxy helpers, app context behavior, and key pages.

```bash
npm run lint
npm test
npm run test:coverage
npm run build
```

---

## Security and Accessibility

*   AI requests go through Flask proxy routes instead of exposing the Groq key in browser code.
*   Supabase credentials and Groq secrets are loaded from local environment variables.
*   Supabase migrations enable row-level security for user-owned data.
*   Primary icon-only navigation and action buttons include accessible labels.

---

## 📳 Progressive Web App (PWA)

Climeo can be installed directly from Google Chrome or iOS Safari.
*   **Network-First Caching**: Service worker registers and caches app resources for fast local loading.
*   **Viewport Lock**: locked viewport status bar meta tags (`black-translucent`, `user-scalable=no`) to lock horizontal layout scales and preserve a native app feel.
