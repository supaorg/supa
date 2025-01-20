export function isTauri() {
  return typeof window !== "undefined" && "isTauri" in window;
}