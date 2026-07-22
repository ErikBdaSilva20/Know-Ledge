// Client-side feedback only — the gateway (Better-Auth) mirrors the same rules
// server-side, since a client check alone is never the actual enforcement
// boundary.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export interface PasswordCheck {
  valid: boolean;
  message?: string;
}

export function checkPassword(password: string): PasswordCheck {
  if (password.length < 6) {
    return { valid: false, message: "A senha precisa ter no mínimo 6 caracteres." };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: "A senha precisa ter pelo menos 1 número." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: "A senha precisa ter pelo menos 1 caractere especial." };
  }
  return { valid: true };
}
