import { randomBytes, randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // בלי תווים מבלבלים (0/O, 1/I)

export function generateOrderCode(): string {
  let s = '';
  for (let i = 0; i < 6; i += 1) s += ALPHABET[randomInt(ALPHABET.length)];
  return `TK-${s}`;
}

export function generateDownloadToken(): string {
  return randomBytes(32).toString('hex');
}

export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || `item-${randomBytes(3).toString('hex')}`;
}
