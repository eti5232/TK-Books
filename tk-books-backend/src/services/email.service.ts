import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { prisma } from '../db/prisma';
import type { Mail } from './email-templates';

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  if (!env.SMTP_HOST) {
    transporter = null;
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? '' } : undefined,
  });
  return transporter;
}

interface SendArgs {
  to: string;
  type: string;
  mail: Mail;
  orderId?: string;
  replyTo?: string;
}

/**
 * שולח מייל ורושם ביומן (EmailLog). לא זורק שגיאה – כשל במייל לא מפיל הזמנה.
 * בלי SMTP מוגדר: המייל לא נשלח, נרשם כ-SKIPPED ומודפס ללוג (שימושי בפיתוח).
 */
export async function sendMail({ to, type, mail, orderId, replyTo }: SendArgs): Promise<void> {
  let status: 'SENT' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
  let error: string | undefined;
  const t = getTransporter();
  if (!t) {
    if (!env.isTest) console.log(`✉️  [מייל לא נשלח – SMTP לא מוגדר] to=${to} subject="${mail.subject}"`);
  } else {
    try {
      await t.sendMail({ from: env.MAIL_FROM, to, subject: mail.subject, html: mail.html, replyTo });
      status = 'SENT';
    } catch (e) {
      status = 'FAILED';
      error = e instanceof Error ? e.message : String(e);
      console.error('Email send failed:', error);
    }
  }
  try {
    await prisma.emailLog.create({ data: { to, type, subject: mail.subject, status, error, orderId } });
  } catch (e) {
    console.error('EmailLog write failed:', e);
  }
}
