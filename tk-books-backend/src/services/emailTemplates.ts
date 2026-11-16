import { env } from '../config/env';

type Lang = 'he' | 'en';
export interface Mail {
  subject: string;
  html: string;
}

export const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const money = (agorot: number): string => `₪${(agorot / 100).toFixed(2)}`;
const dateStr = (d: Date, lang: Lang): string => d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB');

function layout(lang: Lang, title: string, bodyHtml: string): string {
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const note = lang === 'he' ? 'החומרים באתר זה למורות בלבד' : 'The materials on this site are for teachers only';
  return `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#fff0f6;font-family:Arial,Helvetica,sans-serif;color:#33334d">
<div style="max-width:560px;margin:0 auto;padding:16px">
<div style="background:#8fd3f4;border-radius:16px 16px 0 0;padding:18px 20px;color:#fff;font-size:22px;font-weight:bold">TK Books 🌸</div>
<div style="background:#fff;border-radius:0 0 16px 16px;padding:20px;line-height:1.6">
<h2 style="margin-top:0;color:#e0559b">${esc(title)}</h2>${bodyHtml}
</div>
<p style="font-size:12px;color:#777;text-align:center">${note}</p>
</div></body></html>`;
}

interface OrderLike {
  code: string;
  customerName: string;
  preferredLanguage: Lang;
  totalAgorot: number;
  estimatedDeliveryAt: Date | null;
  adminNote: string | null;
  trackingNumber?: string | null;
  items: { productNameHe: string; productNameEn: string; quantity: number; unitPriceAgorot: number }[];
}

const itemsTable = (o: OrderLike, lang: Lang): string =>
  `<table style="width:100%;border-collapse:collapse">${o.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0">${esc(lang === 'he' ? i.productNameHe : i.productNameEn)} × ${i.quantity}</td><td style="text-align:end">${money(i.unitPriceAgorot * i.quantity)}</td></tr>`,
    )
    .join('')}<tr><td style="padding-top:8px"><b>${lang === 'he' ? 'סה"כ' : 'Total'}</b></td><td style="text-align:end;padding-top:8px"><b>${money(o.totalAgorot)}</b></td></tr></table>`;

const trackLink = (): string => `${env.frontendUrl}/track`;

export interface DownloadLink {
  name: string;
  url: string;
  expiresAt: Date;
}

/** ללקוחה: התשלום התקבל (כולל קישורי הורדה / צפי הגעה) */
export function orderPaid(o: OrderLike, links: DownloadLink[]): Mail {
  const lang = o.preferredLanguage;
  const he = lang === 'he';
  const linksHtml = links.length
    ? `<h3>${he ? 'קבצים להורדה' : 'Your downloads'}</h3><ul>${links
        .map((l) => `<li><a href="${esc(l.url)}">${esc(l.name)}</a> (${he ? 'עד' : 'until'} ${dateStr(l.expiresAt, lang)})</li>`)
        .join('')}</ul><p><b>${he ? 'ניתן להוריד ל-3 ימים בלבד.' : 'Downloads are available for 3 days only.'}</b></p>`
    : '';
  const shipHtml = o.estimatedDeliveryAt
    ? `<p>${he ? 'צפי הגעה לחבילה (עד 7 ימי עסקים)' : 'Estimated delivery (up to 7 business days)'}: <b>${dateStr(o.estimatedDeliveryAt, lang)}</b></p>
<p>${he ? `אם החבילה לא הגיעה, אפשר לפנות אלינו: ${esc(env.SUPPORT_EMAIL)}` : `If your package has not arrived, contact us: ${esc(env.SUPPORT_EMAIL)}`}</p>`
    : '';
  return {
    subject: he ? `התשלום התקבל – הזמנה ${o.code}` : `Payment received - order ${o.code}`,
    html: layout(
      lang,
      he ? `תודה ${o.customerName}, התשלום התקבל!` : `Thank you ${o.customerName}, payment received!`,
      `<p>${he ? 'קוד ההזמנה שלך' : 'Your order code'}: <b>${esc(o.code)}</b></p>${itemsTable(o, lang)}${linksHtml}${shipHtml}<p><a href="${trackLink()}">${he ? 'מעקב הזמנה' : 'Track your order'}</a></p>`,
    ),
  };
}

/** למנהלת: הזמנה חדשה ששולמה */
export function adminOrderPaid(o: OrderLike & { customerEmail: string; hasPhysical: boolean }): Mail {
  return {
    subject: `הזמנה חדשה ששולמה ${o.code} – ${o.customerName}`,
    html: layout(
      'he',
      o.hasPhysical ? 'הזמנה חדשה ששולמה – יש להזמין מהספק' : 'הזמנה דיגיטלית חדשה ששולמה (נמסרה אוטומטית)',
      `<p>${esc(o.customerName)} (${esc(o.customerEmail)})</p>${itemsTable(o, 'he')}<p><a href="${env.frontendUrl}/admin/orders">מעבר לניהול הזמנות</a></p>`,
    ),
  };
}

/** ללקוחה: ההזמנה בוטלה והוחזר כסף */
export function orderRefunded(o: OrderLike): Mail {
  const lang = o.preferredLanguage;
  const he = lang === 'he';
  return {
    subject: he ? `ההזמנה ${o.code} בוטלה והוחזר כסף` : `Order ${o.code} cancelled and refunded`,
    html: layout(
      lang,
      he ? 'ההזמנה בוטלה' : 'Your order was cancelled',
      `<p>${he ? 'ההזמנה בוטלה וזיכוי כספי יועבר אלייך.' : 'Your order was cancelled and you will be refunded.'}</p>${o.adminNote ? `<p>${esc(o.adminNote)}</p>` : ''}<p>${he ? 'לשאלות' : 'Questions'}: ${esc(env.SUPPORT_EMAIL)}</p>`,
    ),
  };
}

export function orderShipped(o: OrderLike): Mail {
  const lang = o.preferredLanguage;
  const he = lang === 'he';
  const tracking = o.trackingNumber ? `<p>${he ? 'מספר מעקב משלוח' : 'Shipment tracking number'}: <b dir="ltr">${esc(o.trackingNumber)}</b></p>` : '';
  return {
    subject: he ? `ההזמנה ${o.code} נשלחה` : `Your order ${o.code} has shipped`,
    html: layout(
      lang,
      he ? 'החבילה בדרך אלייך!' : 'Your package is on its way!',
      `${tracking}<p>${he ? 'צפי הגעה' : 'Estimated delivery'}: <b>${o.estimatedDeliveryAt ? dateStr(o.estimatedDeliveryAt, lang) : '-'}</b></p><p><a href="${trackLink()}">${he ? 'מעקב הזמנה' : 'Track your order'}</a></p>`,
    ),
  };
}

export function contactAck(name: string, subject: string): Mail {
  return {
    subject: 'קיבלנו את פנייתך / We received your message',
    html: layout('he', `שלום ${name}`, `<p>קיבלנו את הפנייה שלך בנושא "${esc(subject)}" ונחזור אלייך בהקדם.</p><p>We received your message and will get back to you soon.</p>`),
  };
}

export function adminNewContact(m: { name: string; email: string; subject: string; message: string; orderCode: string | null }): Mail {
  return {
    subject: `פנייה חדשה: ${m.subject}`,
    html: layout(
      'he',
      'פנייה חדשה מהאתר',
      `<p><b>${esc(m.name)}</b> (${esc(m.email)})${m.orderCode ? ` – הזמנה ${esc(m.orderCode)}` : ''}</p><p>${esc(m.message).replace(/\n/g, '<br>')}</p>`,
    ),
  };
}
