const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

export function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  const tier = Math.min(Math.floor(Math.log10(Math.abs(n)) / 3), SUFFIXES.length - 1);
  const scaled = n / Math.pow(10, tier * 3);
  const formatted = scaled >= 100 ? Math.floor(scaled).toString() : scaled.toFixed(1);
  return formatted + SUFFIXES[tier];
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
