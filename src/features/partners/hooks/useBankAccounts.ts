import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { BankAccountListResponse } from "@/features/partners/api/schema"
import {
  fetchBankAccounts,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function useBankAccounts(
  partnerId: string
): UseQueryResult<BankAccountListResponse, Error> {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.bankAccounts(partnerId),
    queryFn: () => fetchBankAccounts(partnerId),
  })
}
