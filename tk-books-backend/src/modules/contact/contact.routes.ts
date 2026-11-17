import { Router } from 'express';
import { contactLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/async-handler';
import { idParam } from '../../utils/validation';
import * as contact from './contact.controller';
import { contactBody, contactListQuery, contactUpdateBody } from './contact.schemas';

/** מותקן על /api */
export const contactRouter = Router();
contactRouter.post('/contact', contactLimiter, validate({ body: contactBody }), h(contact.createMessage));

/** מותקן על /api/admin */
export const adminContactRouter = Router();
adminContactRouter.get('/contact-messages', validate({ query: contactListQuery }), h(contact.listMessages));
adminContactRouter.patch('/contact-messages/:id', validate({ params: idParam, body: contactUpdateBody }), h(contact.updateMessage));
adminContactRouter.delete('/contact-messages/:id', validate({ params: idParam }), h(contact.deleteMessage));
