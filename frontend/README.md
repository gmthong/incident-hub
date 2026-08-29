# IncidentHub Frontend

## Structure

- `src/`: React application code.
  - `app/`: startup, providers, routes, and root error handling.
  - `auth/`: session state, route guards, permissions, and auth validation.
  - `pages/`: route-level authentication, incident, dashboard, and admin screens.
  - `components/`: reusable UI, layout, feedback, and domain components.
  - `services/`: API client and TanStack Query configuration.
  - `config/`: public environment settings and backend-aligned constants.
  - `utils/`: validation, transformations, filtering, and formatting helpers.
  - `tests/`: frontend tests and shared test support.
- `docker/`: multi-stage frontend image and Nginx SPA configuration.
- `package.json`: dependencies and development commands.
- `vite.config.js`: Vite, Tailwind CSS, aliases, and development-server settings.
- `.env.example`: public API base URL template.

## Run the Frontend Only

Local development from `frontend/` requires the API at the URL configured in `.env`:

```bash
cp .env.example .env
npm ci
npm run dev
```

The development server runs at `http://localhost:3000`.

Alternatively, build and run only the frontend container from `frontend/`:

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:8000/api/v1 -f docker/Dockerfile -t incidenthub-frontend .
docker run --rm -p 3000:8080 incidenthub-frontend
```
