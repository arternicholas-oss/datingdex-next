// Shared display formatters for the v3 plan UI.
// All DatingDex cities (DC, NYC, Atlanta, Miami, Philly) are Eastern Time,
// so we treat itinerary times as naive "America/New_York" clock times.

/**
 * Convert "HH:MM" (24-hour) to "h:MM AM/PM" for user display.
 * Leaves ICS / machine-readable formats untouched.
 */
export function formatTime12h(hhmm: string | undefined | null): string {
  if (!hhmm || typeof hhmm !== 'string') return '';
  const m = hhmm.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return hhmm;
  let h = parseInt(m[1], 10);
  const mm = m[2];
  if (isNaN(h)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mm} ${suffix}`;
}

/**
 * Format a full clock time including the Eastern Time label.
 * e.g. "18:30" → "6:30 PM ET"
 */
export function formatTime12hET(hhmm: string | undefined | null): string {
  const t = formatTime12h(hhmm);
  return t ? `${t} ET` : '';
}

/**
 * Dedupe the first sentence when a blurb is built by concatenating
 * `${hook}. ${desc}` and the hook happens to be the first sentence of desc.
 * Handles common punctuation variants.
 */
export function dedupeLeadingSentence(text: string): string {
  if (!text) return text;
  // Split on sentence boundaries, preserving punctuation.
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) return text;
  const norm = (s: string) => s.replace(/[.!?]+$/, '').trim().toLowerCase();
  if (norm(parts[0]) === norm(parts[1])) {
    return parts.slice(1).join(' ');
  }
  return parts.join(' ');
}

/**
 * Transform a "nightAtAGlance" string produced by Claude or the fallback
 * (which uses 24-hour HH:MM) into 12-hour display.
 * e.g. "18:30 Del Frisco's → 19:25 The Palm" → "6:30 PM Del Frisco's → 7:25 PM The Palm"
 */
export function glance12h(line: string | undefined | null): string {
  if (!line) return '';
  return line.replace(/\b(\d{1,2}):(\d{2})\b/g, (_m, h, mm) => formatTime12h(`${h}:${mm}`));
}
