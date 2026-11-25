// Theme choice is stored per device and applied as a class on <html>,
// so both the CSS tokens and Tailwind's dark: variant follow it.
const STORAGE_KEY = "content-factory:theme"
// How long the fallback color fade runs before the helper class is removed
const FADE_MS = 420

export const THEMES = ["system", "light", "dark"]

const darkQuery = () =>
  typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)")

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return THEMES.includes(value) ? value : "system"
  } catch {
    return "system"
  }
}

let theme = readStored()
const listeners = new Set()

export const getTheme = () => theme

export function subscribeTheme(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// "system" follows the OS setting, anything else is what the user picked
export const resolvedTheme = () =>
  theme === "system" ? (darkQuery()?.matches ? "dark" : "light") : theme

function notify() {
  for (const listener of listeners) listener()
}

function paint() {
  const dark = resolvedTheme() === "dark"
  document.documentElement.classList.toggle("dark", dark)
  document.documentElement.style.colorScheme = dark ? "dark" : "light"
}

let fadeTimer = 0

// Swap the palette with a crossfade. Chrome/Safari use a View Transition
// (which also covers gradients); other browsers ease the color properties.
function switchWithMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    paint()
    return
  }

  if (typeof document.startViewTransition === "function") {
    document.startViewTransition(paint)
    return
  }

  const root = document.documentElement
  root.classList.add("theme-switching")
  paint()
  window.clearTimeout(fadeTimer)
  fadeTimer = window.setTimeout(() => root.classList.remove("theme-switching"), FADE_MS)
}

// First paint is instant: only later, user-driven swaps should animate.
export function applyTheme() {
  paint()
}

export function setTheme(next) {
  if (!THEMES.includes(next)) return
  theme = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // private mode: keep the choice for this page only
  }
  switchWithMotion()
  notify()
}

// Keep following the OS while the choice is still "system"
darkQuery()?.addEventListener("change", () => {
  if (theme !== "system") return
  switchWithMotion()
  notify()
})

paint()
