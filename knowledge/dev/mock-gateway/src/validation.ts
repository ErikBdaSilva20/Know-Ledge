// Server-side enforcement — mirrors src/lib/validation.ts on the frontend,
// which only gives the user immediate feedback. This is the actual boundary:
// never trust the client to have run its copy.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function passwordError(password: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters long";
  if (!/\d/.test(password)) return "Password must contain at least 1 number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least 1 special character";
  return null;
}
