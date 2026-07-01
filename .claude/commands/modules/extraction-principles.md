# Client Docs Extraction - Principles & Patterns

**Purpose:** Core principles and patterns for extracting requirements from client documents.

**Parent:** `process-client-docs-extraction.md`

---

## Requirement Extraction Principles

### Read Between the Lines

**Extract both explicit and implicit requirements:**

**Explicit (stated directly):**

```
Document: "Users must be able to register with email and password"
Requirement: User registration with email/password
```

**Implicit (implied but not stated):**

```
Document: "Users must be able to register with email and password"
Implicit requirements:
- Email validation
- Password strength requirements
- Email verification
- Account activation
- Login functionality
- Password reset functionality
```

---

### Organize by User Value

**Structure features as Epics and Stories:**

**From document:**

```
"The platform should allow users to manage their profiles,
 browse products, add items to cart, and complete purchases."
```

**Extracted structure:**

```
EPIC-1: User Management
- US-001: User Registration
- US-002: User Login
- US-003: Profile Management
- US-004: Password Reset

EPIC-2: Product Browsing
- US-010: Product Catalog
- US-011: Product Search
- US-012: Product Details

EPIC-3: Shopping Experience
- US-020: Shopping Cart
- US-021: Checkout Flow
- US-022: Payment Processing
```

---

## Priority Assignment

### Determine Priority Levels

**Based on client emphasis:**

**P0 (Must Have - Launch Blocker):**

- Explicitly stated as "must have"
- Core functionality
- Mentioned multiple times
- Required for launch

**P1 (Should Have - Important):**

- Stated as "should have"
- Important but not critical
- Can be added post-launch if needed

**P2 (Nice to Have):**

- Stated as "could have"
- Optional features
- Future enhancements

**P3 (Future):**

- Ideas mentioned
- Not critical
- Post-launch consideration

**Extraction examples:**

```
"Users MUST be able to register" → P0
"Users should receive email notifications" → P1
"Users could have a wishlist feature" → P2
"In the future, we might add social sharing" → P3
```

---

## Story Point Estimation

### Estimate Complexity

**Complexity factors:**

- Technical difficulty
- Dependencies
- Uncertainty
- Testing requirements

**Estimation scale (Fibonacci):**

- **1 point:** Trivial (simple UI change)
- **2 points:** Simple (basic CRUD)
- **3 points:** Medium (with validation)
- **5 points:** Complex (integration, auth)
- **8 points:** Very complex (payment, search)
- **13 points:** Extremely complex (split into smaller stories)

**Examples:**

```
US-001: User Registration → 5 points (auth, validation, email)
US-010: View Product List → 2 points (simple read)
US-020: Shopping Cart → 5 points (state management, persistence)
US-022: Payment Processing → 8 points (third-party, security)
```

---

## Extraction Patterns

### User-Centered Extraction

**Convert features to user stories:**

**Document:** "Product search functionality"

**Extracted:**

```
US-045: Product Search

**As a** customer
**I want to** search for products by keyword
**So that** I can quickly find what I'm looking for

**Acceptance Criteria:**
- Search bar visible on all pages
- Real-time search results
- Search by product name, description, category
- Display relevant results sorted by relevance
- Handle no results gracefully

**Priority:** P0
**Story Points:** 5
**Dependencies:** US-010 (Product Catalog)
```

---

### Non-Functional Requirements

**Extract implicit quality requirements:**

**Document mentions:**

```
"Fast loading times"
"Secure platform"
"Easy to use"
```

**Extracted as:**

```
## Non-Functional Requirements

### Performance
- Page load time < 2 seconds
- API response time < 500ms
- Support 1000 concurrent users

### Security
- HTTPS only
- Password hashing (bcrypt)
- SQL injection prevention
- XSS protection
- CSRF tokens

### Usability
- Mobile responsive
- Accessible (WCAG 2.1 AA)
- Intuitive navigation
- Clear error messages
```

---

## Cross-Document Synthesis

### Combine Information

**From multiple documents:**

**Document 1 (brief.pdf):**
"Users should be able to search products"

**Document 2 (wireframe.png):**
Shows search bar with filter dropdowns

**Document 3 (requirements.docx):**
"Search with category and price filters"

**Combined extraction:**

```
US-045: Product Search with Filters

**As a** customer
**I want to** search products and filter by category and price
**So that** I can narrow down my search results

**Acceptance Criteria:**
- Search bar in header (as per wireframe)
- Filter by category dropdown
- Filter by price range slider
- Combine search + filters
- Update results in real-time
- Show result count

**Source:**
- brief.pdf (p. 4)
- wireframe.png
- requirements.docx (p. 7)

**Priority:** P0
**Story Points:** 8
```

---

[← Back to process-client-docs-extraction.md](process-client-docs-extraction.md)
