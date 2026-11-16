import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, adminToken, api, auth, resetDb } from './helpers';

const SECRET = process.env['JWT_SECRET'] as string;

describe('Auth', () => {
  beforeAll(async () => {
    await resetDb();
    await adminToken();
  });

  it('Login תקין מחזיר JWT ופרטי מנהלת, בלי hash', async () => {
    const res = await api().post('/api/auth/login').send(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.tokenType).toBe('Bearer');
    expect(res.body.admin.email).toBe(ADMIN.email);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    const decoded = jwt.decode(res.body.token) as { exp: number; iat: number };
    expect(decoded.exp).toBeGreaterThan(decoded.iat); // לתוקף יש הגבלה
  });

  it('Login עם סיסמה שגויה => 401', async () => {
    const res = await api().post('/api/auth/login').send({ email: ADMIN.email, password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('Login עם מייל לא קיים => 401 (אותה תשובה)', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('Login עם קלט לא תקין => 400', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Token חסר => 401', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Token לא תקין => 401', async () => {
    const res = await api().get('/api/auth/me').set(auth('garbage.token.value'));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('Token שנחתם בסוד אחר => 401', async () => {
    const forged = jwt.sign({ sub: 'x', role: 'ADMIN' }, 'another-secret-another-secret-123456');
    expect((await api().get('/api/auth/me').set(auth(forged))).status).toBe(401);
  });

  it('Token שפג תוקפו => 401', async () => {
    const admin = await api().post('/api/auth/login').send(ADMIN);
    const expired = jwt.sign({ sub: admin.body.admin.id, role: 'ADMIN' }, SECRET, { expiresIn: -10 });
    const res = await api().get('/api/auth/me').set(auth(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('Token תקין בלי תפקיד מנהלת => 403', async () => {
    const guest = jwt.sign({ sub: 'someone', role: 'GUEST' }, SECRET, { expiresIn: '1h' });
    const res = await api().get('/api/admin/stats').set(auth(guest));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('GET /api/auth/me עם Token תקין מחזיר את המנהלת לפי ה-Token', async () => {
    const token = await adminToken();
    const res = await api().get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(ADMIN.email);
    expect(res.body.role).toBe('ADMIN');
  });

  it('כל נתיבי /api/admin דורשים Token (401 בלי)', async () => {
    for (const p of ['/api/admin/stats', '/api/admin/books', '/api/admin/orders', '/api/admin/products', '/api/admin/materials', '/api/admin/faqs', '/api/admin/contact-messages', '/api/admin/customers']) {
      expect((await api().get(p)).status, p).toBe(401);
    }
  });

  it('GET /api/health פתוח', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('נתיב לא קיים => 404 בפורמט אחיד, JSON שבור => 400', async () => {
    expect((await api().get('/api/nope')).body.error.code).toBe('ROUTE_NOT_FOUND');
    const bad = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('INVALID_JSON');
  });
});
