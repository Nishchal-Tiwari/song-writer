const path = require('path');

/**
 * PM2 process definitions for the Lyric Constraint Validator.
 *
 * The NestJS API also serves the built React app (web/dist) from the same
 * origin, so a single process/port (3005) covers both UI and API — deploy it
 * behind one domain.
 *
 * Postgres and the phonetik engine are expected to run via docker-compose
 * (`docker compose up -d postgres phonetik`). If you prefer to run phonetik
 * under PM2 instead, uncomment the second app below (requires the
 * `phonetik-server` binary on PATH: `cargo install phonetik`).
 */
module.exports = {
  apps: [
    {
      name: 'phonetics-api',
      cwd: path.join(__dirname, 'backend'),
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
    },
    // {
    //   name: 'phonetik',
    //   script: 'phonetik-server',
    //   interpreter: 'none',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   autorestart: true,
    // },
  ],
};
