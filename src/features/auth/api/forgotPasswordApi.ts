// TODO: wire up once API endpoints are available
export async function requestPasswordReset(_email: string): Promise<void> {
  // POST /auth/forgot-password
}

export async function resetPassword(
  _token: string,
  _password: string
): Promise<void> {
  // POST /auth/reset-password
}
