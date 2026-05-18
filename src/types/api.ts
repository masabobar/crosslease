export interface ApiErrorDetail {
  code?: string
  message?: string
  field?: string
  errors?: Array<{ field: string; message: string; input: unknown }>
}
