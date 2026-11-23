import { useEffect, useState } from "react"

// Used by BOTH sliders (news + social posts)
export function useAutoCycle(length, delay = 6000) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % length), delay)
    return () => clearInterval(id)
  }, [paused, length, delay])

  return { index, setIndex, paused, setPaused }
}