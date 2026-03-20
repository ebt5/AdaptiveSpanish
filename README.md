# Adaptive Spanish

A Spanish vocabulary drill web app that adapts to your performance.

## Stack

- **Next.js 15** + **React 19** + **TypeScript**
- **Prisma** (ORM) + **PostgreSQL**
- **Docker Compose** for local database

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start the database

Requires Docker (or Docker Desktop):

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` using the credentials in `docker-compose.yml`.

### 3. Configure environment

```bash
cp .env.example .env
```

The defaults in `.env.example` match `docker-compose.yml` and work out of the box.

### 4. Apply the schema

```bash
npm run db:push      # push schema to the DB (dev)
npm run db:generate  # generate Prisma client
```

### 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
npm run start
```

## Project structure

```
app/
  layout.tsx        # root layout + metadata
  page.tsx          # home route
  globals.css       # all styles
components/
  DrillApp.tsx      # drill UI (client component)
prisma/
  schema.prisma     # User, DictionaryEntry, UserVocabProgress, DrillAttempt
docker-compose.yml  # local PostgreSQL
.env.example        # environment variable template
```

## Prisma scripts

| Command | Description |
|---------|-------------|
| `npm run db:push` | Sync schema to database (dev) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio (browser UI) |
