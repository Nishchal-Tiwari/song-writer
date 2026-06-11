# Lyric Constraint Validator — MVP

```
React Chat UI
        │
        ▼
NestJS
        │
        ├── Song Memory      (songs, rules, chat history)
        │
        ├── AI Service       (OpenAI / Claude)
        │
        └── Validation Service
               ├── CMU Dictionary
               ├── phonetik
               └── Rhyme Checker
```

## Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| **Song Memory** | `backend/src/song-memory/` | Create songs, define rules, chat, persist messages |
| **AI Service** | `backend/src/ai/` | Generate lyrics via OpenAI with validation tools |
| **Validation Service** | `backend/src/validation/` | CMU + phonetik + rhyme checking |

## Quick start

```bash
docker compose up -d postgres
phonetik-server

cp backend/.env.example backend/.env
# Set OPENAI_API_KEY

cd backend && npm run start:dev
cd web && npm run dev
```

## User workflow

1. **Create song project** — e.g. "Little Boy At Night"
2. **Define rules** — rhyme scheme, syllables, stress per line (formal template)
3. **Chat** — describe meaning per line; bot generates and validates
4. **Results** — only lines passing syllable, stress, and rhyme checks are shown

## Environment

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Default `gpt-4o` |
| `AI_PROVIDER` | `openai` (default) or `anthropic` (future) |
| `PHONETIK_URL` | Default `http://127.0.0.1:1273` |
| `DATABASE_URL` | PostgreSQL connection string |

## Validation Service

- **CMU Dictionary** — `pronouncing` npm, inflection variants
- **phonetik** — HTTP sidecar for phoneme lookup and compare
- **Rhyme Checker** — perfect rhyme via phonetik + CMU rhyme-tail matching

Exposed to AI as function tools: `lookup_word`, `validate_line`, `validate_verse`.

Stress is the most restrictive constraint, so it is **opt-in** per section
(toggle in "Define rules"). By default only **syllables + rhyme** are enforced;
stress is still measured and shown for reference.

## Production deploy (single domain + PM2)

In production the NestJS API also serves the built React app from `web/dist`,
so the UI and the API share one origin/port (default `3005`). The frontend
calls `/api`, which resolves on the same host — deploy it behind one domain.

### One-time setup on the server

```bash
# Prereqs: Node 18+, Docker, and PM2 (npm i -g pm2)
git clone <repo> && cd phonetics
cp .env.example backend/.env      # then set OPENAI_API_KEY etc.
```

### Build + start

```bash
./deploy.sh          # install, build web + backend, start postgres/phonetik, (re)load PM2
```

`deploy.sh` runs the full pipeline. Equivalent manual steps:

```bash
npm run build                       # builds web/dist then backend/dist
docker compose up -d postgres phonetik
npm run pm2:start                   # pm2 startOrReload ecosystem.config.cjs
```

### Handy scripts (run from repo root)

| Command | Action |
|---------|--------|
| `npm run build` | Build frontend then backend |
| `npm run start` | Run the prod server directly (`backend/dist/main.js`) |
| `npm run deploy` | Full build + PM2 reload (`deploy.sh`) |
| `npm run pm2:start` | Start/reload under PM2 and save process list |
| `npm run pm2:logs` | Tail API logs |
| `npm run pm2:restart` / `pm2:stop` | Restart / stop the API |

### Run on boot

```bash
pm2 startup        # follow the printed command (sets up the system service)
pm2 save           # persist the current process list
```

### Behind a domain (nginx)

Point your domain at the server and reverse-proxy to port 3005:

```nginx
server {
  server_name your-domain.com;
  location / {
    proxy_pass http://127.0.0.1:3005;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # streaming (SSE) generation progress:
    proxy_buffering off;
    proxy_read_timeout 3600s;
  }
}
```

> The generation endpoint streams progress via SSE, so disable proxy buffering
> (`proxy_buffering off`) as shown above.
