// Client-safe email helpers shared between the /info-submission form and its
// API routes. Kept separate from emailOtp.ts (which pulls in nodemailer/crypto)
// so this can be imported from client components without bloating the bundle.

// Zero-width space/joiners, word joiner, BOM, non-breaking space: characters
// commonly introduced by copy-pasting an email from Outlook/Word signature
// blocks that otherwise make an address silently fail validation even though
// it looks correct on screen.
const INVISIBLE_CHARS = new RegExp(
  "[\\u200B\\u200C\\u200D\\u2060\\uFEFF\\u00A0]",
  "g"
);

export function normalizeEmail(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  return raw.normalize("NFKC").replace(INVISIBLE_CHARS, "").trim().toLowerCase();
}

/**
 * Validates that an email belongs to the official @uok.edu.pk domain.
 */
export function isValidUokEmail(email: string): boolean {
  const cleaned = normalizeEmail(email);
  if (!cleaned) return false;
  return /^[a-zA-Z0-9._%+-]+@uok\.edu\.pk$/i.test(cleaned);
}
