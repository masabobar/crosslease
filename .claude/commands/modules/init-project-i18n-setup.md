# Init Project — i18n Setup Module

**Referenced by:** `init-project.md` STEP 1

---

## i18n STATUS CHECK

This project already uses i18n (English + German). The setup step checks whether `I18N-RULES.md` is already configured and skips setup if so.

### Sub-step 1: Check existing configuration

1. Read `.project-management/rules/I18N-RULES.md` (if it exists).
2. If the file exists AND contains real content (no unfilled `{{VARIABLES}}` placeholders):
   - Emit `✅ i18n already configured (en + de)` and exit this module.
3. If the file is missing or is all-placeholder:
   - Proceed to Sub-step 2 to configure for this project's languages.

> **Note:** Do NOT ask the user whether to enable i18n — it is always enabled for this project.

---

### Sub-step 2: Configure (only if I18N-RULES.md is missing/unconfigured)

For this project, languages are fixed: **English (en)** primary, **German (de)** additional.

No language selection questions are needed. Proceed directly to creating the files below.

---

### Option 1: Configure i18n

**If user selects "Yes — multiple languages":**

#### Sub-step 2: Default language

**Ask via AskUserQuestion** (`skippable: true` — Skip = English):

```
question: "Default (primary) language?"
header: "language"
skippable: true
default: "English"
options:
  - label: "English (Recommended)"
    description: "Code: en. Most common default."
  - label: "Spanish"
    description: "Code: es."
  - label: "German"
    description: "Code: de."
applies_to: [ .project-management/rules/I18N-RULES.md ]
```

The user can pick the AskUserQuestion native `Other` to type any other language (free-text). The free-text passes through the anonymization rule (defensive) before being persisted with its ISO code derived from a lookup table in this file.

#### Sub-step 3: Additional languages (loop)

After the default is set, ask iteratively:

```
question: "Add another language?"
header: "more-langs"
skippable: false
options:
  - label: "No — I'm done"
    description: "Finalize i18n config with the languages chosen so far."
  - label: "Yes — add another"
    description: "Pick another language to support."
```

If "Yes — add another" → fire the same AskUserQuestion as Sub-step 2 (default language). Loop until user picks "No — I'm done".

The user can pick the AskUserQuestion native `Other` to type any non-listed language (free-text → anonymized → ISO code lookup → persisted).

#### ISO code lookup table

Used to derive a language code from a free-text `Other` answer:

| Free-text  | ISO 639-1 |
| ---------- | --------- |
| English    | en        |
| Spanish    | es        |
| German     | de        |
| French     | fr        |
| Italian    | it        |
| Portuguese | pt        |
| Dutch      | nl        |
| Polish     | pl        |
| Russian    | ru        |
| Serbian    | sr        |
| Croatian   | hr        |
| Slovenian  | sl        |
| Czech      | cs        |
| Slovak     | sk        |

If the free-text doesn't match the table, emit a warning to the STEP G summary ("Language '<x>' not recognized; using as-is, may need manual ISO code correction in .project-management/rules/I18N-RULES.md") and proceed.

**After user provides languages:**

**1. Create `.project-management/rules/I18N-RULES.md`:**

```markdown
# Internationalization (i18n) Rules

**Status:** ✅ ENABLED

---

## Supported Languages

**Default Language:** English (en)

**Additional Languages:**

- German (de)

---

## Framework

**i18n Library:** i18next + react-i18next
(Vite + React stack — no server-side i18n needed)

**Translation Files Location:**
```

src/i18n/locales/
├── en/
│ └── <feature>.json (one file per feature namespace)
└── de/
└── <feature>.json

````

Each new feature namespace must be registered in:
- `src/i18n/types.d.ts` (TypeScript type augmentation)
- `src/i18n/config.ts` (German lazy-loader)

---

## Requirements

### All User-Facing Text MUST Be Translatable

**✅ CORRECT:**
```typescript
import { useTranslation } from 'react-i18next';

function Welcome() {
  const { t } = useTranslation('dashboard');
  return <h1>{t('welcome.title')}</h1>;
}
````

**❌ INCORRECT:**

```typescript
function Welcome() {
  return <h1>Welcome to our app</h1>; // Hardcoded!
}
```

---

## Task Completion Criteria

**Story is NOT complete until:**

- [ ] All user-facing text uses translation keys
- [ ] Translation keys added to BOTH `en/<feature>.json` and `de/<feature>.json`
- [ ] No hardcoded text in components
- [ ] Namespace registered in `types.d.ts` and `config.ts` (if new namespace)
- [ ] Translation keys follow naming convention: `section.subsection.key`

---

## Translation Key Naming Convention

```
auth.login.title             → "Login"
auth.login.emailLabel        → "Email Address"
auth.login.submitButton      → "Sign In"

dashboard.welcome            → "Welcome, {{name}}!"
dashboard.stats.users        → "Total Users"

errors.network.title         → "Connection Error"
errors.validation.required   → "This field is required"
```

---

## Validation Before Marking Story Complete

**Execute these checks:**

1. **Search for hardcoded strings in components:**

   ```bash
   grep -r ">[A-Z][a-z]" src/features --include="*.tsx" | grep -v "//\|t(\|className"
   ```

2. **Verify translation files exist for both languages:**

   ```bash
   ls src/i18n/locales/en/ && ls src/i18n/locales/de/
   ```

3. **Check all new keys present in both language files.**

---

**Last Updated:** {{date}}

```

**2. Display confirmation:**

```

✅ i18n Configured Successfully

Default Language: English (en)
Additional Languages: German (de)

Translation Files Location: src/i18n/locales/{en,de}/<feature>.json

⚠️ IMPORTANT: All user-facing text MUST use translation keys!

See rules: .project-management/rules/I18N-RULES.md

```

---

### Option 2: Skip i18n

**If user selects "No (Recommended)":**

**Display:**
```

✅ i18n Skipped

No translation requirements.
All text can be hardcoded.

I18N-RULES.md will not be created.

```

**Do NOT create I18N-RULES.md file.**

---

**Next Step:** Return to main `init-project.md` STEP 3 (Read input files)
```
