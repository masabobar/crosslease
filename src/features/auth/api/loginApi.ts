import { api } from "@/lib/api"
import { MfaRequiredResponseSchema, LoginResponseSchema } from "./schema"
import type {
  LoginInput,
  MfaRequiredResponse,
  VerifyOtpInput,
  LoginResponse,
  ResendOtpInput,
} from "./schema"

export async function login(
  credentials: LoginInput
): Promise<MfaRequiredResponse> {
  const data = await api.post("/users/login", credentials)
  return MfaRequiredResponseSchema.parse(data)
}

export async function verifyOtp(input: VerifyOtpInput): Promise<LoginResponse> {
  const data = await api.post("/users/verify-otp", input)
  return LoginResponseSchema.parse(data)
}

export async function resendOtp(input: ResendOtpInput): Promise<void> {
  await api.post("/users/resend-otp", input)
}
