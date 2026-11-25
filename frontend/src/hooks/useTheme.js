import { useSyncExternalStore } from "react"
import { getTheme, resolvedTheme, setTheme, subscribeTheme } from "@/lib/theme"

// theme is what the user picked ("system" | "light" | "dark"),
// resolved is the one actually showing once "system" is taken into account.
export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getTheme)
  return { theme, resolved: resolvedTheme(), setTheme }
}
