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
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .

CMD ["pnpm", "run", "dev"]

# -----------------------------------------------------------------------------
# Builder stage (builds the production app)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

# Accept build arguments for environment variables
ARG VITE_APP_STAGE
ARG PROJECT_NAME
ARG VITE_API_URL

# Set environment variables for build
ENV VITE_APP_STAGE=$VITE_APP_STAGE
ENV PROJECT_NAME=$PROJECT_NAME
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# -----------------------------------------------------------------------------
# Production stage (serves static files with nginx)
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration for port 3000
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 3000
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
