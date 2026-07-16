import * as Crypto from 'expo-crypto';

/**
 * Local credential helpers. Passwords are salted + SHA-256 hashed before being
 * stored, so plaintext is never persisted. NOTE: this is on-device auth for a
 * standalone app — a production system would authenticate against a backend.
 */

export function randomSalt(): string {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const hash = await hashPassword(password, salt);
  return hash === expectedHash;
}

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

/** Normalises a username to its canonical form (lowercase, trimmed). */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(normalizeUsername(username));
}

/** Synthetic email Supabase Auth uses internally for a username. */
export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@vitacare.app`;
}

export interface FieldErrors {
  name?: string;
  username?: string;
  password?: string;
  confirm?: string;
}

/** Validates the sign-up form, returning per-field errors. */
export function validateSignUp(input: {
  name: string;
  username: string;
  password: string;
  confirm: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.trim().length < 2) errors.name = 'Enter your name.';
  if (!isValidUsername(input.username))
    errors.username = '3–20 characters: letters, numbers, underscore.';
  if (input.password.length < 6)
    errors.password = 'Use at least 6 characters.';
  if (input.confirm !== input.password)
    errors.confirm = 'Passwords do not match.';
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
