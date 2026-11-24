const smooth = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function scrollToId(id, block = "start") {
  document.getElementById(id)?.scrollIntoView({ behavior: smooth() ? "smooth" : "auto", block })
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: smooth() ? "smooth" : "auto" })
}