import { api } from "@/lib/api"
import {
  FinancingCollateralSchema,
  FinancingDetailSchema,
  FinancingSecuritiesResponseSchema,
} from "@/features/financing/api/financingDetailSchema"
import type {
  FinancingCollateral,
  FinancingDetail,
  FinancingSecuritiesResponse,
} from "@/features/financing/api/financingDetailSchema"

export const FINANCING_DETAIL_KEYS = {
  detail: (id: string) => ["financings", "detail", id] as const,
  collateral: (id: string) => ["financings", "collateral", id] as const,
  securities: (id: string) => ["financings", "securities", id] as const,
}

export async function fetchFinancingDetail(
  financingId: string
): Promise<FinancingDetail> {
  const data = await api.get(`/financings/${financingId}`)
  return FinancingDetailSchema.parse(data)
}

export async function fetchFinancingCollateral(
  financingId: string
): Promise<FinancingCollateral> {
  const data = await api.get(`/financings/${financingId}/collateral`)
  return FinancingCollateralSchema.parse(data)
}

export async function fetchFinancingSecurities(
  financingId: string
): Promise<FinancingSecuritiesResponse> {
  const data = await api.get(`/financings/${financingId}/securities`)
  return FinancingSecuritiesResponseSchema.parse(data)
}

/**
 * The values a person maintains by hand: the OS+ pair and the pre-financing debit and credit.
 *
 * `expected_updated_at` is the optimistic lock. It is the record's own `updated_at`, sent back
 * unchanged — if someone else has written since this screen loaded, the backend refuses rather
 * than letting one edit silently erase another.
 *
 * A field left out of the body is left alone; a field sent as `null` is cleared to NOT RECORDED,
 * which is a different statement from zero.
 */
export type MaintainedValuesPatch = {
  expected_updated_at: string
  loan_number?: string | null
  loan_account?: string | null
  soll_amount?: string | null
  soll_date?: string | null
  haben_amount?: string | null
  haben_date?: string | null
}

export async function updateMaintainedValues(
  financingId: string,
  body: MaintainedValuesPatch
): Promise<FinancingDetail> {
  const data = await api.patch(
    `/financings/${financingId}/maintained-values`,
    body
  )
  return FinancingDetailSchema.parse(data)
}
