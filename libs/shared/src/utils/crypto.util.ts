import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'crypto';

export function generateApiKey(prefix = 'kb_live_sk'): string {
  const key = randomBytes(32).toString('hex');
  return `${prefix}_${key}`;
}

export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

export function generateId(): string {
  return randomBytes(16).toString('hex');
}

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_KEY = process.env.ENCRYPTION_KEY || 'kaizech_brain_master_encryption_key_2026_aes256';

export function encryptSecret(text: string, secretKey?: string): string {
  if (!text || typeof text !== 'string') return '';
  if (text.startsWith('enc_v1:')) return text; // Already encrypted
  const keyHex = createHash('sha256').update(secretKey || DEFAULT_KEY).digest('hex').substring(0, 64);
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `enc_v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptSecret(cipherText: string, secretKey?: string): string {
  if (!cipherText || typeof cipherText !== 'string') return '';
  if (!cipherText.startsWith('enc_v1:')) return cipherText; // Plaintext fallback
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 4) return cipherText;
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];
    const keyHex = createHash('sha256').update(secretKey || DEFAULT_KEY).digest('hex').substring(0, 64);
    const key = Buffer.from(keyHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return cipherText;
  }
}

