import { useState } from "react"
import { toast } from "sonner"
import { Wand2, CheckCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { COPIED_RESET_DELAY_MS } from "@/lib/constants"
import { generatePassword } from "../utils/generatePassword"

type GeneratePasswordButtonProps = {
  onGenerate: (password: string) => void
}

export function GeneratePasswordButton({
  onGenerate,
}: GeneratePasswordButtonProps) {
  const { t } = useTranslation("auth")
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    const password = generatePassword()
    onGenerate(password)

    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), COPIED_RESET_DELAY_MS)
    } catch {
      toast.error(t("clipboard.copyFailed"))
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={handleClick}
      data-testid="generate-password-button"
      className="h-auto px-0 gap-1.5 font-normal text-muted-foreground hover:text-foreground hover:bg-transparent [&_svg]:size-[13px]"
    >
      {copied ? (
        <>
          <CheckCircle size={13} />
          {t("passwordGenerator.copied")}
        </>
      ) : (
        <>
          <Wand2 size={13} />
          {t("passwordGenerator.generate")}
        </>
      )}
    </Button>
  )
}
