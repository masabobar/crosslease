# =============================================================================
# Multi-stage Dockerfile
# Stage 1: Development (for testing with dev dependencies)
# Stage 2: Builder (builds the production app)
# Stage 3: Production (serves static files with nginx)
# =============================================================================

# -----------------------------------------------------------------------------
# Development stage (with dev dependencies for testing)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS development

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

CMD ["pnpm", "run", "dev"]

# -----------------------------------------------------------------------------
# Builder stage (builds the production app)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

WORKDIR /app
# No BuildKit cache mount for the pnpm store: Railway's Dockerfile validator
# rejects a cache `id` that is not prefixed with its own cache key, and failing
# that check aborts the deploy before the build even starts. Layer caching
# already keeps this step from re-running unless the lockfile changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

ARG VITE_APP_STAGE
ARG PROJECT_NAME
# Relative by default so the built bundle calls the same origin it is served
# from and the nginx /api proxy handles the rest. An absolute URL still works
# when the browser and the API share a site (the GitLab deploys pass one).
ARG VITE_API_URL=/api/v1
# PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md. Set to "true" to build a deploy that
# serves mocked data instead of calling the API. Off unless explicitly passed, and the built app
# shows a permanent banner while it is on, because nothing else distinguishes a fully-mocked deploy
# from a working one.
ARG VITE_USE_MOCKS
ENV VITE_APP_STAGE=$VITE_APP_STAGE
ENV PROJECT_NAME=$PROJECT_NAME
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS

COPY . .
RUN pnpm run build

# -----------------------------------------------------------------------------
# Production stage (serves static files with nginx)
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

ARG BUILD_ID
COPY --from=builder /app/dist /usr/share/nginx/html

# Rendered into /etc/nginx/conf.d/default.conf at container start, so PORT and
# API_PROXY_TARGET are runtime settings rather than baked-in values. Railway
# assigns its own PORT and routes to it; the defaults below keep the GitLab
# deploy and `docker compose --profile prod up` working unchanged.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=3000
ENV API_PROXY_TARGET=https://api.refinext-dev.projects.holycode.com

# htpasswd, for the optional Basic auth gate below
RUN apk add --no-cache apache2-utils

# Set BASIC_AUTH_USER + BASIC_AUTH_PASSWORD to put the SPA behind Basic auth.
# The script rewrites this file at every boot; the placeholder only keeps the
# include in nginx.conf.template resolvable if it never runs.
RUN echo "# basic auth disabled" > /etc/nginx/basic-auth.conf
COPY docker-entrypoint.d/40-basic-auth.sh /docker-entrypoint.d/40-basic-auth.sh
RUN chmod +x /docker-entrypoint.d/40-basic-auth.sh

# Expose port 3000
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
