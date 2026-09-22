# 🍛 Aahar Sathi

**Your Indian diet companion.** Sign up, enter your details, and get a personalised 7-day Indian meal
plan with calorie and macro targets, a grocery list, a water tracker and progress charts — then track
what you actually ate: tick off planned meals, log anything else by search, your own dishes or a
barcode, and watch your streak and weekly adherence.

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
cp client/.env.example client/.env.local   # the website and its built-in API
cp server/.env.example server/.env         # the scripts: migrate, seed, tests, standalone API
```

Both need the same `DATABASE_URL` and `JWT_SECRET`.

**`server/.env`** (and the same database/auth values in `client/.env.local`)

| Variable        | Required | Default                                     | What it does                                              |
| --------------- | -------- | ------------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`  | yes      | —                                           | Postgres connection string (Supabase Session pooler, or local). The server exits if missing. |
| `DATABASE_CA_CERT` | no    | —                                           | Supabase's CA certificate (file path or PEM) to verify TLS. Without it, TLS is encrypted but unverified. |
| `DATABASE_POOL_SIZE` | no  | `10` (`2` on Vercel)                        | Connections each API instance keeps open.                 |
| `APP_URL`       | no       | `NEXT_PUBLIC_SITE_URL`, then `http://localhost:3000` | Site origin for password-reset links and the Google callback. |
| `RESEND_API_KEY`| no       | —                                           | Sends password-reset emails via Resend. Without it, dev prints the link to the log. |
| `EMAIL_FROM`    | no       | `Aahar Sathi <no-reply@aaharsathi.in>`      | Sender for those emails (must be on a domain verified in Resend). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | — | Turn on "Continue with Google". |
| `JWT_SECRET`    | yes      | —                                           | Signing key, at least 16 characters. The server exits if missing. |
| `PORT`          | no       | `5001`                                      | Port for the standalone API (`npm run dev:api`) only.     |
| `NODE_ENV`      | no       | `development`                               | `production` turns on `trust proxy` and secure cookies.   |
| `JWT_EXPIRES_IN`| no       | `7d`                                        | Token lifetime; the cookie maxAge matches.                |
| `CLIENT_ORIGIN` | no       | `http://localhost:3000`                     | CORS origin for the standalone API only.                  |
| `DEMO_ENABLED`  | no       | `true`                                      | Enables `POST /api/auth/demo` and seeding the demo user.  |

**`client/.env.local`**

| Variable               | Required | Default                   | What it does                                               |
| ---------------------- | -------- | ------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`         | yes      | —                         | Same as above — the API runs inside the website.           |
| `JWT_SECRET`           | yes      | —                         | Same as above.                                             |
| `DEMO_ENABLED`         | no       | `true`                    | Same as above.                                             |
| `NEXT_PUBLIC_SITE_URL` | no       | `https://aaharsathi.in`   | `metadataBase`, `robots.txt` and `sitemap.xml`.            |

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
npm run dev          # the website on :3000, with the API at /api
```

Open <http://localhost:3000> and use **Try the demo**, or create an account.

---

## Scripts

Run these from the repo root:

| Script            | What it does                                                      |
| ----------------- | ----------------------------------------------------------------- |
| `npm run dev`     | The website with its built-in API, on :3000                       |
| `npm run build`   | Production build of the website (API included)                    |
| `npm start`       | Serve that build                                                  |
| `npm run dev:api` | The API on its own (Express on :5001), if you ever need it        |
| `npm run lint`    | Server typecheck + ESLint on the client                           |
| `npm test`        | The full Vitest suite (126 tests)                                 |
| `npm run seed`    | Seed meals and the demo account                                   |
| `npm run db:migrate` | Create or update the database tables                           |

Workspace-only variants work too, e.g. `npm run dev -w server` or `npm test -w server`.

---

## How the API is served

There is one deployment. The Express app in `server/` is mounted inside Next.js:

- **Browser → `/api/*`** — `client/pages/api/[...path].ts` hands each request to Express unchanged.
  (It is a Pages Router route because those receive Node's own request/response objects, which
  Express needs.) Same origin, so the auth cookie stays **first-party** with no CORS.
- **Server Components** — `client/lib/api/server.ts` runs the same Express app in-process
  (`callExpress`), forwarding the visitor's cookie and IP, so the first paint already has the
  user's data without an HTTP round-trip.

The server source imports its files as `.ts` (so Next.js can bundle it); `tsc` rewrites those to `.js`
for the standalone build (`rewriteRelativeImportExtensions`). The standalone Express server
(`npm run dev:api`, `npm start -w server`) still works, and it is what the test suite exercises.

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
| `GET`/`PUT`/`DELETE` | `/api/logs/sleep`, `/api/logs/sleep/:date` | `{ bedtime, wakeTime }` (`HH:MM`) |
| `GET`            | `/api/diary/:date`             | Planned meals + check-ins, foods logged, totals eaten |
| `PUT`/`DELETE`   | `/api/diary/:date/checkins/:slot` | `{ status: 'eaten' \| 'skipped' }`            |
| `POST`           | `/api/diary/:date/entries`     | A dish (`meal`), own food (`custom`) or `barcode`, with `servings` and optional `slot` (= a swap) |
| `DELETE`         | `/api/diary/:date/entries/:id` | Removing the last swap food reopens the meal     |
| `GET`            | `/api/diary/summary?to=&days=` | Calories eaten per day, logging streak, last-7-days adherence |
| `GET`            | `/api/foods/search?q=`         | The 82 dishes and your own foods                 |
| `GET`/`POST`/`DELETE` | `/api/foods/custom`, `/api/foods/custom/:id` | Your saved dishes, per serving  |
| `GET`            | `/api/foods/barcode/:code`     | A packaged product from Open Food Facts          |

Dates are `YYYY-MM-DD` and come from the **client's** local calendar day, so "today" matches the user's
timezone.

**The food diary.** A check-in keeps a snapshot of the planned meal's numbers, so reshuffling the plan
later never rewrites what the diary says was eaten. Calories eaten = eaten planned meals + every logged
food; a skipped or swapped meal counts nothing by itself. A day is *fully tracked* when all five planned
meals have a check-in, and *on target* when such a day is within 10% of the calorie target.

**Barcodes.** Chrome on Android reads barcodes natively; elsewhere (Safari on iPhone) a WebAssembly
build of ZXing is used, loaded only when scanning and served from this site (`client/public/wasm`, copied
from `zxing-wasm` before every `dev` and `build`). Product data comes from
[Open Food Facts](https://world.openfoodfacts.org) under the Open Database License, cached for a day.

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

126 tests covering:

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

**Website + API → Vercel** (`aaharsathi.in`) — one project, nothing else to host

- Root directory `client`, framework preset Next.js. Leave **"Include files outside the root
  directory"** on (the default): the build needs `../server`
- `client/vercel.json` runs the functions in **Tokyo (`hnd1`)**, next to the Supabase database
  (`ap-northeast-1`). Every request makes several database round trips, so keeping the two in the same
  region matters; change both together if you ever move the database
- Environment variables:
  - `DATABASE_URL` — the Supabase pooler string with port **6543** (transaction mode, made for
    serverless)
  - `JWT_SECRET` — a long random string (`openssl rand -base64 48`)
  - `DEMO_ENABLED` — `true` or `false`
  - `NEXT_PUBLIC_SITE_URL=https://aaharsathi.in`
- Vercel sets `NODE_ENV=production`, which turns on `trust proxy` (rate limits see the real IP) and
  `secure` cookies. Each function instance keeps at most 2 database connections and closes idle ones
  before it sleeps (`@vercel/functions` `attachDatabasePool`)
- Create the tables and load the meals once, from your machine: `npm run db:migrate && npm run seed`
  with `server/.env` pointing at the same database

**Password reset emails → Resend**

- Create an account at resend.com, verify `aaharsathi.in` (it gives you DNS records to add), create an
  API key, then set `RESEND_API_KEY` and `EMAIL_FROM` in Vercel. Reset links use `APP_URL`

**Google sign-in → Google Cloud**

- Google Cloud Console → APIs & Services → OAuth consent screen: app name, support email, the
  `aaharsathi.in` domain; publish it
- Credentials → Create credentials → OAuth client ID → Web application. Authorised redirect URIs:
  `https://aaharsathi.in/api/auth/google/callback` (and `http://localhost:3000/api/auth/google/callback`
  for local testing)
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel (and `client/.env.local` locally). The
  button appears on the sign-in and sign-up pages as soon as both are set

**Database → Supabase**

- In your Supabase project, open **Connect** and copy the **Session pooler** string (it works over IPv4;
  the direct-connection host is IPv6-only). Fill in your database password and use it as `DATABASE_URL`
- Optionally set `DATABASE_CA_CERT` to Supabase's certificate (Project Settings → Database → SSL
  configuration) so the TLS connection is verified, not just encrypted


---

## Troubleshooting

**`Port 3000 is already in use`** — another app has the port; stop it, or run `npm run dev -w client -- -p 3001`.

**`The meal database is empty`** — run `npm run seed`.

**"Invalid environment configuration"** — `DATABASE_URL` or `JWT_SECRET` is missing: from `client/.env.local`
(website), `server/.env` (scripts), or the Vercel project's environment variables.

**`The database is reachable but has no tables yet`** — run `npm run db:migrate -w server`, then `npm run seed`.

**`Tenant or user not found`** (Supabase) — the pooler string's region or project ref is wrong; copy it again
from Supabase → Connect.

---

## A note on safety

Aahar Sathi gives general guidance, not medical advice. Anyone who is pregnant, breastfeeding, or managing
diabetes, thyroid, kidney or heart conditions should consult a doctor or dietitian before changing their
diet.
