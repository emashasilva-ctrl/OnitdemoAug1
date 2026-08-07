// International phone format: a leading "+", country code, then the rest of
// the number. Spaces are allowed for readability (e.g. "+94 77 123 4567")
// but stripped before validating digit count.
export function isValidIntlPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return false;
  const digits = trimmed.slice(1).replace(/[\s-]/g, "");
  return /^\d{7,15}$/.test(digits);
}

// Strips everything but digits, for building a wa.me link (which takes the
// number with no "+", spaces, or punctuation).
export function toWhatsAppDigits(value: string): string {
  return value.replace(/\D/g, "");
}
