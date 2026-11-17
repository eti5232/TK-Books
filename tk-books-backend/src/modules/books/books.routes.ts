import { Router } from 'express';
import { bookPageLimiter } from '../../middleware/rate-limit';
import { uploadPages } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/async-handler';
import { idParam, slugParam } from '../../utils/validation';
import * as books from './books.controller';
import { addPagesBody, adminBookListQuery, adminPageParams, bookCreateBody, bookUpdateBody, pageNumberParams } from './books.schemas';

/** מותקן על /api */
export const booksRouter = Router();
booksRouter.get('/books', h(books.listBooks));
booksRouter.get('/books/:slug', validate({ params: slugParam }), h(books.getBook));
booksRouter.get('/books/:slug/pages/:n', bookPageLimiter, validate({ params: pageNumberParams }), h(books.getBookPage));

/** מותקן על /api/admin */
export const adminBooksRouter = Router();
adminBooksRouter.get('/books', validate({ query: adminBookListQuery }), h(books.adminListBooks));
adminBooksRouter.post('/books', validate({ body: bookCreateBody }), h(books.createBook));
adminBooksRouter.get('/books/:id', validate({ params: idParam }), h(books.adminGetBook));
adminBooksRouter.put('/books/:id', validate({ params: idParam, body: bookUpdateBody }), h(books.updateBook));
adminBooksRouter.delete('/books/:id', validate({ params: idParam }), h(books.deleteBook));
adminBooksRouter.post('/books/:id/pages', validate({ params: idParam }), uploadPages, validate({ body: addPagesBody }), h(books.addPages));
adminBooksRouter.delete('/books/:id/pages/:n', validate({ params: adminPageParams }), h(books.deletePage));
