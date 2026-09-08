/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * A validated UUID builder for fixtures.
 *
 * This file exists because hand-written fixture UUIDs were the single most common defect in the
 * mock layer, and always the same two mistakes: a tail of the wrong length, or a "readable" tag
 * like `med1` / `dr001` / `cbm1` containing a letter that is not a hex digit. Both produce a
 * perfectly plausible-looking string that `z.string().uuid()` rejects — so the handler answers 500,
 * React Query retries, and the screen sits on its loading skeleton or renders an error. Every gate
 * stays green, because nothing but a browser ever parses it.
 *
 * `mockUuid` fails **loudly at module load** instead, which turns a silent broken screen into an
 * immediate, located error.
 */

// 8-4-4-4-12, version 4, variant 8/9/a/b — matching what Zod actually enforces.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/**
 * Build a fixture UUID from a short hex tag.
 *
 * The tag identifies the row while reading the fixture (`"ac1"` for approval condition 1) and is
 * right-padded into the final 12-character group. It must be hex — that restriction is the whole
 * point, since `med`, `dr` and `cbm` are exactly the tags that broke.
 *
 * @param tag up to 12 hex characters
 * @throws if the tag is not hex, or the result is not a valid v4 UUID
 */
export function mockUuid(tag: string): string {
  if (!/^[0-9a-f]{1,12}$/.test(tag)) {
    throw new Error(
      `mockUuid("${tag}"): a fixture tag must be 1–12 hex characters (0-9, a-f). ` +
        `Letters like m, r, g, t are not hex and produce a UUID that Zod rejects at runtime.`
    )
  }
  const uuid = `00000000-0000-4000-8000-${tag.padStart(12, "0")}`
  if (!UUID_PATTERN.test(uuid)) {
    throw new Error(`mockUuid("${tag}") produced an invalid UUID: ${uuid}`)
  }
  return uuid
}
