import { Router } from 'express';
import { z } from 'zod';
import { downloadLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/async-handler';
import { idParam, slugParam } from '../../utils/validation';
import * as materials from './materials.controller';
import { adminMaterialListQuery, materialCreateBody, materialListQuery, materialUpdateBody } from './materials.schemas';

/** מותקן על /api */
export const materialsRouter = Router();
materialsRouter.get('/books/:slug/materials', validate({ params: slugParam, query: materialListQuery }), h(materials.listMaterials));
materialsRouter.get('/materials/:id/download', downloadLimiter, validate({ params: z.object({ id: z.string().uuid() }) }), h(materials.downloadMaterial));

/** מותקן על /api/admin */
export const adminMaterialsRouter = Router();
adminMaterialsRouter.get('/materials', validate({ query: adminMaterialListQuery }), h(materials.adminListMaterials));
adminMaterialsRouter.post('/materials', validate({ body: materialCreateBody }), h(materials.createMaterial));
adminMaterialsRouter.get('/materials/:id', validate({ params: idParam }), h(materials.adminGetMaterial));
adminMaterialsRouter.put('/materials/:id', validate({ params: idParam, body: materialUpdateBody }), h(materials.updateMaterial));
adminMaterialsRouter.delete('/materials/:id', validate({ params: idParam }), h(materials.deleteMaterial));
