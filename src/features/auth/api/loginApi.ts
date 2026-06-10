import { api } from "@/lib/api"
import { LoginStepResponseSchema, LoginResponseSchema } from "./schema"
import type {
  LoginInput,
  LoginStepResponse,
  VerifyOtpInput,
  LoginResponse,
  ResendOtpInput,
} from "./schema"

export async function login(
  credentials: LoginInput
): Promise<LoginStepResponse> {
  const data = await api.post("/auth/login", credentials)
  return LoginStepResponseSchema.parse(data)
}

export async function verifyOtp(input: VerifyOtpInput): Promise<LoginResponse> {
  const data = await api.post("/auth/otp/verify", input)
  return LoginResponseSchema.parse(data)
}

export async function resendOtp(input: ResendOtpInput): Promise<void> {
  await api.post("/auth/otp/resend", input)
}
