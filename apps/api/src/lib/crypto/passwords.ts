import { argon2id, hash, verify } from 'argon2';

/**
 * Argon2id password hashing. See CODING_STANDARDS.md + ADR-0007.
 * Parameters: memoryCost 64MB, timeCost 3, parallelism 4 — matches
 * OWASP recommendation for interactive logins.
 */
export function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, {
    type: argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export function verifyPassword(digest: string, plaintext: string): Promise<boolean> {
  return verify(digest, plaintext);
}
