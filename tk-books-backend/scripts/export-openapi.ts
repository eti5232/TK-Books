import fs from 'node:fs';
import path from 'node:path';
import { openApiSpec } from '../src/docs/openapi';

const out = path.resolve('docs', 'openapi.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(openApiSpec, null, 2)}\n`, 'utf8');
console.log(`נכתב: ${out}`);
