/** Mirrors LocalNotes-backend accounts.helpers.is_work_email */
const CONSUMER_EMAIL_ENDINGS = ["gmail.com", "yahoo.com", "hotmail.com"];

export function isWorkEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return !CONSUMER_EMAIL_ENDINGS.some((ending) => normalized.endsWith(ending));
}
