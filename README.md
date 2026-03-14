# Adaptive Spanish

A drill-based Spanish learning app with gamified progress tracking.

## Local Development — Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for MySQL)
- Node.js 18+

### 1. Start the database
```bash
docker compose up -d
```
MySQL will be available on `localhost:3306`. The schema is auto-applied on first run.

### 2. Seed the dictionary
```bash
cd server
npm install
npm run seed
```

### 3. Start the backend
```bash
# from /server
npm run dev
# API runs on http://localhost:3001
```

### 4. Start the frontend
```bash
# new terminal, from /client
npm install
npm run dev
# App runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173), register an account, and you'll land on the main screen with 20 words in your Learning bucket.

---

## Project Structure

```
adaptive-spanish/
├── docker-compose.yml          # Local MySQL
├── .env                        # Local config (not committed)
├── .env.example                # Config template
│
├── server/                     # Node.js / Express API
│   ├── src/
│   │   ├── index.js            # Server entry point
│   │   ├── db/pool.js          # MySQL connection pool
│   │   ├── db/seed.js          # Seed runner
│   │   ├── middleware/auth.js  # JWT middleware
│   │   └── routes/
│   │       ├── auth.js         # POST /api/auth/login|register
│   │       └── words.js        # GET /api/words, /api/words/buckets
│   └── db/
│       ├── migrations/001_initial_schema.sql
│       └── seeds/dictionary_seed.sql
│
└── client/                     # React / Vite SPA
    └── src/
        ├── App.jsx
        ├── api/client.js       # Fetch wrapper
        ├── store/              # Zustand stores
        ├── components/
        │   ├── BucketDisplay/  # Learning / Learned / Mastered counts
        │   ├── DrillCard/      # Main drill UI
        │   ├── DrillSettings/  # Vocabulary / Phrases / Verbs checkboxes
        │   └── common/         # Button
        └── pages/
            ├── AuthPage.jsx    # Login + Register
            └── AppPage.jsx     # Main one-screen app
```

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| M1 | Foundation: auth, DB, seed, UI shell | ✅ Done |
| M2 | Core drill engine (80/20 algorithm, bucket logic) | 🔜 |
| M3 | Visualization (mastery bars, feedback animations) | 🔜 |
| M4 | Verb conjugation drills + heat map | 🔜 |
| M5 | Phrases | 🔜 |
| M6 | Gamification polish (audio, streaks, achievements) | 🔜 |
| M7 | PWA / mobile-optimized | 🔜 |
