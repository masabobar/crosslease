import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { InputProps } from "@/components/ui/input"

type SearchInputProps = Omit<InputProps, "endAction">

function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <Input
      className={className}
      endAction={
        <Search
          size={16}
          className="text-muted-foreground pointer-events-none"
        />
      }
      {...props}
    />
  )
}

export { SearchInput }
