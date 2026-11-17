import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/async-handler';
import { idParam } from '../../utils/validation';
import * as faqs from './faqs.controller';
import { adminFaqListQuery, faqCreateBody, faqListQuery, faqUpdateBody } from './faqs.schemas';

/** מותקן על /api */
export const faqsRouter = Router();
faqsRouter.get('/faqs', validate({ query: faqListQuery }), h(faqs.listFaqs));

/** מותקן על /api/admin */
export const adminFaqsRouter = Router();
adminFaqsRouter.get('/faqs', validate({ query: adminFaqListQuery }), h(faqs.adminListFaqs));
adminFaqsRouter.post('/faqs', validate({ body: faqCreateBody }), h(faqs.createFaq));
adminFaqsRouter.put('/faqs/:id', validate({ params: idParam, body: faqUpdateBody }), h(faqs.updateFaq));
adminFaqsRouter.delete('/faqs/:id', validate({ params: idParam }), h(faqs.deleteFaq));
