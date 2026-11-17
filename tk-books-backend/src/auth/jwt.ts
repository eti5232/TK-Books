import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string;
  role: 'ADMIN';
}

export function signToken(payload: TokenPayload): string {
  const options: SignOptions = { algorithm: 'HS256', expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): { sub: string; role: string } {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || typeof decoded['role'] !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub: decoded.sub, role: decoded['role'] as string };
}
