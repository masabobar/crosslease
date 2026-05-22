import { api } from "@/lib/api"
import {
  InviteUserResponseSchema,
  UserResponseSchema,
  PaginatedUsersResponseSchema,
  UserDetailResponseSchema,
} from "./schema"
import type {
  InviteUserInput,
  InviteUserResponse,
  UserResponse,
  PaginatedUsersResponse,
  UsersQueryParams,
  SuspendUserInput,
  ReactivateUserInput,
  DeactivateUserInput,
  ResendInvitationInput,
  UserDetail,
} from "./schema"

export const USERS_QUERY_KEYS = {
  lists: () => ["users", "list"] as const,
  list: (params: UsersQueryParams) => ["users", "list", params] as const,
  me: () => ["users", "me"] as const,
  detail: (id: string) => ["users", "detail", id] as const,
} as const

export async function inviteUser(
  input: InviteUserInput
): Promise<InviteUserResponse> {
  const data = await api.post("/users", input)
  return InviteUserResponseSchema.parse(data)
}

export async function fetchCurrentUser(): Promise<UserResponse> {
  const data = await api.get("/users/me")
  return UserResponseSchema.parse(data)
}

export async function fetchUsers(
  params: UsersQueryParams = {}
): Promise<PaginatedUsersResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.per_page) qs.set("per_page", String(params.per_page))
  if (params.search) qs.set("search", params.search)
  params.role?.forEach(r => qs.append("role", r))
  params.status?.forEach(s => qs.append("status", s))
  if (params.tenant_id) qs.set("tenant_id", params.tenant_id)
  const query = qs.toString()
  const data = await api.get(`/users${query ? `?${query}` : ""}`)
  return PaginatedUsersResponseSchema.parse(data)
}

export async function approveUser(userId: string): Promise<InviteUserResponse> {
  const data = await api.post(`/users/${userId}/approve`, {})
  return InviteUserResponseSchema.parse(data)
}

export async function suspendUser(
  userId: string,
  input: SuspendUserInput
): Promise<InviteUserResponse> {
  const data = await api.post(`/users/${userId}/suspend`, input)
  return InviteUserResponseSchema.parse(data)
}

export async function reactivateUser(
  userId: string,
  input: ReactivateUserInput
): Promise<InviteUserResponse> {
  const data = await api.post(`/users/${userId}/reactivate`, input)
  return InviteUserResponseSchema.parse(data)
}

export async function deactivateUser(
  userId: string,
  input: DeactivateUserInput
): Promise<InviteUserResponse> {
  const data = await api.post(`/users/${userId}/deactivate`, input)
  return InviteUserResponseSchema.parse(data)
}

export async function resendInvitation(
  userId: string,
  input: ResendInvitationInput
): Promise<InviteUserResponse> {
  const data = await api.post(`/users/${userId}/resend-invitation`, input)
  return InviteUserResponseSchema.parse(data)
}

export async function fetchUserById(id: string): Promise<UserDetail> {
  const data = await api.get(`/users/${id}`)
  return UserDetailResponseSchema.parse(data)
}
