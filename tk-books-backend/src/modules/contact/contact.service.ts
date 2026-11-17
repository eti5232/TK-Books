import type { ContactStatus, Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import { paginate } from '../../utils/validation';
import { sendMail } from '../../services/email.service';
import * as tpl from '../../services/email-templates';

export async function createMessage(input: { name: string; email: string; subject: string; message: string; orderCode?: string }) {
  const m = await prisma.contactMessage.create({ data: { ...input, orderCode: input.orderCode ?? null } });
  await Promise.all([
    sendMail({ to: env.adminNotifyEmail, type: 'ADMIN_NEW_CONTACT', mail: tpl.adminNewContact(m), replyTo: m.email }),
    sendMail({ to: m.email, type: 'CONTACT_ACK', mail: tpl.contactAck(m.name, m.subject) }),
  ]);
  return { id: m.id, status: m.status };
}

export async function adminList(opts: { page: number; pageSize: number; status?: ContactStatus }) {
  const where: Prisma.ContactMessageWhereInput = opts.status ? { status: opts.status } : {};
  const [total, rows] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize }),
  ]);
  return paginate(rows, total, opts.page, opts.pageSize);
}

export async function setStatus(id: string, status: ContactStatus) {
  return prisma.contactMessage.update({ where: { id }, data: { status } });
}

export async function remove(id: string): Promise<void> {
  await prisma.contactMessage.delete({ where: { id } });
}
