import { randomBytes } from 'node:crypto';
import { env } from '../config/env';

/**
 * שכבת תשלום. כרגע יש רק מצב "fake" (דמה): לא גובה כסף ולא מדבר עם חברת סליקה.
 *
 * כשתהיה חברת סליקה אמיתית (Cardcom / PayPlus / Tranzila / סאמיט...):
 *  1. מוסיפים כאן driver חדש שיוצר "קישור לתשלום" (דף תשלום מתארח אצלם).
 *  2. מוסיפים נתיב webhook שמאמת את החתימה של חברת הסליקה וקורא ל-orderService.markPaid.
 *  פרטי כרטיס אשראי אף פעם לא עוברים בשרת שלנו.
 */
export const mode = (): 'fake' => env.PAYMENT_DRIVER;

export const newDemoRef = (): string => `DEMO-${randomBytes(5).toString('hex').toUpperCase()}`;
