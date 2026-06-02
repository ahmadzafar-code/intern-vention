// Ported from prototype_src/src/components.jsx. Client-only (touches document) — call
// from event handlers / effects, never during render or on the server.
export function fireConfetti() {
  const colors = ["#8C1515", "#E0A800", "#2F7D32", "#4A90E2", "#C2502F", "#5B21B6"];
  const host = document.createElement("div");
  host.className = "confetti-host";
  document.body.appendChild(host);
  for (let i = 0; i < 70; i++) {
    const bit = document.createElement("div");
    bit.className = "confetti-bit";
    const size = 6 + Math.random() * 7;
    bit.style.left = Math.random() * 100 + "vw";
    bit.style.width = size + "px";
    bit.style.height = size * (0.5 + Math.random()) + "px";
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = Math.random() * 0.25 + "s";
    bit.style.animationDuration = 1.5 + Math.random() * 1.2 + "s";
    bit.style.transform = `rotate(${Math.random() * 360}deg)`;
    host.appendChild(bit);
  }
  setTimeout(() => host.remove(), 3200);
}
