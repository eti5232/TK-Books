import { Router } from 'express';
import * as admin from '../controllers/adminController';
import { asyncHandler as h } from '../lib/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import { uploadPages, uploadSingle } from '../middleware/upload';
import { validate } from '../middleware/validate';
import {
  addPagesBody,
  adminFaqListQuery,
  adminListQuery,
  adminMaterialListQuery,
  adminPageParams,
  adminProductListQuery,
  bookCreateBody,
  bookUpdateBody,
  faqCreateBody,
  faqUpdateBody,
  materialCreateBody,
  materialUpdateBody,
  productCreateBody,
  productUpdateBody,
  uploadBody,
} from '../validation/catalog';
import { idParam, paginationQuery } from '../validation/common';
import { adminOrderListQuery, cancelBody, contactListQuery, contactUpdateBody, refundBody, shipBody } from '../validation/orders';

export const adminRouter = Router();

// כל מה שמתחת מחייב Token של מנהלת
adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/stats', h(admin.stats));
adminRouter.get('/customers', validate({ query: paginationQuery(20).extend({ q: adminListQuery.shape.q }) }), h(admin.customers));
adminRouter.post('/uploads', uploadSingle, validate({ body: uploadBody }), h(admin.upload));

/* ספרים */
adminRouter.get('/books', validate({ query: adminListQuery }), h(admin.listBooks));
adminRouter.post('/books', validate({ body: bookCreateBody }), h(admin.createBook));
adminRouter.get('/books/:id', validate({ params: idParam }), h(admin.getBook));
adminRouter.put('/books/:id', validate({ params: idParam, body: bookUpdateBody }), h(admin.updateBook));
adminRouter.delete('/books/:id', validate({ params: idParam }), h(admin.deleteBook));
adminRouter.post('/books/:id/pages', validate({ params: idParam }), uploadPages, validate({ body: addPagesBody }), h(admin.addPages));
adminRouter.delete('/books/:id/pages/:n', validate({ params: adminPageParams }), h(admin.deletePage));

/* חומרי למידה */
adminRouter.get('/materials', validate({ query: adminMaterialListQuery }), h(admin.listMaterials));
adminRouter.post('/materials', validate({ body: materialCreateBody }), h(admin.createMaterial));
adminRouter.get('/materials/:id', validate({ params: idParam }), h(admin.getMaterial));
adminRouter.put('/materials/:id', validate({ params: idParam, body: materialUpdateBody }), h(admin.updateMaterial));
adminRouter.delete('/materials/:id', validate({ params: idParam }), h(admin.deleteMaterial));

/* שאלות נפוצות */
adminRouter.get('/faqs', validate({ query: adminFaqListQuery }), h(admin.listFaqs));
adminRouter.post('/faqs', validate({ body: faqCreateBody }), h(admin.createFaq));
adminRouter.put('/faqs/:id', validate({ params: idParam, body: faqUpdateBody }), h(admin.updateFaq));
adminRouter.delete('/faqs/:id', validate({ params: idParam }), h(admin.deleteFaq));

/* מוצרים */
adminRouter.get('/products', validate({ query: adminProductListQuery }), h(admin.listProducts));
adminRouter.post('/products', validate({ body: productCreateBody }), h(admin.createProduct));
adminRouter.get('/products/:id', validate({ params: idParam }), h(admin.getProduct));
adminRouter.put('/products/:id', validate({ params: idParam, body: productUpdateBody }), h(admin.updateProduct));
adminRouter.delete('/products/:id', validate({ params: idParam }), h(admin.deleteProduct));

/* הזמנות */
adminRouter.get('/orders', validate({ query: adminOrderListQuery }), h(admin.listOrders));
adminRouter.get('/orders/:id', validate({ params: idParam }), h(admin.getOrder));
adminRouter.patch('/orders/:id/mark-ordered', validate({ params: idParam }), h(admin.markOrdered));
adminRouter.patch('/orders/:id/refund', validate({ params: idParam, body: refundBody }), h(admin.refundOrder));
adminRouter.patch('/orders/:id/cancel', validate({ params: idParam, body: cancelBody }), h(admin.cancelOrder));
adminRouter.patch('/orders/:id/ship', validate({ params: idParam, body: shipBody }), h(admin.shipOrder));
adminRouter.patch('/orders/:id/deliver', validate({ params: idParam }), h(admin.deliverOrder));
adminRouter.post('/orders/:id/extend-download', validate({ params: idParam }), h(admin.extendDownloads));

/* פניות */
adminRouter.get('/contact-messages', validate({ query: contactListQuery }), h(admin.listContacts));
adminRouter.patch('/contact-messages/:id', validate({ params: idParam, body: contactUpdateBody }), h(admin.updateContact));
adminRouter.delete('/contact-messages/:id', validate({ params: idParam }), h(admin.deleteContact));
