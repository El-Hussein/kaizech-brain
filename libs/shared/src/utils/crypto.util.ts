import { randomBytes, createHash } from 'crypto';

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
