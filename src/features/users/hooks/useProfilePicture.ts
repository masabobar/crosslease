import { useTranslation } from "react-i18next"
import { useToastStore } from "@/store/toastStore"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import { useUploadSelfPicture } from "@/features/users/hooks/useUploadSelfPicture"
import { useDeleteSelfPicture } from "@/features/users/hooks/useDeleteSelfPicture"

export function useProfilePicture(userId: string) {
  const { t } = useTranslation("users")
  const showToast = useToastStore(s => s.showToast)
  const uploadMutation = useUploadSelfPicture(userId)
  const deleteMutation = useDeleteSelfPicture(userId)

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    void uploadMutation
      .mutateAsync(file)
      .then(() => {
        showToast({
          variant: "success",
          title: t("detail.page.selfProfile.pictureUpdated.title"),
          message: t("detail.page.selfProfile.pictureUpdated.message"),
        })
      })
      .catch((err: unknown) => {
        toast.error(
          err instanceof ApiError
            ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")
        )
      })
  }

  function handleRemovePicture() {
    void deleteMutation
      .mutateAsync()
      .then(() => {
        showToast({
          variant: "success",
          title: t("detail.page.selfProfile.pictureRemoved.title"),
          message: t("detail.page.selfProfile.pictureRemoved.message"),
        })
      })
      .catch((err: unknown) => {
        toast.error(
          err instanceof ApiError
            ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")
        )
      })
  }

  return {
    uploadMutation,
    deleteMutation,
    handleFileSelected,
    handleRemovePicture,
    isPending: uploadMutation.isPending || deleteMutation.isPending,
  }
}
