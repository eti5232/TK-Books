import bcrypt from 'bcryptjs';
import { unauthorized } from '../../utils/app-error';
import { signToken } from '../../auth/jwt';
import { prisma } from '../../db/prisma';

// hash קבוע לצורך השוואה גם כשהמשתמש לא קיים (מקשה על ניחוש מיילים לפי זמן תגובה)
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export async function login(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !ok) throw unauthorized('INVALID_CREDENTIALS', 'מייל או סיסמה שגויים / Wrong email or password');
  const token = signToken({ sub: admin.id, role: 'ADMIN' });
  return { token, tokenType: 'Bearer' as const, admin: { id: admin.id, email: admin.email, name: admin.name, role: 'ADMIN' as const } };
}

export async function me(adminId: string) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw unauthorized('INVALID_TOKEN', 'המשתמשת לא קיימת עוד / Account no longer exists');
  return { id: admin.id, email: admin.email, name: admin.name, role: 'ADMIN' as const };
}
