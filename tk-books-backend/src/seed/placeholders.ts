import sharp from 'sharp';

/** יוצר תמונת PNG פשוטה (ורוד/תכלת) עם טקסט באנגלית – מחליפים אותה אחר כך בתמונה אמיתית */
export async function placeholderPng(opts: { width: number; height: number; title: string; subtitle?: string; bg?: string; fg?: string }): Promise<Buffer> {
  const { width, height, title, subtitle = 'DEMO placeholder', bg = '#ffd6e8', fg = '#2b6f94' } = opts;
  const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#bfe8fb"/></linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/>
<rect x="${width * 0.05}" y="${height * 0.05}" width="${width * 0.9}" height="${height * 0.9}" rx="28" fill="none" stroke="#ffffff" stroke-width="8" stroke-dasharray="18 14"/>
<g font-family="Arial, Helvetica, sans-serif" text-anchor="middle" fill="${fg}">
<text x="${width / 2}" y="${height / 2}" font-size="${Math.max(24, Math.round(width / 14))}" font-weight="bold">${esc(title)}</text>
<text x="${width / 2}" y="${height / 2 + Math.max(30, width / 12)}" font-size="${Math.max(16, Math.round(width / 26))}">${esc(subtitle)}</text>
</g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function placeholderPageWebp(bookName: string, page: number, total: number): Promise<Buffer> {
  const png = await placeholderPng({ width: 1000, height: 1400, title: `${bookName} - Page ${page}`, subtitle: `Demo page ${page} of ${total} (replace with the real book)`, bg: page % 2 ? '#ffe3f0' : '#e3f4ff' });
  return sharp(png).webp({ quality: 80 }).toBuffer();
}

/** PDF תקין מינימלי עם שורת טקסט (ASCII בלבד) – קובץ דמו להורדה */
export function samplePdf(title: string): Buffer {
  const safe = title.replace(/[^\x20-\x7E]/g, '?').replace(/([()\\])/g, '\\$1');
  const stream = `BT /F1 24 Tf 72 700 Td (${safe}) Tj 0 -40 Td /F1 14 Tf (DEMO FILE - replace with the real material) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}
