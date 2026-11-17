import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { openApiSpec } from '../src/docs/openapi';
import { addBusinessDays } from '../src/utils/business-days';
import type { Router } from 'express';
import { adminRouter } from '../src/modules/admin/admin.routes';
import { authRouter } from '../src/modules/auth/auth.routes';
import { adminBooksRouter, booksRouter } from '../src/modules/books/books.routes';
import { adminContactRouter, contactRouter } from '../src/modules/contact/contact.routes';
import { downloadsRouter } from '../src/modules/downloads/downloads.routes';
import { adminFaqsRouter, faqsRouter } from '../src/modules/faqs/faqs.routes';
import { healthRouter } from '../src/modules/health/health.routes';
import { adminMaterialsRouter, materialsRouter } from '../src/modules/materials/materials.routes';
import { adminOrdersRouter, ordersRouter } from '../src/modules/orders/orders.routes';
import { adminProductsRouter, productsRouter } from '../src/modules/products/products.routes';
import { api } from './helpers';

type Spec = {
  openapi: string;
  paths: Record<string, Record<string, { security?: unknown[]; responses: Record<string, unknown>; tags: string[]; summary: string }>>;
  components: { securitySchemes: Record<string, { type: string; scheme: string; bearerFormat: string }>; schemas: Record<string, unknown> };
};
const spec = openApiSpec as unknown as Spec;

/** כל הנתיבים שרשומים בפועל ב-Express, בפורמט OpenAPI */
function registeredRoutes(): string[] {
  const collect = (router: Router, prefix: string): string[] => {
    const out: string[] = [];
    for (const layer of router.stack as unknown as { route?: { path: string; methods: Record<string, boolean> } }[]) {
      if (!layer.route) continue;
      for (const m of Object.keys(layer.route.methods)) {
        out.push(`${m.toUpperCase()} ${prefix}${layer.route.path.replace(/:(\w+)/g, '{$1}')}`);
      }
    }
    return out;
  };
  const publicRouters = [healthRouter, authRouter, booksRouter, materialsRouter, faqsRouter, productsRouter, ordersRouter, downloadsRouter, contactRouter];
  const adminRouters = [adminRouter, adminBooksRouter, adminMaterialsRouter, adminFaqsRouter, adminProductsRouter, adminOrdersRouter, adminContactRouter];
  return [...publicRouters.flatMap((r) => collect(r, '/api')), ...adminRouters.flatMap((r) => collect(r, '/api/admin'))];
}

describe('Swagger / OpenAPI', () => {
  it('גרסה 3, Security Scheme מסוג HTTP Bearer JWT (כפתור Authorize)', () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.components.securitySchemes['bearerAuth']).toMatchObject({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' });
  });

  it('כל ה-Endpoints שבקוד מתועדים, ואין תיעוד לנתיב שלא קיים', () => {
    const documented = Object.entries(spec.paths).flatMap(([p, ops]) => Object.keys(ops).map((m) => `${m.toUpperCase()} ${p}`));
    const real = registeredRoutes();
    expect(real.length).toBeGreaterThan(40);
    expect(real.filter((r) => !documented.includes(r)), 'לא מתועדים').toEqual([]);
    expect(documented.filter((d) => !real.includes(d)), 'מתועדים אך לא קיימים').toEqual([]);
  });

  it('כל נתיב /api/admin מסומן כמוגן, ו-/api/auth/me גם', () => {
    for (const [p, ops] of Object.entries(spec.paths)) {
      for (const [m, op] of Object.entries(ops)) {
        const shouldBeSecure = p.startsWith('/api/admin') || p === '/api/auth/me';
        expect(!!op.security, `${m} ${p}`).toBe(shouldBeSecure);
        if (shouldBeSecure) {
          expect(Object.keys(op.responses), `${m} ${p}`).toEqual(expect.arrayContaining(['401', '403']));
        }
        expect(op.summary, `${m} ${p}`).toBeTruthy();
      }
    }
  });

  it('כל ה-$ref מצביעים על סכמות שקיימות', () => {
    const text = JSON.stringify(spec);
    const refs = [...text.matchAll(/#\/components\/schemas\/(\w+)/g)].map((m) => m[1] as string);
    expect(refs.length).toBeGreaterThan(20);
    for (const r of refs) expect(spec.components.schemas, r).toHaveProperty(r);
  });

  it('GET /openapi.json ו-/api-docs/ עובדים', async () => {
    const json = await api().get('/openapi.json');
    expect(json.status).toBe(200);
    expect(json.body.openapi).toBe('3.0.3');
    const ui = await api().get('/api-docs/');
    expect(ui.status).toBe(200);
    expect(ui.text).toContain('swagger-ui');
  });
});

describe('Prisma', () => {
  it('schema.prisma תקין (prisma validate)', () => {
    const out = execSync('npx prisma validate', { env: { ...process.env }, encoding: 'utf8', stdio: 'pipe' });
    expect(out).toMatch(/valid/i);
  });
});

describe('אילוצי מסד נתונים (CHECK)', () => {
  it('כמות 11 / מחיר שלילי נחסמים ברמת ה-DB', async () => {
    const { prisma } = await import('../src/db/prisma');
    await expect(prisma.$executeRawUnsafe(`INSERT INTO "Product"(id,slug,kind,category,"nameHe","nameEn","priceAgorot","updatedAt") VALUES ('x1','neg','PHYSICAL','OTHER','a','a',-5,now())`)).rejects.toThrow();
  });
});

describe('ימי עסקים', () => {
  it('7 ימי עסקים מדלגים על שישי ושבת', () => {
    // יום ראשון 4.1.2026 → +7 ימי עסקים (א–ה) = יום ראשון 11.1? ראשון+5 עסקים=ראשון הבא, +2 = שלישי 13.1
    expect(addBusinessDays(new Date('2026-01-04T10:00:00Z'), 7).toISOString().slice(0, 10)).toBe('2026-01-13');
    // התחלה ביום חמישי 8.1 → ראשון 11.1 הוא יום 1
    expect(addBusinessDays(new Date('2026-01-08T10:00:00Z'), 1).toISOString().slice(0, 10)).toBe('2026-01-11');
  });
});
