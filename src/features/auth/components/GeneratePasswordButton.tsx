import { toast } from "sonner"
import { Wand2, CheckCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { generatePassword } from "../utils/generatePassword"

type GeneratePasswordButtonProps = {
  onGenerate: (password: string) => void
}

export function GeneratePasswordButton({
  onGenerate,
}: GeneratePasswordButtonProps) {
  const { t } = useTranslation("auth")
  const { isCopied, copy } = useCopyToClipboard()

  async function handleClick() {
    const password = generatePassword()
    onGenerate(password)

    const didCopy = await copy(password)
    if (!didCopy) toast.error(t("clipboard.copyFailed"))
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
      {isCopied ? (
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
