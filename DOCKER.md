# Docker quickstart

Build and run both services:

```bash
docker-compose up --build
```

Stop and remove containers:

```bash
docker-compose down
```

Build a single service (example: backend):

```bash
docker-compose build backend
```

Notes:
- The frontend image serves the built Vite app with nginx; API requests to `/api/` are proxied to the `backend` service.
- If your backend needs a database, add the DB service to `docker-compose.yml` or connect to an external DB.
