# Database Schema Changes & Migrations

**Related:** `.claude/rules/stack-specific.md` covers complementary database guidelines (connection pooling, parameterized queries, transactions, indexing).

## Migration-Based Workflow

**For SQL databases with Prisma or similar ORMs.**

---

## Commands Reference

| Command                     | Use When               | Purpose                            |
| --------------------------- | ---------------------- | ---------------------------------- |
| `npm run db:migrate`        | Making schema changes  | Creates migration + applies it     |
| `npm run db:migrate:create` | Review before applying | Create migration without applying  |
| `npm run db:migrate:deploy` | Production deployment  | Apply pending migrations           |
| `npm run db:reset`          | Development only       | Reset DB and re-run all migrations |

---

## DO: Production-Safe Practices

- ✅ Always use migrations for schema changes
- ✅ Give migrations descriptive names (e.g., `add_user_avatar_field`)
- ✅ Review generated SQL before committing
- ✅ Test migrations locally before pushing
- ✅ Commit migration files to version control
- ✅ Apply migrations in production using `migrate:deploy`

---

## DO NOT: Dangerous Practices

- ❌ Run `npx prisma db push` directly (bypasses migrations)
- ❌ Modify production database manually
- ❌ Skip committing migration files
- ❌ Use `db push` in production environments

---

## Why Migrations Matter

**Production safety:**

- Production environments (Railway, AWS, etc.) only run `prisma migrate deploy`
- `db push` doesn't create migration history
- Migration files allow rollback and version control
- Team members get automatic schema updates

**Without migrations:**

- No rollback capability
- No audit trail of changes
- No team synchronization
- Production deployments will fail

---

## Standard Migration Workflow

```bash
# 1. Modify schema.prisma
# Add new field to User model

# 2. Create and apply migration
npm run db:migrate  # Creates migration, applies it, generates types

# 3. Review migration SQL
cat prisma/migrations/YYYYMMDDHHMMSS_add_user_avatar/migration.sql

# 4. Test locally
npm test

# 5. Commit migration files
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "feat: add user avatar field"

# 6. Push to repository
git push

# 7. Production deployment (automated)
# CI/CD runs: npm run db:migrate:deploy
```

---

## Emergency Procedure

**If you MUST use db push (development emergency only):**

```bash
# Emergency: bypass migrations
npm run db:push:force

# But IMMEDIATELY create proper migration after
npm run db:migrate:create
```

**Then:**

1. Review the generated migration SQL
2. Test thoroughly
3. Commit migration files
4. Never do this in production

---

## Migration Best Practices

### Naming Conventions

Use descriptive names that explain the change:

- ✅ `add_email_verification_to_users`
- ✅ `create_product_categories_table`
- ✅ `add_index_to_orders_user_id`
- ❌ `update_schema`
- ❌ `migration_1`
- ❌ `fix`

### Review Checklist

Before committing a migration:

- [ ] SQL is correct and safe
- [ ] No data loss will occur
- [ ] Indexes are appropriate
- [ ] Migration is reversible (if possible)
- [ ] Tested locally
- [ ] Team notified (if breaking change)

### Production Deployment

**Production environments should:**

- Run migrations automatically via CI/CD
- Never allow manual schema changes
- Have migration rollback plan
- Monitor migration execution

---

**Related:** See main `CLAUDE.md` for overall development workflow.
