import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { loginLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/async-handler';
import * as auth from './auth.controller';
import { loginBody } from './auth.schemas';

/** מותקן על /api */
export const authRouter = Router();

authRouter.post('/auth/login', loginLimiter, validate({ body: loginBody }), h(auth.login));
authRouter.get('/auth/me', authenticate, h(auth.me));
