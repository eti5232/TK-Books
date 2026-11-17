import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/async-handler';
import { idParam, slugParam } from '../../utils/validation';
import * as products from './products.controller';
import { adminProductListQuery, productCreateBody, productListQuery, productUpdateBody } from './products.schemas';

/** מותקן על /api */
export const productsRouter = Router();
productsRouter.get('/products', validate({ query: productListQuery }), h(products.listProducts));
productsRouter.get('/products/:slug', validate({ params: slugParam }), h(products.getProduct));

/** מותקן על /api/admin */
export const adminProductsRouter = Router();
adminProductsRouter.get('/products', validate({ query: adminProductListQuery }), h(products.adminListProducts));
adminProductsRouter.post('/products', validate({ body: productCreateBody }), h(products.createProduct));
adminProductsRouter.get('/products/:id', validate({ params: idParam }), h(products.adminGetProduct));
adminProductsRouter.put('/products/:id', validate({ params: idParam, body: productUpdateBody }), h(products.updateProduct));
adminProductsRouter.delete('/products/:id', validate({ params: idParam }), h(products.deleteProduct));
