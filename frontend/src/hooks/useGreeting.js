import { useState } from "react"

const MESSAGES = {
  morning: [
    (n) => `Wow, ${n}! You're back! 🌟`,
    (n) => `Good morning, ${n}!`,
  ],
  afternoon: [
  
    (n) => `Good afternoon, ${n}!`,
    (n) => `Welcome back, ${n}! `,
  ],
  evening: [
    (n) => `Good evening, ${n}!`,
  ],
}

const getSlot = () => {
  const h = new Date().getHours()
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"
}

// Picked once on mount so it doesn't change on every re-render
export function useGreeting(name) {
  const [message] = useState(() => {
    const list = MESSAGES[getSlot()]
    return list[Math.floor(Math.random() * list.length)](name)
  })
  return message
}