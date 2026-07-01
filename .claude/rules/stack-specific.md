# Stack-Specific Guidelines

> **Note:** Examples for React Router and Node.js. Customize for your stack.

---

## React Router

### Route Definition

- Centralized routes, lazy loading, error boundaries, loading states

```typescript
const routes = [{
  path: '/',
  element: <Layout />,
  errorElement: <ErrorBoundary />,
  children: [
    { index: true, lazy: () => import('./pages/Home') },
    { path: 'products', lazy: () => import('./pages/Products') },
  ],
}];
```

### Navigation

- ✅ Use `useNavigate` hook or `<Link>`
- ❌ NO `window.location`

```typescript
// ✅ GOOD
<Link to="/products">Products</Link>
const navigate = useNavigate(); navigate('/products');

// ❌ BAD
window.location.href = '/products';
```

### Data Loading

- Use loaders for route data
- Handle errors with boundaries
- Implement loading states

```typescript
export async function loader({ params }) {
  const product = await fetchProduct(params.id)
  if (!product) throw new Response("Not Found", { status: 404 })
  return { product }
}
```

---

## Node.js Backend

### API Design

- RESTful conventions (GET, POST, PUT, DELETE)
- Consistent response format
- Proper status codes
- Validate request bodies

**Response Format:**

```typescript
// Success: { "success": true, "data": {...} }
// Error: { "success": false, "error": "message", "code": "CODE" }
```

### Required Middleware

```typescript
app.use("/api/admin/*", requireAdmin) // Auth
app.use("/api/user/*", requireAuth) // Auth
app.post("/api/users", validateBody(userSchema), createUser) // Validation
app.use(errorHandler) // Errors
app.use(requestLogger) // Logging
app.use(cors({ origin: process.env.ALLOWED_ORIGINS.split(",") })) // CORS
```

### Database

**Connection Pooling:**

```typescript
const pool = new Pool({ max: 20, idleTimeoutMillis: 30000 })
```

**Parameterized Queries ONLY:**

```typescript
// ✅ GOOD
db.query("SELECT * FROM users WHERE id = $1", [userId])

// ❌ BAD (SQL injection)
db.query(`SELECT * FROM users WHERE id = ${userId}`)
```

**Transactions:**

```typescript
const client = await pool.connect()
try {
  await client.query("BEGIN")
  await client.query("INSERT INTO orders ...")
  await client.query("UPDATE inventory ...")
  await client.query("COMMIT")
} catch (e) {
  await client.query("ROLLBACK")
  throw e
} finally {
  client.release()
}
```

**Indexing:**

- Index foreign keys and frequently queried columns
- Use composite indexes for multi-column queries
- Monitor query performance

---

## TypeScript + Node.js

### Environment Variables

```typescript
import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.string().transform(Number),
})

export const env = envSchema.parse(process.env)
```

### API Types

```typescript
interface CreateUserRequest {
  email: string
  password: string
}

interface CreateUserResponse {
  success: true
  data: { id: string; email: string }
}

app.post<{}, CreateUserResponse, CreateUserRequest>(
  "/api/users",
  async (req, res) => {
    /* TypeScript knows body shape */
  }
)
```

---

## Performance

### Frontend (React)

- Lazy load routes/components
- Memoize with `useMemo`/`useCallback`
- Proper React keys
- Debounce/throttle events

### Backend (Node.js)

- Cache with Redis
- Paginate large datasets
- Optimize queries (avoid N+1)
- Stream large files
- Rate limiting

---

**Related:**

- `.claude/rules/enums-and-constants.md` — cross-layer naming for enums, error codes, event types (wire format: `SCREAMING_SNAKE_CASE`)
- `.claude/rules/error-handling-and-logging.md` — error envelope, taxonomy, structured logging, PII redaction
- `.claude/rules/security-and-auth.md` — cookie-session config, bcrypt rules, default-deny middleware, security headers, audit logging

---

**Note:** Customize based on your stack. Remove what doesn't apply.
