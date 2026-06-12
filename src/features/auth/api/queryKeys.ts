export const AUTH_QUERY_KEYS = {
  validateResetToken: (token: string) =>
    ["auth", "validateResetToken", token] as const,
  validateActivationToken: (token: string) =>
    ["auth", "validateActivationToken", token] as const,
  mfaEnroll: (token: string) => ["auth", "mfa-enroll", token] as const,
} as const
