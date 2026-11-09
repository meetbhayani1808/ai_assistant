# AI Assistant Response Evaluation and Analytics Platform

A full-stack web app for uploading LLM response transcripts, scoring them against custom rubrics, and analysing the results. Every piece of data is scoped to the signed-in user.

![Analytics dashboard](screenshots/dashboard.png)

## Features implemented

- [x] Register, log in, log out (JWT); all data endpoints require authentication and are scoped to the user
- [x] Upload CSV or JSON transcripts (max 1 MB) with progress bar and per-row error report
- [x] Rubric CRUD: multiple named criteria with descriptions and a min/max scale
- [x] Evaluate responses: score and optional feedback per criterion; re-submitting updates the evaluation
- [x] Analytics dashboard: average per criterion, score distribution, evaluated count, trend over time; filters for rubric and date range
- [x] Seed script with demo user, responses, rubric and evaluations

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js, Express 5, TypeScript (run with `tsx`) |
| Database | MongoDB + Mongoose |
| Auth | `jsonwebtoken`, `bcrypt` |
| Uploads | `multer` (memory storage), `csv-parse` |
| Validation | `zod` |
| Security | `helmet`, `cors` |
| Frontend | Next.js (App Router, TypeScript), Recharts, plain CSS |

No paid or proprietary dependencies.

## Setup

**Prerequisites:** Node.js 18+, a running MongoDB (local `mongod`, or `docker run -d -p 27017:27017 mongo`).

```bash
# 1. Backend
cd backend
cp .env.example .env        # adjust MONGO_URI / JWT_SECRET if needed
npm install
npm run dev                 # http://localhost:3001/api (creates the demo user on first start)

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

## Demo credentials

The demo user is created automatically the first time the backend starts against an empty database. Restarting never overwrites existing data. Set `AUTO_SEED=false` in `backend/.env` to disable this, or run `npm run seed` in `backend/` to reset the demo data to its original state.

`demo@example.com` / `Demo@1234`: 15 responses (10 evaluated, 5 pending), one rubric "General Quality" (Relevance, Clarity, Accuracy, Helpfulness, scale 1-5).

Sample upload files are in `backend/sample-data/` (`sample.csv`, `sample.json`, and `bad-rows.csv` to see per-row errors).

## Usage

1. Log in, then open **Upload** and import a CSV or JSON file.
2. Open **Rubrics** to create or edit a rubric.
3. Open **Responses**, click **Evaluate**, pick a rubric and score each criterion.
4. Open **Dashboard** and filter by rubric and date range.

**File formats:** CSV with header `prompt,response,type` (`type` optional); JSON array of `{ "prompt", "response", "type"? }`.

## API summary (prefix `/api`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Uploads | `POST /uploads` (multipart field `file`) -> `{ imported, skipped, errors[] }` |
| Responses | `GET /responses` (`page`, `limit`, `evaluated`, `type`), `GET /responses/:id`, `DELETE /responses/:id` |
| Rubrics | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` on `/rubrics` |
| Evaluations | `POST /evaluations` (upsert), `GET /evaluations` (`rubricId`, `responseId`, `from`, `to`), `GET /evaluations/:id` |
| Analytics | `GET /analytics?rubricId=&from=&to=&type=` -> `evaluatedCount`, `averageByCriterion`, `distribution`, `trend` |

Errors use one format: `{ "statusCode": 400, "message": "...", "details": [...] }` with 400, 401, 404, 409 and 413 used as appropriate.

## Design decisions

- **User scoping:** a `requireAuth` middleware verifies the JWT and sets `req.userId`. Every query filters by it; user ids are never read from the body or query string. Another user's record returns 404.
- **Criterion name snapshot:** each evaluation score stores `criterionName`, so analytics keep working after a rubric is edited or deleted. Editing a rubric keeps existing criterion `_id`s.
- **Upsert evaluation:** a unique index on `(userId, responseId, rubricId)` plus `findOneAndUpdate({ upsert: true })` means re-evaluating updates instead of duplicating.
- **Upload robustness:** size limit, extension + content-type allowlist, memory-only storage (nothing written to disk), safe parsing, row cap, per-row validation, `insertMany` for valid rows, and a summary instead of failing the whole file.
- **Analytics:** a single MongoDB aggregation with `$match` (user + filters) and `$facet` for count, averages, distribution and trend.
- **Indexes:** `userId` on every collection; `(userId, rubricId, createdAt)` on evaluations for analytics filters.

## Limitations and future work

- Rubric templates and read-only sharing links
- Bulk evaluation importer
- Automated tests (manual and curl testing only so far)
- Token is stored in `localStorage` (simple, but httpOnly cookies and refresh tokens would be safer)
- No evaluator filter on the dashboard, since each user only sees their own evaluations
