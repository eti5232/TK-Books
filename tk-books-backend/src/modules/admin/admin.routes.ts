import { Router } from 'express';
import { uploadSingle } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/async-handler';
import * as admin from './admin.controller';
import { customersQuery, uploadBody } from './admin.schemas';

/** מותקן על /api/admin (אחרי authenticate + requireAdmin) */
export const adminRouter = Router();
adminRouter.get('/stats', h(admin.stats));
adminRouter.get('/customers', validate({ query: customersQuery }), h(admin.customers));
adminRouter.post('/uploads', uploadSingle, validate({ body: uploadBody }), h(admin.upload));
