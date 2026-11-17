import { Router } from 'express';
import { downloadLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/async-handler';
import * as downloads from './downloads.controller';
import { downloadTokenParams } from './downloads.schemas';

/** מותקן על /api */
export const downloadsRouter = Router();
downloadsRouter.get('/downloads/:token', downloadLimiter, validate({ params: downloadTokenParams }), h(downloads.download));
