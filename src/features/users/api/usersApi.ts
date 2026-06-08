import { api } from "@/lib/api"
import {
  ExportJobSchema,
  ExportJobStatusSchema,
  InviteUserResponseSchema,
  UserActionResponseSchema,
  UserResponseSchema,
  PaginatedUsersResponseSchema,
  UserDetailResponseSchema,
} from "./schema"
import type {
  ExportJob,
  ExportJobStatus,
  ExportParams,
  InviteUserInput,
  InviteUserResponse,
  UserActionResponse,
  UserResponse,
  PaginatedUsersResponse,
  UsersQueryParams,
  SuspendUserInput,
  ReactivateUserInput,
  DeactivateUserInput,
  ResendInvitationInput,
  UserDetail,
  EditUserInput,
  ChangeEmailInput,
  ChangeRoleInput,
  UpdateAccessPeriodInput,
  UpdateSelfInput,
} from "./schema"
import { GovernedActionSchema } from "@/features/governed-actions/api/schema"
import type { GovernedAction } from "@/features/governed-actions/api/schema"

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
  if (params.sort_by) qs.set("sort_by", params.sort_by)
  if (params.sort_order) qs.set("sort_order", params.sort_order)
  if (params.last_login_from) qs.set("last_login_from", params.last_login_from)
  if (params.last_login_to) qs.set("last_login_to", params.last_login_to)
  const query = qs.toString()
  const data = await api.get(`/users${query ? `?${query}` : ""}`)
  return PaginatedUsersResponseSchema.parse(data)
}

export async function approveUser(userId: string): Promise<UserActionResponse> {
  const data = await api.post(`/users/${userId}/approve`, {})
  return UserActionResponseSchema.parse(data)
}

export async function suspendUser(
  userId: string,
  input: SuspendUserInput
): Promise<UserActionResponse> {
  const data = await api.post(`/users/${userId}/suspend`, input)
  return UserActionResponseSchema.parse(data)
}

export async function reactivateUser(
  userId: string,
  input: ReactivateUserInput
): Promise<UserActionResponse> {
  const data = await api.post(`/users/${userId}/reactivate`, input)
  return UserActionResponseSchema.parse(data)
}

export async function deactivateUser(
  userId: string,
  input: DeactivateUserInput
): Promise<UserActionResponse> {
  const data = await api.post(`/users/${userId}/deactivate`, input)
  return UserActionResponseSchema.parse(data)
}

export async function resendInvitation(
  userId: string,
  input: ResendInvitationInput
): Promise<UserActionResponse> {
  const data = await api.post(`/users/${userId}/resend-invitation`, input)
  return UserActionResponseSchema.parse(data)
}

export async function fetchUserById(id: string): Promise<UserDetail> {
  const data = await api.get(`/users/${id}`)
  return UserDetailResponseSchema.parse(data)
}

export async function initiateExport(params: ExportParams): Promise<ExportJob> {
  const qs = new URLSearchParams()
  qs.set("format", params.format)
  if (params.search) qs.set("search", params.search)
  params.role?.forEach(r => qs.append("role", r))
  params.status?.forEach(s => qs.append("status", s))
  if (params.tenant_id) qs.set("tenant_id", params.tenant_id)
  if (params.last_login_from) qs.set("last_login_from", params.last_login_from)
  if (params.last_login_to) qs.set("last_login_to", params.last_login_to)
  const data = await api.get(`/users/export?${qs.toString()}`)
  return ExportJobSchema.parse(data)
}

export async function getExportJobStatus(
  jobId: string
): Promise<ExportJobStatus> {
  const data = await api.get(`/users/export/status/${jobId}`)
  return ExportJobStatusSchema.parse(data)
}

export async function downloadExportFile(jobId: string): Promise<Blob> {
  return api.get(`/users/export/download/${jobId}`, {
    responseType: "blob",
  }) as Promise<Blob>
}

export async function editUser(
  id: string,
  input: EditUserInput
): Promise<UserDetail> {
  const data = await api.patch(`/users/${id}`, input)
  return UserDetailResponseSchema.parse(data)
}

export async function changeUserEmail(
  id: string,
  input: ChangeEmailInput
): Promise<GovernedAction> {
  const data = await api.post(`/users/${id}/change-email`, input)
  return GovernedActionSchema.parse(data)
}

export async function changeUserRole(
  id: string,
  input: ChangeRoleInput
): Promise<GovernedAction> {
  const data = await api.post(`/users/${id}/change-role`, input)
  return GovernedActionSchema.parse(data)
}

export async function updateUserAccessPeriod(
  id: string,
  input: UpdateAccessPeriodInput
): Promise<GovernedAction> {
  const data = await api.post(`/users/${id}/update-access-period`, input)
  return GovernedActionSchema.parse(data)
}

export async function updateSelf(
  input: UpdateSelfInput
): Promise<UserResponse> {
  const data = await api.patch("/users/me", input)
  return UserResponseSchema.parse(data)
}

export async function uploadSelfPicture(file: File): Promise<UserResponse> {
  const form = new FormData()
  form.append("file", file)
  const data = await api.post("/users/me/picture", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return UserResponseSchema.parse(data)
}

export async function deleteSelfPicture(): Promise<void> {
  await api.delete("/users/me/picture")
}
