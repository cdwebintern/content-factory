import { Search } from "lucide-react"
import { field } from "@/lib/formStyles"
import { cn } from "@/lib/utils"

export default function SearchField({ value, onChange, placeholder, label, className }) {
  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-light"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={cn(field, "pl-9")}
      />
    </div>
  )
}