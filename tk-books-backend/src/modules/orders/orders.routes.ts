import { Router } from 'express';
import { orderLimiter, trackLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/async-handler';
import { idParam } from '../../utils/validation';
import * as orders from './orders.controller';
import { adminOrderListQuery, cancelBody, orderCreateBody, payDemoBody, refundBody, shipBody, trackBody } from './orders.schemas';

/** מותקן על /api */
export const ordersRouter = Router();
ordersRouter.post('/orders', orderLimiter, validate({ body: orderCreateBody }), h(orders.createOrder));
ordersRouter.post('/orders/track', trackLimiter, validate({ body: trackBody }), h(orders.trackOrder));
ordersRouter.post('/orders/pay-demo', trackLimiter, validate({ body: payDemoBody }), h(orders.payDemo)); // תשלום דמה – 404 אם PAYMENT_DRIVER אינו fake

/** מותקן על /api/admin */
export const adminOrdersRouter = Router();
adminOrdersRouter.get('/orders', validate({ query: adminOrderListQuery }), h(orders.adminListOrders));
adminOrdersRouter.get('/orders/:id', validate({ params: idParam }), h(orders.adminGetOrder));
adminOrdersRouter.patch('/orders/:id/mark-ordered', validate({ params: idParam }), h(orders.markOrdered));
adminOrdersRouter.patch('/orders/:id/refund', validate({ params: idParam, body: refundBody }), h(orders.refundOrder));
adminOrdersRouter.patch('/orders/:id/cancel', validate({ params: idParam, body: cancelBody }), h(orders.cancelOrder));
adminOrdersRouter.patch('/orders/:id/ship', validate({ params: idParam, body: shipBody }), h(orders.shipOrder));
adminOrdersRouter.patch('/orders/:id/deliver', validate({ params: idParam }), h(orders.deliverOrder));
adminOrdersRouter.post('/orders/:id/extend-download', validate({ params: idParam }), h(orders.extendDownloads));
