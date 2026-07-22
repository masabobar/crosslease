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

## Windows development

**Recommended: WSL2.** Install Ubuntu via WSL2, clone the repo inside the Linux filesystem (not `/mnt/c/...`), and follow the setup below exactly as on macOS/Linux — Docker Desktop's WSL2 backend integrates directly with it.

**Native Windows (no WSL2):**

- Install [Git for Windows](https://git-scm.com/download/win) — its bundled Git Bash is required. Git hooks (`.husky/*`) are `sh` scripts and only run correctly under Git Bash's `sh.exe`; PowerShell/cmd cannot execute them directly, but Git itself invokes hooks through Git Bash automatically as long as it's installed.
- Node via [nvm-windows](https://github.com/coreybutler/nvm-windows) or `fnm` — nvm-windows does **not** read `.nvmrc` automatically (unlike nvm on macOS/Linux); run `nvm install 22 && nvm use 22` explicitly, or use `fnm use` which does respect `.nvmrc`.
- Enable Corepack for pnpm: `corepack enable` (may require an elevated/Administrator shell the first time).
- Docker Desktop with the WSL2 backend enabled, even if you don't develop inside WSL2 — it's required for `docker compose up` to work reliably.
- `.gitattributes` in this repo forces LF line endings on checkout — leave `core.autocrlf` at its default (`true` is fine) rather than overriding it, so hook scripts and source files aren't corrupted with CRLF.

## Local setup

```bash
git clone <repo-url>
cd refinext-app
cp .env.example .env   # then fill in VITE_API_URL
pnpm install
pnpm dev
```

App runs at `http://localhost:5173`.

`.env.example` documents two setups — pick one when filling in `.env`:

- **Local `refinext-api`** (default) — `VITE_API_URL=http://localhost:3530/api/v1`
- **No local API, point at a remote environment (dev/staging)** — set `VITE_API_URL=/api/v1` and `API_PROXY_TARGET=<remote API origin>` instead. A direct URL to a remote API doesn't work here: the auth cookie is `SameSite=Lax`, which the browser withholds on cross-site requests from `localhost`; routing through the Vite dev proxy keeps requests same-origin so the cookie round-trips correctly.

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

| Environment | URL                                        | Branch                  |
| ----------- | ------------------------------------------ | ----------------------- |
| Develop     | https://refinext-dev.projects.holycode.com | `develop`               |
| Staging     | https://refinext-st.projects.holycode.com  | `release/*`, `hotfix/*` |

### Dev flow

1. Open MR → lint, type-check, and unit tests run automatically
2. Merge to `develop` → image built and tagged `latest`, auto-deployed to dev

### Staging flow

1. Cut a `release/x.x.x` branch off `develop` (or `hotfix/x` for urgent fixes)
2. Push the branch → image built and tagged `staging` automatically
3. Go to GitLab CI pipeline → manually trigger `deploy:staging`

### GitLab CI variables required

| Variable          | Scope   | Description                             |
| ----------------- | ------- | --------------------------------------- |
| `SSH_PRIVATE_KEY` | All     | Deploy key authorized on both servers   |
| `VITE_API_URL`    | Develop | Backend URL for the dev environment     |
| `VITE_API_URL`    | Staging | Backend URL for the staging environment |
