export const AUTH_QUERY_KEYS = {
  validateResetToken: (token: string) =>
    ["auth", "validateResetToken", token] as const,
  validateActivationToken: (token: string) =>
    ["auth", "validateActivationToken", token] as const,
} as const
