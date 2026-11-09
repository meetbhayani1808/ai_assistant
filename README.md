# AI Assistant Response Evaluation and Analytics Platform

A full-stack web app where a signed-in user uploads AI assistant (LLM) transcripts, scores each response against custom rubrics, and analyses the results on a dashboard. All data is scoped to the signed-in user.

![Analytics dashboard](screenshots/dashboard.png)

*Dashboard for the demo account: 29 evaluated responses across 3 rubrics, average score per criterion, score distribution, and an upward trend over 13 days.*

---

## Quick start (about 3 minutes)

### Prerequisites

- **Node.js 18 or newer** (`node -v`)
- **MongoDB** running on `localhost:27017`. Either of:
  - Docker: `docker run -d --name eval-mongo -p 27017:27017 mongo:7`
  - A local install: start `mongod` (default port 27017)

### 1. Start the backend (terminal 1)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

You should see `MongoDB connected`, then `Demo data created: demo@example.com / Demo@1234 ...`, then `API listening on http://localhost:3001/api`.

The demo account and all demo data are created **automatically on the first start** against an empty database. Restarting never overwrites existing data.

### 2. Start the frontend (terminal 2)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### 3. Open the app

Go to **http://localhost:3000** and log in:

| Email | Password |
|---|---|
| `demo@example.com` | `Demo@1234` |

> **Windows (cmd/PowerShell):** use `copy .env.example .env` instead of `cp`.

---

## What is pre-loaded for the demo account

| Item | Details |
|---|---|
| **37 responses** | Types: general, math, coding, writing, support; mixed quality from excellent to wrong or rude |
| **3 rubrics** | **General Quality** (Relevance, Clarity, Accuracy, Helpfulness), **Code Answer Quality** (Correctness, Explanation, Best Practices), **Tone & Safety** (Politeness, Empathy, Professionalism). All scored 1-5 |
| **30 evaluations** | Spread over the last 13 days with per-criterion scores and feedback, so the trend chart shows progress |
| **8 unevaluated responses** | Left on purpose so you can evaluate one live |

Dates are relative to the day the data is created, so the trend always covers "the last two weeks".

To reset the demo account to this exact state at any time: `cd backend && npm run seed`.

---

## Reviewer guide: things to try

1. **Log in / out.** Log in with the demo account. Use *Log out* in the nav. Opening `/dashboard` while logged out redirects to `/login`. A wrong password shows an error.
2. **Register** a second account at `/register`. Its dashboard and responses are empty, which shows that data is scoped per user.
3. **Dashboard** (`/dashboard`). Use the **Rubric** and **From / To** filters. Pick *Code Answer Quality* to see only coding evaluations. The page shows the evaluated count, average per criterion, score distribution and the trend line.
4. **Upload** (`/upload`). Use the files in [`backend/sample-data/`](backend/sample-data):
   - `sample.csv` and `sample.json` import cleanly (3 rows each).
   - `bad-rows.csv` imports 2 rows and reports the 2 bad rows with their row number and reason.
   - Any other file type (for example `.txt`) is rejected with a clear message.
5. **Rubrics** (`/rubrics`). Create a rubric, add and remove criteria, edit one, delete one. Validation errors appear if there are no criteria, names repeat, or min is not below max.
6. **Evaluate** (`/responses` then *Evaluate*). Use the *Not evaluated* filter to find a pending response. Pick a rubric, enter a score and optional feedback per criterion, and save. Saving again for the same response and rubric **updates** it instead of creating a duplicate. Scores outside a criterion's range are rejected.
7. **Back on the dashboard,** the new evaluation is reflected in the counts and charts.

---

## Features implemented

- [x] Register, log in, log out (JWT). Only authenticated users can upload, view and evaluate
- [x] All data scoped to the signed-in user (the user id always comes from the token)
- [x] CSV and JSON transcript upload with progress bar, per-row validation and an error report
- [x] Rubric create, list, edit, delete with multiple named criteria, descriptions and a score range
- [x] Evaluation UI: prompt and response shown, rubric picker, score and optional feedback per criterion
- [x] Evaluations stored against the response, rubric and user, with upsert on re-evaluation
- [x] Analytics: average per criterion, score distribution, evaluated count, trend over time
- [x] Dashboard filters: rubric and date range (plus `type` on the API)
- [x] Loading and error states on every page
- [x] Seeded demo user, responses, rubrics and evaluations (automatic on first start)

**Not implemented (stretch):** rubric templates, read-only sharing links, bulk evaluation importer, automated tests. See *Limitations*.

---

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js, Express 5, TypeScript (run with `tsx`) |
| Database | MongoDB with Mongoose |
| Auth | `jsonwebtoken` (JWT), `bcrypt` (password hashing) |
| Uploads | `multer` (memory storage), `csv-parse` |
| Validation | `zod` |
| Security middleware | `helmet`, `cors` |
| Frontend | Next.js (App Router, TypeScript), Recharts, plain CSS |

No paid or proprietary dependencies.

---

## Configuration

**`backend/.env`** (copied from `.env.example`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | API port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/evaluation_platform` | MongoDB connection string |
| `JWT_SECRET` | `change-me-to-a-long-random-string` | Secret used to sign tokens. Change it for anything real |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `FRONTEND_URL` | `http://localhost:3000` | The only origin allowed by CORS |
| `AUTO_SEED` | `true` | Create the demo user on first start. Set `false` to disable |

**`frontend/.env.local`**

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Backend base URL |

---

## Project structure

```
evaluation-platform/
├── backend/
│   ├── src/
│   │   ├── server.ts, app.ts, config.ts
│   │   ├── middleware/    requireAuth, validate (zod), errorHandler
│   │   ├── auth/          register, login, me
│   │   ├── users/         User model
│   │   ├── uploads/       upload route + CSV/JSON parser
│   │   ├── responses/     Response model + list/get/delete
│   │   ├── rubrics/       Rubric model + CRUD
│   │   ├── evaluations/   Evaluation model + validation and upsert
│   │   ├── analytics/     aggregation pipeline
│   │   └── seed/          demo data (auto-run on first start, or `npm run seed`)
│   └── sample-data/       sample.csv, sample.json, bad-rows.csv
├── frontend/
│   ├── app/               login, register, upload, responses, rubrics, evaluate/[id], dashboard
│   ├── components/        Nav, RubricForm, ui (Loading, ErrorBox)
│   └── lib/               api.ts (fetch wrapper, token, 401 redirect), useAuthGuard.ts
├── screenshots/dashboard.png
└── README.md
```

---

## Data model (Mongoose)

| Collection | Fields | Indexes |
|---|---|---|
| **User** | `email` (unique, lowercase), `passwordHash`, `createdAt` | unique `email` |
| **Rubric** | `userId`, `name`, `description`, `criteria[] { _id, name, description, minScore=1, maxScore=5 }`, timestamps | `userId` |
| **Response** | `userId`, `prompt`, `response`, `type?`, `sourceFile`, `createdAt` | `userId` |
| **Evaluation** | `userId`, `responseId`, `rubricId`, `scores[] { criterionId, criterionName, score, feedback? }`, timestamps | `userId`; **unique** `(userId, responseId, rubricId)`; `(userId, rubricId, createdAt)` |

## API summary (prefix `/api`)

All routes except register and login need the header `Authorization: Bearer <accessToken>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` (email, password min 8), `POST /auth/login` returns `{ accessToken, user }`, `GET /auth/me`. Logout is client-side |
| Uploads | `POST /uploads` (multipart field `file`, CSV or JSON, max 1 MB) returns `{ imported, skipped, errors: [{ row, reason }] }` |
| Responses | `GET /responses` (`page`, `limit`, `evaluated=true\|false`, `type`), `GET /responses/:id`, `DELETE /responses/:id` |
| Rubrics | `POST /rubrics`, `GET /rubrics`, `GET /rubrics/:id`, `PATCH /rubrics/:id`, `DELETE /rubrics/:id` |
| Evaluations | `POST /evaluations` (upsert), `GET /evaluations` (`rubricId`, `responseId`, `from`, `to`), `GET /evaluations/:id` |
| Analytics | `GET /analytics?rubricId=&from=&to=&type=` returns `evaluatedCount`, `averageByCriterion`, `distribution`, `trend` |

**Try it with curl**

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"Demo@1234"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')

curl -s http://localhost:3001/api/analytics -H "Authorization: Bearer $TOKEN"

curl -s -X POST http://localhost:3001/api/uploads -H "Authorization: Bearer $TOKEN" \
  -F file=@backend/sample-data/bad-rows.csv
```

Errors use one format: `{ "statusCode": 400, "message": "...", "details": [...] }`, with 400 (validation), 401 (not signed in), 404 (not found or not yours), 409 (duplicate email) and 413 (file too large).

**Upload formats.** CSV with a header row `prompt,response,type` (`type` optional), or a JSON array of `{ "prompt": "...", "response": "...", "type": "..." }`.

---

## Design decisions

- **User scoping.** A `requireAuth` middleware verifies the JWT and sets `req.userId`. Every query filters by it, and a user id is never read from the request body or query string. Another user's record returns 404, so its existence is not revealed.
- **Criterion name snapshot.** Each evaluation score stores `criterionName`, so analytics keep working after a rubric criterion is renamed, removed or the rubric is deleted. Editing a rubric keeps existing criterion ids.
- **Upsert evaluation.** A unique index on `(userId, responseId, rubricId)` plus `findOneAndUpdate({ upsert: true })` means re-evaluating updates the same record. The database guarantees this, not just the app.
- **Upload robustness.** 1 MB limit, extension and content-type allowlist, memory-only storage (nothing is written to disk), safe parsing, a 1000-row cap, per-row validation, one `insertMany` for valid rows, and a summary instead of failing the whole file.
- **Evaluation validation.** Response and rubric must belong to the user, every criterion must be scored exactly once, and each score must be an integer inside that criterion's range. All problems are returned together.
- **Analytics.** One MongoDB aggregation: `$match` (user and filters), then `$facet` for count, averages, distribution and trend.
- **Security checklist.** bcrypt password hashing, every `/api` route protected by default except register and login, strict request validation (unknown fields rejected), CORS limited to the frontend origin, `helmet` headers, request body limit, secrets in `.env` with `.env.example` committed, one central error handler that never leaks stack traces.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Backend exits with `Failed to start: connect ECONNREFUSED` | MongoDB is not running. Start it (see Prerequisites) |
| Login page says *Cannot reach the server* | The backend is not running, or `NEXT_PUBLIC_API_URL` is wrong |
| Browser shows a CORS error | `FRONTEND_URL` in `backend/.env` must match the frontend origin exactly |
| Demo user is missing | Run `cd backend && npm run seed`, or check `AUTO_SEED` is not `false` |
| Port 3000 or 3001 already in use | Stop the other process, or change `PORT` and `NEXT_PUBLIC_API_URL` |

---

## Limitations and future work

- Rubric templates and read-only sharing links
- Bulk evaluation importer
- Automated tests (the app was tested manually, with curl and in a browser)
- The token is kept in `localStorage` for simplicity; httpOnly cookies with refresh tokens would be safer
- No evaluator filter on the dashboard, since each user only sees their own evaluations
