import { z } from 'zod';

export const downloadTokenParams = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'קישור לא תקין') });
