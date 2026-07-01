# Init Project — Monorepo Templates

> **NOT USED by this project.** RefiNext Frontend is a single FE app — no monorepo, no Turborepo.
> Kept as reference for other projects. `init-project.md` does not call this module.

**Purpose:** Concrete templates for monorepo projects (Backend + Mobile or Backend + Web + Mobile).

**Parent module:** `init-project-structure-setup.md`

Use these verbatim (replacing `{{PROJECT_NAME}}` and similar placeholders) when setting up a pnpm workspaces + Turborepo project.

---

## Root `package.json`

```json
{
  "name": "{{PROJECT_NAME}}",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "backend:dev": "turbo run dev --filter=backend",
    "mobile:dev": "turbo run dev --filter=mobile"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

---

## `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

## `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

---

## `apps/backend/package.json`

```json
{
  "name": "backend",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "shared-types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

---

## `apps/mobile/package.json`

```json
{
  "name": "mobile",
  "version": "1.0.0",
  "private": true,
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "expo export",
    "test": "jest"
  },
  "dependencies": {
    "shared-types": "workspace:*",
    "api-client": "workspace:*",
    "shared-utils": "workspace:*"
  }
}
```

---

## `packages/shared-types/package.json`

```json
{
  "name": "shared-types",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### `packages/shared-types/src/index.ts`

```typescript
export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}
```

---

## `packages/api-client/src/client.ts`

```typescript
import type { User, ApiResponse } from "shared-types"

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/users/${id}`)
    return response.json()
  }
}
```

---

## Monorepo `.gitignore`

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
.expo/

# Monorepo
.turbo/

# Environment
.env
.env.local

# Mobile
android/app/build/
ios/Pods/
*.ipa
*.apk

# IDE
.vscode/
.idea/
```

---

## Root `README.md`

````markdown
# {{PROJECT_NAME}}

Monorepo with Backend + Mobile.

## Structure

- `apps/backend` — Backend API server
- `apps/mobile` — React Native mobile app
- `packages/shared-types` — Shared TypeScript types
- `packages/api-client` — API wrapper for mobile
- `packages/shared-utils` — Common utilities

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
pnpm install
```
````

### Development

```bash
pnpm dev              # all apps
pnpm backend:dev      # backend only
pnpm mobile:dev       # mobile only
```

### Testing

```bash
pnpm test
```

### Building

```bash
pnpm build
```

```

---

## Option 3 Additions

For the full monorepo (Backend + Web + Mobile), also create:

- `apps/web/package.json` (Next.js/Remix/Vite — stack-specific, see `init-project-stack-selection.md`)
- `packages/ui-components/` for shared React components (only if using React Native Web)

Everything else (root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`) stays the same as Option 2.

---

**Version:** 2.0.0 (split from the original combined module)
**Last Updated:** 2026-04-21
**Parent module:** `init-project-structure-setup.md`
```
