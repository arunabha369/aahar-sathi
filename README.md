# 🍛 Aahar Sathi

**Your Indian diet companion.** Sign up, enter your details, and get a personalised 7-day Indian meal
plan with calorie and macro targets, a grocery list, a water tracker and progress charts.

The maths is real (Mifflin–St Jeor, Asian-Indian BMI cut-offs, goal-based macro splits) and the food is
home-style Indian cooking — poha, rajma chawal, idli sambar, ghugni, egg curry, tandoori chicken — across
North, South, East and West India.

---

## Tech stack

| Layer     | Technology                                                      |
| --------- | --------------------------------------------------------------- |
| Frontend  | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, TypeScript |
| Backend   | Node.js 22+, Express 5, TypeScript (tsx for dev, tsc for build)  |
| Database  | Postgres on Supabase, via node-postgres (`pg`)                   |
| Charts    | Recharts 3                                                       |
| Auth      | JWT in an httpOnly cookie                                        |
| Tests     | Vitest, Supertest, a local Postgres test database                |

---

## Repo layout

npm workspaces, two apps:

```
aahar-sathi/
├── client/                  Next.js app (the only thing the browser talks to)
│   ├── app/(marketing)/     landing page
│   ├── app/(auth)/          login, register
│   ├── app/(app)/           onboarding, dashboard, grocery, plans, plans/[id], progress, settings
│   ├── components/          ui/, charts/, plan/, forms/
│   ├── lib/api/             server.ts (Server Components), client.ts (browser)
│   ├── lib/types.ts         API response types
│   └── proxy.ts             route protection (replaces middleware.ts)
├── server/
│   ├── src/app.ts           Express app
│   ├── src/config/          env validation
│   ├── src/db/              Postgres pool, schema + migrate script, queries per table
│   ├── src/routes/          auth, profile, plans, logs
│   ├── src/controllers/
│   ├── src/middleware/      requireAuth, validate, errorHandler, rateLimit
│   ├── src/services/        nutrition.ts, planGenerator.ts, grocery.ts, planService.ts
│   ├── src/data/meals.ts    82 meals, the seed source
│   ├── src/seed.ts          idempotent seed + demo account
│   └── tests/               nutrition, meal data, plan generator, auth API, plan API, log API
└── package.json             workspace scripts
```

---

## Getting started

### Prerequisites

- Node.js 22 or newer
- A Postgres database: a Supabase project, or Postgres running locally (14 or newer)

### 1. Install

```bash
npm install          # installs both workspaces
```

### 2. Configure

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

**`server/.env`**

| Variable        | Required | Default                                     | What it does                                              |
| --------------- | -------- | ------------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`  | yes      | —                                           | Postgres connection string (Supabase Session pooler, or local). The server exits if missing. |
| `DATABASE_CA_CERT` | no    | —                                           | Supabase's CA certificate (file path or PEM) to verify TLS. Without it, TLS is encrypted but unverified. |
| `DATABASE_POOL_SIZE` | no  | `10`                                        | Connections the API keeps open.                           |
| `JWT_SECRET`    | yes      | —                                           | Signing key, at least 16 characters. The server exits if missing. |
| `PORT`          | no       | `5001`                                      | Port the API listens on.                                  |
| `NODE_ENV`      | no       | `development`                               | `production` turns on `trust proxy` and secure cookies.   |
| `JWT_EXPIRES_IN`| no       | `7d`                                        | Token lifetime; the cookie maxAge matches.                |
| `CLIENT_ORIGIN` | no       | `http://localhost:3000`                     | CORS origin (a dev convenience — see the rewrite note).   |
| `DEMO_ENABLED`  | no       | `true`                                      | Enables `POST /api/auth/demo` and seeding the demo user.  |

**`client/.env.local`**

| Variable               | Required | Default                   | What it does                                               |
| ---------------------- | -------- | ------------------------- | ---------------------------------------------------------- |
| `API_URL`              | yes      | `http://localhost:5001`   | Where Express lives. Used by the `/api` rewrite **and** by Server Components. |
| `NEXT_PUBLIC_SITE_URL` | no       | `https://aaharsathi.in`   | `metadataBase`, `robots.txt` and `sitemap.xml`.            |

`API_URL` must be set **at build time as well as at runtime**, because Next.js generates rewrites during
the build.

### 3. Create the tables and seed them

```bash
npm run db:migrate -w server   # creates the tables; safe to re-run
npm run seed
```

The tables live in a private `app` schema with row level security switched on, so Supabase's public
REST API (and its anon key) cannot reach them — only this server's own connection can.

The seed upserts all 82 meals by slug (so it is safe to re-run) and creates a demo account:

> **demo@aaharsathi.in** / **Demo@1234** — complete profile, an active 7-day plan, and 30 days of weight
> and water logs so the charts have something to draw.

### 4. Run

```bash
npm run dev          # Express on :5001 and Next.js on :3000, together
```

Open <http://localhost:3000> and use **Try the demo**, or create an account.

---

## Scripts

Run these from the repo root:

| Script            | What it does                                                      |
| ----------------- | ----------------------------------------------------------------- |
| `npm run dev`     | Both apps together (concurrently)                                 |
| `npm run build`   | `tsc` for the server, `next build` for the client                 |
| `npm start`       | Both apps from their build output                                 |
| `npm run lint`    | Server typecheck + ESLint on the client                           |
| `npm test`        | The full Vitest suite (89 tests)                                  |
| `npm run seed`    | Seed meals and the demo account                                   |
| `npm run db:migrate -w server` | Create or update the database tables              |

Workspace-only variants work too, e.g. `npm run dev -w server` or `npm test -w server`.

---

## Why the `/api` rewrite exists

`client/next.config.ts` rewrites `/api/:path*` to `${API_URL}/api/:path*`.

The browser therefore only ever talks to the Next.js origin. The auth cookie is set by Express but arrives
through the Next.js domain, so it stays **first-party** — no CORS preflights, and no third-party-cookie
blocking when the two apps are deployed to different hosts (`aaharsathi.in` and `api.aaharsathi.in`).

Server Components skip the rewrite and call Express directly at `API_URL`, forwarding the cookie from
`await cookies()`, so the first paint already has the user's data.

Route protection lives in `client/proxy.ts` (the Next.js 16 replacement for `middleware.ts`). It is an
optimistic check on the presence of the cookie; **Express is the real security boundary** and verifies the
JWT on every protected route, and the `(app)` layout re-checks with `/api/auth/me`.

---

## The API

JSON everywhere. Errors are always `{ "error": { "message", "code", "details?" } }`. Every route is
zod-validated and scoped to the signed-in user.

| Method           | Route                          | Notes                                            |
| ---------------- | ------------------------------ | ------------------------------------------------ |
| `POST`           | `/api/auth/register`           | Creates the account, sets the cookie             |
| `POST`           | `/api/auth/login`              |                                                  |
| `POST`           | `/api/auth/logout`             | Clears the cookie                                |
| `POST`           | `/api/auth/demo`               | Signs in the seeded demo user (`DEMO_ENABLED`)   |
| `GET`            | `/api/auth/me`                 |                                                  |
| `DELETE`         | `/api/account`                 | Deletes the user and all of their data           |
| `GET` / `PUT`    | `/api/profile`                 | Returns targets alongside the profile            |
| `POST`           | `/api/plans`                   | Generates from the saved profile, makes it active |
| `GET`            | `/api/plans?page=&limit=`      | Paginated history                                |
| `GET`            | `/api/plans/active`            | `{ plan: null }` when there is none              |
| `GET`/`DELETE`   | `/api/plans/:id`               |                                                  |
| `POST`           | `/api/plans/:id/activate`      |                                                  |
| `POST`           | `/api/plans/:id/swap`          | `{ dayIndex, slot }`                             |
| `POST`           | `/api/plans/:id/shuffle`       | New meals, same targets                          |
| `GET`/`PATCH`    | `/api/plans/:id/grocery`       | `PATCH` takes `{ item, checked }`                |
| `GET`/`PUT`      | `/api/logs/water`, `/api/logs/water/:date`   | `{ glasses }`                      |
| `GET`/`PUT`/`DELETE` | `/api/logs/weight`, `/api/logs/weight/:date` | `{ weightKg }`                 |

Dates are `YYYY-MM-DD` and come from the **client's** local calendar day, so "today" matches the user's
timezone.

---

## How the numbers are worked out

All of it lives in `server/src/services/nutrition.ts` as pure functions, and the frontend only displays
what the API returns.

- **BMR** (Mifflin–St Jeor): men `10×kg + 6.25×cm − 5×age + 5`, women `… − 161`
- **TDEE** = BMR × activity multiplier (1.2 / 1.375 / 1.55 / 1.725 / 1.9)
- **Target calories** = TDEE − 500 (loss), TDEE (maintain), TDEE + 300 (gain)
- **Safety floor**: never below 1200 kcal (women) or 1500 kcal (men), with a note explaining why
- **BMI** = kg ÷ m², rounded to one decimal, classified with Asian-Indian cut-offs (18.5 / 23 / 25)
- **Underweight guard**: BMI below 18.5 with a weight-loss goal builds a *maintain* plan instead, with a note
- **Protein** = factor × reference weight, where the factor is 1.4 (loss), 1.0 (maintain) or 1.6 (gain),
  and the reference weight is the lower of actual weight and a BMI-25 weight
- **Fat** = 25% of calories ÷ 9 · **Carbs** = the remaining calories ÷ 4
- **Water** = 35 ml per kg, plus 500 ml for Active/Athlete, rounded up to 250 ml glasses

Plan generation (`server/src/services/planGenerator.ts`) splits the day into Breakfast 25%, Mid-Morning
Snack 10%, Lunch 30%, Evening Snack 10% and Dinner 25%, scales each dish to its slot in quarter portions,
and nudges portions until the day lands within a couple of percent of target. It respects the diet, keeps
about 70% of picks in the chosen cuisine, never repeats a dish on consecutive days or more than twice a
week in the same slot, and takes an injectable random function so tests are deterministic.

---

## Tests

```bash
npm test
```

89 tests covering:

- `nutrition.test.ts` — the worked examples, the calorie floor, the underweight guard, macro consistency
- `meals.test.ts` — every meal's macros within 10% of its kcal, per-slot diet coverage, ingredient categories
- `planGenerator.test.ts` — day totals within ±10% of target across 150 random profiles, diet rules,
  repetition rules, portion scaling, swapping, the grocery list
- `auth.test.ts`, `plans.test.ts`, `logs.test.ts` — the API end to end (Supertest + Postgres),
  including ownership checks and validation errors
- `database.test.ts` — cascade deletes, one active plan under concurrent requests, dates round-tripping

The API tests need a local Postgres. They create and use `aahar_sathi_test` (emptied after every test);
point `TEST_DATABASE_URL` elsewhere if yours is not on `localhost:5432`.

---

## Deployment

**Client → Vercel** (`aaharsathi.in`)

- Root directory `client`, framework preset Next.js
- Environment: `API_URL=https://api.aaharsathi.in`, `NEXT_PUBLIC_SITE_URL=https://aaharsathi.in`
- `API_URL` must exist at build time — the rewrite is generated during `next build`

**API → Render or Railway** (`api.aaharsathi.in`)

- Root directory `server`, build `npm ci && npm run build`, start `npm start`
- Environment: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`,
  `CLIENT_ORIGIN=https://aaharsathi.in`, `DEMO_ENABLED` as you prefer
- `NODE_ENV=production` turns on `trust proxy` (so rate limiting sees the real IP) and `secure` cookies
- Run `npm run db:migrate` and then `npm run seed` once against the production database to create the
  tables and load the meals

**Database → Supabase**

- In your Supabase project, open **Connect** and copy the **Session pooler** string (it works over IPv4;
  the direct-connection host is IPv6-only). Fill in your database password and use it as `DATABASE_URL`
- Optionally set `DATABASE_CA_CERT` to Supabase's certificate (Project Settings → Database → SSL
  configuration) so the TLS connection is verified, not just encrypted

Because of the rewrite, the two hosts never exchange cookies directly: the browser sees one origin.

---

## Troubleshooting

**`Port 5001 is already in use`** — something else on your machine has the port. Either stop it, or set
`PORT` in `server/.env` and the matching `API_URL` in `client/.env.local`.

**`The meal database is empty`** — run `npm run seed`.

**The server exits on start with "Invalid environment configuration"** — `DATABASE_URL` or `JWT_SECRET` is
missing from `server/.env`.

**`The database is reachable but has no tables yet`** — run `npm run db:migrate -w server`, then `npm run seed`.

**`Tenant or user not found`** (Supabase) — the pooler string's region or project ref is wrong; copy it again
from Supabase → Connect.

---

## A note on safety

Aahar Sathi gives general guidance, not medical advice. Anyone who is pregnant, breastfeeding, or managing
diabetes, thyroid, kidney or heart conditions should consult a doctor or dietitian before changing their
diet.
