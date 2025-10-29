export function isUmEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  return /@um\.edu\.my$/.test(trimmed);
}

export function isValidPhone(phone: string): boolean {
  // Accept E.164-like (+60123456789) or local (60123456789)
  return /^\+?\d{9,15}$/.test(phone.trim());
}

