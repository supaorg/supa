export function getCurrentUnixTime(): number {
  return Math.floor(Date.now() / 1000);
}

export function getUnixTimeFromDate(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}