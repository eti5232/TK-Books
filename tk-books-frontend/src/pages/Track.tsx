import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { Field } from '../components/ui/Field';
import { Lizzy } from '../components/Lizzy';
import { PageHeader, Tag } from '../components/ui';
import { useLang } from '../i18n';
import { daysLeft, fmtDate, money, pick } from '../utils/format';
import type { OrderStatus, TrackedOrder } from '../types';

const STEPS: OrderStatus[] = ['PENDING', 'PAID', 'ORDERED', 'SHIPPED', 'DELIVERED'];

function Timeline({ order }: { order: TrackedOrder }) {
  const { t, lang } = useLang();
  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
    return (
      <div className="alert alert--error">
        <strong>{t(`status.${order.status}`)}</strong>
        {order.statusNote && <p>{order.statusNote}</p>}
      </div>
    );
  }
  // הזמנה דיגיטלית בלבד עוברת ישר ל"נמסרה" אחרי התשלום; לא מציגים שלבי משלוח
  const steps = order.hasPhysicalItems ? STEPS : (['PENDING', 'DELIVERED'] as OrderStatus[]);
  const current = steps.indexOf(order.status);
  const dates: Record<string, string | null> = { PENDING: order.createdAt, PAID: order.paidAt, ORDERED: order.orderedAt, SHIPPED: order.shippedAt, DELIVERED: order.deliveredAt };
  return (
    <ol className="timeline">
      {steps.map((s, i) => {
        const done = i < current || (order.status === 'DELIVERED' && i === current);
        return (
        <li key={s} className={done ? 'is-done' : i === current ? 'is-current' : ''}>
          <span className="timeline__dot">{done ? '✓' : i + 1}</span>
          <strong>{t(`timeline.${s}`)}</strong>
          <small>{dates[s] ? fmtDate(dates[s], lang) : ''}</small>
        </li>
        );
      })}
    </ol>
  );
}

export default function Track() {
  const { t, lang } = useLang();
  const [sp] = useSearchParams();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ code: string; email: string }>({ defaultValues: { code: sp.get('code') ?? '', email: '' } });

  const onSubmit = async (f: { code: string; email: string }) => {
    setError(null);
    setOrder(null);
    setEmail(f.email.trim());
    try {
      setOrder(await api<TrackedOrder>('/api/orders/track', { body: { code: f.code.trim(), email: f.email.trim() } }));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? t('track.notFound') : e instanceof ApiError && e.status === 429 ? t('error.tooMany') : t('error.generic'));
    }
  };

  return (
    <>
      <PageHeader title={t('track.title')} subtitle={t('track.subtitle')} />
      <div className="container section track">
        <form className="card form form--narrow" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          <Field label={t('track.code')} htmlFor="code" required error={errors.code?.message}>
            <input id="code" className="input" dir="ltr" placeholder="TK-XXXXXX" {...register('code', { required: t('form.required'), pattern: { value: /^TK-[A-Za-z0-9]{6}$/, message: t('track.badCode') } })} />
          </Field>
          <Field label={t('form.email')} htmlFor="temail" required error={errors.email?.message}>
            <input id="temail" className="input" dir="ltr" type="email" {...register('email', { required: t('form.required'), pattern: { value: /^\S+@\S+\.\S+$/, message: t('form.badEmail') } })} />
          </Field>
          <button className="btn btn--primary btn--block" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('track.submit')}
          </button>
          <p className="muted">{t('track.demoHint')}</p>
        </form>

        {error && (
          <div className="notice">
            <Lizzy pose="confused" height={150} />
            <h2>{error}</h2>
          </div>
        )}

        {order && (
          <div className="card order-view">
            <div className="order-view__head">
              <div>
                <h2>
                  {t('track.order')} <span dir="ltr">{order.code}</span>
                </h2>
                <Tag tone={order.status === 'REFUNDED' || order.status === 'CANCELLED' ? 'red' : order.status === 'DELIVERED' ? 'green' : 'sky'}>{t(`status.${order.status}`)}</Tag>
              </div>
              <strong className="price price--lg">{money(order.totalAgorot)}</strong>
            </div>

            <Timeline order={order} />

            {order.canPay && (
              <div className="alert alert--warn">
                <strong>{t('track.unpaid')}</strong>
                <Link to="/pay" state={{ code: order.code, email, total: order.totalAgorot }} className="btn btn--primary btn--sm">
                  {t('track.pay')}
                </Link>
              </div>
            )}

            {order.trackingNumber && (
              <div className="infobox">
                <span aria-hidden="true">🚚</span>
                <div>
                  {t('track.tracking')}: <strong dir="ltr">{order.trackingNumber}</strong>
                </div>
              </div>
            )}

            {order.hasPhysicalItems && order.estimatedDeliveryAt && order.status !== 'DELIVERED' && !order.canPay && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
              <div className="infobox">
                <span aria-hidden="true">📦</span>
                <div>
                  {t('track.eta')}: <strong>{fmtDate(order.estimatedDeliveryAt, lang)}</strong> ({t('track.etaNote')})
                </div>
              </div>
            )}

            {order.deliveryLate && (
              <div className="alert alert--warn" role="alert">
                <strong>{t('track.late')}</strong>
                <p>
                  {t('track.lateText')} <span dir="ltr">{order.supportEmail}</span>
                </p>
                <Link to={`/contact?order=${order.code}`} className="btn btn--primary btn--sm">
                  {t('track.contactUs')}
                </Link>
              </div>
            )}

            <h3>{t('track.items')}</h3>
            <ul className="order-items">
              {order.items.map((i) => (
                <li key={i.id}>
                  <div>
                    <strong>
                      {pick(lang, i, 'name')} × {i.quantity}
                    </strong>
                    <small className="muted"> · {i.kind === 'DIGITAL' ? t('shop.digital') : t('shop.physical')}</small>
                  </div>
                  <div>{money(i.lineTotalAgorot)}</div>
                  {i.download && (
                    <div className="download-box">
                      {i.download.expired ? (
                        <span className="muted">{t('track.expired')}</span>
                      ) : (
                        <>
                          <a className="btn btn--secondary btn--sm" href={i.download.url} download>
                            ⬇ {t('common.download')}
                          </a>
                          <small>
                            {t('track.downloadNote')} · {t('track.daysLeft', { count: daysLeft(i.download.expiresAt) })}
                          </small>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
