import { useEffect, useState } from "react"

// Re-renders every `interval` ms so "Starts in 25 min" stays fresh
export function useNow(interval = 30000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval)
    return () => clearInterval(id)
  }, [interval])

  return now
}