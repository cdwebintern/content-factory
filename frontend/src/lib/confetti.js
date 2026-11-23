import confetti from "canvas-confetti"

// Pass the click event to burst from the button's position
export function celebrate(event) {
  const origin = event?.clientX
    ? { x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight }
    : { x: 0.5, y: 0.7 }

  confetti({
    particleCount: 100,
    spread: 75,
    startVelocity: 35,
    origin,
    colors: ["#e9ff6f", "#121212", "#7dd3fc", "#f9a8d4", "#ffffff"],
  })
}