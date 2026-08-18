import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AccountFormDialog } from "@/features/partners/components/AccountFormDialog"
import type { AccountFormValues } from "@/features/partners/components/AccountFormDialog"

// No wire field for a partner's accounts on the identity shape — kept as local UI state,
// like the Dealer number section, rather than on the RHF form. Lifted to PartnerSubmitForm
// (unlike the dialog's open/edit-target state, which stays here) so the entries survive
// through to submitMutation.onSuccess in SubmitPartnerPage, the same way dealerNumbers does.
type Account = { id: string } & AccountFormValues

type DialogState = { mode: "add" } | { mode: "edit"; account: Account } | null

const ACCOUNT_FIELD_KEYS: (keyof AccountFormValues)[] = [
  "iban",
  "account_number",
  "holder_name",
  "bank_name",
  "bic",
]

type AccountsSectionProps = {
  accounts: Account[]
  onAdd: (values: AccountFormValues) => void
  onEdit: (id: string, values: AccountFormValues) => void
}

function AccountsSection({ accounts, onAdd, onEdit }: AccountsSectionProps) {
  const { t } = useTranslation("partners")
  const [dialogState, setDialogState] = useState<DialogState>(null)

  const fieldLabels: Record<keyof AccountFormValues, string> = {
    iban: t("submit.form.accountDialog.fields.iban"),
    account_number: t("submit.form.accountDialog.fields.accountNumber"),
    holder_name: t("submit.form.accountDialog.fields.holderName"),
    bank_name: t("submit.form.accountDialog.fields.bankName"),
    bic: t("submit.form.accountDialog.fields.bic"),
  }

  function handleSave(values: AccountFormValues) {
    if (dialogState?.mode === "edit") {
      onEdit(dialogState.account.id, values)
    } else {
      onAdd(values)
    }
  }

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="bg-muted px-4 py-2 gap-0">
        <CardTitle className="text-xs">
          {t("submit.form.sections.accounts")}
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="add-account-button"
            onClick={() => setDialogState({ mode: "add" })}
          >
            <Plus size={16} />
            {t("submit.form.addAccountButton")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {accounts.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="accounts-empty-hint"
          >
            {t("submit.form.accountsEmptyHint")}
          </p>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            data-testid="accounts-grid"
          >
            {accounts.map((account, index) => (
              <div
                key={account.id}
                data-testid={`account-card-${index}`}
                className="flex flex-col gap-2 rounded-[10px] border border-border bg-background p-4"
              >
                {ACCOUNT_FIELD_KEYS.map(key => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {fieldLabels[key]}
                    </span>
                    <span className="font-medium text-foreground truncate">
                      {account[key] || "—"}
                    </span>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 self-end"
                  data-testid={`edit-account-button-${index}`}
                  onClick={() => setDialogState({ mode: "edit", account })}
                >
                  {t("submit.form.accountDialog.edit")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {dialogState && (
        <AccountFormDialog
          mode={dialogState.mode}
          initialValues={
            dialogState.mode === "edit" ? dialogState.account : undefined
          }
          onSave={handleSave}
          onOpenChange={open => !open && setDialogState(null)}
        />
      )}
    </Card>
  )
}

export { AccountsSection }
export type { Account }
