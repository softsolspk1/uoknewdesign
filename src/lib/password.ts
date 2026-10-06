import bcrypt from "bcryptjs";

const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/;

export function isBcryptHash(value: string): boolean {
  return BCRYPT_HASH_RE.test(value);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(plain, stored);
  }
  // Legacy plaintext row that predates hashing — accept a direct match so
  // existing accounts don't get locked out, but the caller re-hashes and
  // persists it immediately so this path is only ever hit once per account.
  return plain === stored;
}
