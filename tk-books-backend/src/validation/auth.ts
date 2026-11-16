import { z } from 'zod';

export const loginBody = z.object({
  email: z.string().trim().toLowerCase().email('מייל לא תקין'),
  password: z.string().min(1, 'סיסמה חובה').max(200),
});
