import { Shield, Check, Copy } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { Button } from "@/components/ui/button"
import {
  AuthCard,
  AuthCardHeader,
  AuthCardBody,
  AuthCardFooter,
} from "./AuthCard"

type RecoveryCodesCardProps = {
  title: string
  subtitle: string
  codes: string[]
  onContinue: () => void
  /**
   * Passed in rather than derived from a prefix — QA's page objects select on these exact
   * strings, and the two screens that use this card do not share a naming stem.
   */
  testIds: {
    container: string
    copyButton: string
    continueButton: string
  }
}

export function RecoveryCodesCard({
  title,
  subtitle,
  codes,
  onContinue,
  testIds,
}: RecoveryCodesCardProps) {
  const { t } = useTranslation("auth")
  const { isCopied, copy } = useCopyToClipboard()

  async function handleCopy() {
    const didCopy = await copy(codes.join("\n"))
    if (!didCopy) toast.error(t("clipboard.copyFailed"))
  }

  return (
    <AuthCard>
      <AuthCardHeader>
        <div className="p-3 bg-amber-100 rounded-[14px] w-fit mb-4">
          <Shield size={24} className="text-amber-600" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
      </AuthCardHeader>

      <AuthCardBody>
        <div
          data-testid={testIds.container}
          className="bg-muted rounded-lg p-4 font-mono text-sm grid grid-cols-2 gap-2"
        >
          {codes.map((code, index) => (
            <span
              key={code}
              data-testid={`mfa-recovery-code-${index}`}
              className="text-foreground"
            >
              {code}
            </span>
          ))}
        </div>
      </AuthCardBody>

      <AuthCardFooter>
        <Button
          type="button"
          variant="outline"
          data-testid={testIds.copyButton}
          onClick={handleCopy}
          className="gap-2"
        >
          {isCopied ? <Check size={16} /> : <Copy size={16} />}
          {isCopied ? t("recoveryCodes.copied") : t("recoveryCodes.copy")}
        </Button>
        <Button
          type="button"
          data-testid={testIds.continueButton}
          onClick={onContinue}
        >
          {t("recoveryCodes.continue")}
        </Button>
      </AuthCardFooter>
    </AuthCard>
  )
}
