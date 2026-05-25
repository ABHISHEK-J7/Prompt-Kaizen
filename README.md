# Prompt Kaizen — Prompt Engineering Compatibility Analyzer

A complete MERN application that helps users evaluate and improve their prompts. Users describe a real-world scenario and the prompt they wrote for it — Prompt Kaizen scores compatibility across 10 parameters, points out what's missing, and generates an improved version.

This repo contains **three independent apps**:

```
Prompt Kaizen/
├── Prompt Kaizen Backend/    # Node.js + Express + MongoDB + JWT  (port 5000)
├── Prompt Kaizen Frontend/   # User-facing app (Vite + React + Tailwind)  (port 5173)
└── Prompt Kaizen Admin/      # Admin-only app  (Vite + React + Tailwind)  (port 5174)
```

The backend exposes a single API consumed by both the user and admin clients. Admin functionality is **entirely** in the Admin app (the user app has no admin pages).

---

## 1. Prerequisites

- Node.js **18+** and npm
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or any reachable MongoDB URI)

---

## 2. Backend — `Prompt Kaizen Backend`

### Install & configure

```bash
cd "Prompt Kaizen Backend"
npm install
```

`.env` is already created with sensible defaults:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/prompt_kaizen
JWT_SECRET=dev_super_secret_change_me_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173,http://localhost:5174
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@promptkaizen.local
ADMIN_PASSWORD=ChangeMe123!
```

> `CLIENT_URL` accepts a comma-separated list — that's why both the user app (5173) and admin app (5174) are allowed by CORS.

### Run

```bash
npm run dev    # nodemon (auto-restart)
# or
npm start      # node server.js
```

Backend listens on **http://localhost:5000**. Health check: `GET /api/health`.

> Note: on macOS, port 5000 is also used by AirPlay Receiver by default. If you get `EADDRINUSE`, free port 5000 via System Settings → General → AirDrop & Handoff → AirPlay Receiver = Off. (You can also temporarily switch back to another port like `PORT=5001` in `.env`.)

### Create the first admin user

```bash
npm run seed:admin
```

This reads `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` from `.env` and:
- creates the user if it doesn't exist, **or**
- promotes the existing user to `role: 'admin'` (set `ADMIN_RESET_PASSWORD=true` in the env to also reset the password)

Default admin credentials (please change in `.env` for production):
- Email: `admin@promptkaizen.local`
- Password: `ChangeMe123!`

---

## 3. User Frontend — `Prompt Kaizen Frontend`

```bash
cd "Prompt Kaizen Frontend"
npm install
npm run dev
```

App runs on **http://localhost:5173**. `.env` already points to the backend at `http://localhost:5000/api`.

Pages:

- `/` — Landing
- `/register`, `/login`
- `/dashboard` — totals, averages, trend, category breakdown, parameter heatmap, recent evaluations
- `/analyze` — submit category + scenario + prompt + format/tone/audience/extras
- `/result/:id` — full evaluation report (scores, heatmap, suggestions, improved prompt, JSON download)
- `/history` — list of all past evaluations with view/delete
- `/prompts/:id` — re-uses the full evaluation report view

> No admin pages live here — admins use the separate Admin app.

---

## 4. Admin Frontend — `Prompt Kaizen Admin`

```bash
cd "Prompt Kaizen Admin"
npm install
npm run dev
```

App runs on **http://localhost:5174**. `.env` already points to `http://localhost:5000/api`.

Pages:

- `/login` — only allows accounts with `role: admin` (non-admins are rejected client-side and server-side)
- `/` — Admin overview: total users, total prompts, average platform score, category chart, recent users, recent prompts
- `/users` — searchable user list
- `/prompts` — searchable + category-filterable list of all evaluations
- `/prompts/:id` — full prompt evaluation details

Admin tokens are stored under a separate localStorage key (`pk_admin_token` / `pk_admin_user`) so user and admin sessions never collide if you open both apps in the same browser.

---

## 5. API Reference (summary)

All endpoints are JSON. Protected routes require `Authorization: Bearer <token>`.

### Auth (`/api/auth`)
- `POST /register` — `{ name, email, password, confirmPassword }` → `{ token, user }`
- `POST /login` — `{ email, password }` → `{ token, user }`
- `GET  /me` — current user (protected)

### Prompts (`/api/prompts`)  *(all protected)*
- `POST /analyze` — body: `{ category, scenario, userPrompt, expectedOutputFormat, tone?, targetAudience?, additionalRequirements? }`
- `GET  /history` — list of caller's evaluations
- `GET  /:id` — one evaluation (owner or admin)
- `DELETE /:id` — delete (owner or admin)

### Dashboard (`/api/dashboard`)
- `GET /stats` — totals, averages, trend, category counts, parameter averages, recent (protected)

### Admin (`/api/admin`)  *(protected + adminOnly)*
- `GET /stats` — platform-wide stats
- `GET /users` — list users
- `GET /prompts` — list all evaluations (populated with user)

---

## 6. Scoring System

100 points across 10 parameters:

| Parameter | Max | What it checks |
|---|---|---|
| Clarity | 10 | Length, action verbs, basic sentence structure |
| Context | 15 | How much of the scenario is reflected in the prompt |
| Role Assignment | 10 | Phrases like "Act as", "You are", "As a" |
| Task Definition | 15 | Action verb + sufficient length + relevance |
| Input Parameters | 15 | Audience + additional details + specificity |
| Output Format | 10 | Format provided (form field) or mentioned in the prompt |
| Constraints | 10 | Word limit, examples, deadline, language, etc. |
| Tone | 5 | Tone provided (form field) or mentioned in the prompt |
| Relevance | 5 | Keyword overlap with the scenario |
| Grammar & Structure | 5 | Capitalization, punctuation, sentence count |

Ratings: `90+ Excellent`, `75–89 Good`, `60–74 Average`, `40–59 Needs Improvement`, `<40 Poor`.

The analyzer is **rule-based** (see `Prompt Kaizen Backend/utils/promptAnalyzer.js`) — no external API calls required. Adding an LLM (OpenAI / Gemini / Claude) later is straightforward: replace or augment `analyzePrompt()` and `generateImprovedPrompt()` while keeping the same return shape.

---

## 7. Running everything together

Open three terminals:

```bash
# Terminal 1
cd "Prompt Kaizen/Prompt Kaizen Backend" && npm run dev

# Terminal 2
cd "Prompt Kaizen/Prompt Kaizen Frontend" && npm run dev

# Terminal 3
cd "Prompt Kaizen/Prompt Kaizen Admin" && npm run dev
```

Then visit:
- User app: http://localhost:5173
- Admin app: http://localhost:5174  (sign in with the seeded admin)
- API health: http://localhost:5000/api/health

---

## 8. Notes / Conventions

- Tokens are stored in `localStorage` and attached via Axios interceptors.
- The User app uses keys `pk_token` / `pk_user`. The Admin app uses `pk_admin_token` / `pk_admin_user`. They're isolated.
- Passwords are hashed with `bcryptjs` (10 rounds). The `password` field is `select: false` and is also stripped via a custom `toJSON`.
- CORS allow-list comes from `CLIENT_URL` (comma-separated).
- Validation happens on both client (form-level) and server (controller-level).

---

## 9. Troubleshooting

- **`MongoDB connection error`** — make sure `mongod` is running, or update `MONGO_URI` in `Prompt Kaizen Backend/.env`.
- **CORS blocked** — confirm the origin you're visiting is in the backend's `CLIENT_URL` list, then restart the backend.
- **Admin login says "This account does not have admin privileges"** — run `npm run seed:admin` in the backend, or manually set the user's `role` to `admin` in MongoDB.
- **Token expired / 401 loops** — clear localStorage for both `pk_*` keys, then log in again.
