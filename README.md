# RefiNext App

Frontend application for the RefiNext platform.

## Tech stack

- **React 19** — UI
- **Vite** — build tool and dev server
- **React Router v7** — routing
- **TanStack React Query** — server state and data fetching
- **Zustand** — client state
- **Zod** — API response validation
- **React Hook Form** — form handling
- **Tailwind CSS** — styling
- **BaseUI** — headless UI primitives

## Prerequisites

- Node 22
- pnpm 11 (`corepack enable && corepack prepare pnpm@11.1.1 --activate`)

## Local setup

```bash
git clone <repo-url>
cd refinext-app
cp .env.example .env   # then fill in VITE_API_URL
pnpm install
pnpm dev
```

App runs at `http://localhost:5173`.

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # type-check + build for production
pnpm preview      # preview production build locally
pnpm lint         # run ESLint
pnpm type-check   # TypeScript check without emitting
pnpm test         # run Vitest in watch mode
pnpm test:run     # run Vitest once
```

## Project structure

```
src/
  components/ui/    # shared UI primitives
  features/         # one folder per feature
  hooks/            # shared custom hooks
  store/            # Zustand stores
  router/           # React Router config
  lib/              # utilities
```

## Docker

Run the dev server in Docker:

```bash
docker compose --profile dev up
```

Run the production build locally:

```bash
docker compose --profile prod up
```

## CI/CD

### Environments

| Environment | URL | Branch |
|---|---|---|
| Develop | https://refinext-dev.projects.holycode.com | `develop` |
| Staging | https://refinext-st.projects.holycode.com | `release/*`, `hotfix/*` |

### Dev flow

1. Open MR → lint, type-check, and unit tests run automatically
2. Merge to `develop` → image built and tagged `latest`, auto-deployed to dev

### Staging flow

1. Cut a `release/x.x.x` branch off `develop` (or `hotfix/x` for urgent fixes)
2. Push the branch → image built and tagged `staging` automatically
3. Go to GitLab CI pipeline → manually trigger `deploy:staging`

### GitLab CI variables required

| Variable | Scope | Description |
|---|---|---|
| `SSH_PRIVATE_KEY` | All | Deploy key authorized on both servers |
| `VITE_API_URL` | Develop | Backend URL for the dev environment |
| `VITE_API_URL` | Staging | Backend URL for the staging environment |
