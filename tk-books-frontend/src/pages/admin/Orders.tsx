import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError, qs } from '../../api/client';
import { Loading, Pagination } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useLang } from '../../i18n';
import { fmtDate, fmtDateTime, money, pick } from '../../utils/format';
import type { AdminOrder, OrderStatus, Paginated } from '../../types';
import { Modal } from '../../components/ui';
import { StatusTag } from '../../components/admin/parts';

const STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'ORDERED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export function OrdersList() {
  const { t, lang } = useLang();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const list = useQuery({
    queryKey: ['admin', 'orders', status, page, q],
    queryFn: () => api<Paginated<AdminOrder>>(`/api/admin/orders${qs({ status, page, pageSize: 15, q })}`, { auth: true }),
  });
  return (
    <div className="admin-page">
      <h1>{t('admin.nav.orders')}</h1>
      <div className="admin-toolbar">
        <div className="chips">
          {['', ...STATUSES].map((s) => (
            <button key={s} type="button" className={`chip ${status === s ? 'is-active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>
              {s ? t(`status.${s}`) : t('shop.all')}
            </button>
          ))}
        </div>
        <form className="filters__row" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(text.trim()); }}>
          <input className="input" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('admin.orderSearch')} />
          <button className="btn btn--secondary" type="submit">{t('shop.searchBtn')}</button>
        </form>
      </div>
      {list.isLoading && <Loading />}
      {list.data && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.code')}</th>
                  <th>{t('admin.customer')}</th>
                  <th>{t('admin.items')}</th>
                  <th>{t('admin.total')}</th>
                  <th>{t('admin.status')}</th>
                  <th>{t('admin.date')}</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.length === 0 && (
                  <tr><td colSpan={6} className="muted">{t('admin.noRows')}</td></tr>
                )}
                {list.data.items.map((o) => (
                  <tr key={o.id}>
                    <td dir="ltr"><Link to={`/admin/orders/${o.id}`}><strong>{o.code}</strong></Link></td>
                    <td>{o.customerName}<br /><small className="muted" dir="ltr">{o.customerEmail}</small></td>
                    <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td>{money(o.totalAgorot)}</td>
                    <td><StatusTag status={o.status} /></td>
                    <td>{fmtDateTime(o.createdAt, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={list.data.page} totalPages={list.data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const toast = useToast();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<'cancel' | 'refund' | 'ship' | null>(null);
  const [reason, setReason] = useState('');
  const [tracking, setTracking] = useState('');

  const order = useQuery({ queryKey: ['admin', 'order', id], queryFn: () => api<AdminOrder>(`/api/admin/orders/${id}`, { auth: true }), enabled: !!id });

  const act = useMutation({
    mutationFn: (v: { action: string; body?: unknown; method?: 'PATCH' | 'POST' }) => api<AdminOrder>(`/api/admin/orders/${id}/${v.action}`, { method: v.method ?? 'PATCH', body: v.body ?? (v.method === 'POST' ? undefined : {}), auth: true }),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'order', id], data);
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast(t('admin.orderUpdated'));
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : t('error.generic'), 'error'),
  });

  if (order.isLoading) return <div className="admin-page"><Loading /></div>;
  const o = order.data;
  if (!o) return <div className="admin-page"><div className="alert alert--error">{t('error.generic')}</div></div>;

  const s = o.status;
  return (
    <div className="admin-page">
      <Link to="/admin/orders" className="back-link">‹ {t('admin.nav.orders')}</Link>
      <div className="admin-page__head">
        <h1><span dir="ltr">{o.code}</span> <StatusTag status={s} /></h1>
        <div className="table__actions">
          {s === 'PAID' && <button type="button" className="btn btn--primary" onClick={() => act.mutate({ action: 'mark-ordered' })}>{t('admin.markOrdered')}</button>}
          {(s === 'PAID' || s === 'ORDERED') && <button type="button" className="btn btn--primary" onClick={() => setDialog('ship')}>{t('admin.markShipped')}</button>}
          {s === 'SHIPPED' && <button type="button" className="btn btn--primary" onClick={() => act.mutate({ action: 'deliver' })}>{t('admin.markDelivered')}</button>}
          {(s === 'PAID' || s === 'ORDERED' || s === 'SHIPPED' || s === 'DELIVERED') && o.items.some((i) => i.download) && (
            <button type="button" className="btn btn--outline btn--sm" onClick={() => act.mutate({ action: 'extend-download', method: 'POST' })}>{t('admin.extend')}</button>
          )}
          {s === 'PENDING' && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDialog('cancel')}>{t('admin.cancel')}</button>}
          {(s === 'PAID' || s === 'ORDERED' || s === 'SHIPPED' || s === 'DELIVERED') && <button type="button" className="btn btn--danger btn--sm" onClick={() => setDialog('refund')}>{t('admin.refund')}</button>}
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3>{t('admin.customer')}</h3>
          <p><strong>{o.customerName}</strong></p>
          <p dir="ltr">{o.customerEmail}</p>
          {o.customerPhone && <p dir="ltr">{o.customerPhone}</p>}
          <p className="muted">{t('admin.lang')}: {o.preferredLanguage === 'he' ? 'עברית' : 'English'}</p>
          {o.shippingAddress && (
            <p>📍 {o.shippingAddress.street}, {o.shippingAddress.city} {o.shippingAddress.zip ?? ''}</p>
          )}
          {o.notes && <p className="infobox">{o.notes}</p>}
          {o.adminNote && <p className="muted">{t('admin.adminNote')}: {o.adminNote}</p>}
        </div>
        <div className="card">
          <h3>{t('admin.timeline')}</h3>
          <ul className="plain-list">
            <li>{t('timeline.PENDING')}: {fmtDateTime(o.createdAt, lang)}</li>
            <li>{t('timeline.PAID')}: {fmtDateTime(o.paidAt, lang)}</li>
            <li>{t('timeline.ORDERED')}: {fmtDateTime(o.orderedAt, lang)}</li>
            <li>{t('timeline.SHIPPED')}: {fmtDateTime(o.shippedAt, lang)}</li>
            <li>{t('timeline.DELIVERED')}: {fmtDateTime(o.deliveredAt, lang)}</li>
            <li>{t('track.eta')}: {fmtDate(o.estimatedDeliveryAt, lang)}</li>
            {o.trackingNumber && <li>{t('track.tracking')}: <span dir="ltr">{o.trackingNumber}</span></li>}
            {o.paymentRef && <li>{t('admin.paymentRef')}: <span dir="ltr">{o.paymentRef}</span></li>}
          </ul>
        </div>
      </div>

      <h2>{t('track.items')}</h2>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{t('admin.product')}</th><th>{t('admin.kind')}</th><th>{t('cart.quantity')}</th><th>{t('admin.price')}</th><th>{t('admin.total')}</th><th>{t('admin.download')}</th></tr></thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={i.id}>
                <td>{pick(lang, i, 'name')}</td>
                <td>{i.kind === 'DIGITAL' ? t('shop.digital') : t('shop.physical')}</td>
                <td>{i.quantity}</td>
                <td>{money(i.unitPriceAgorot)}</td>
                <td>{money(i.lineTotalAgorot)}</td>
                <td>{i.download ? (i.download.expired ? t('track.expired') : `${t('admin.until')} ${fmtDate(i.download.expiresAt, lang)} · ${i.download.downloadsLeft}`) : '–'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={4}><strong>{t('cart.total')}</strong></td><td colSpan={2}><strong>{money(o.totalAgorot)}</strong></td></tr></tfoot>
        </table>
      </div>

      {dialog && (
        <Modal title={dialog === 'ship' ? t('admin.shipTitle') : dialog === 'refund' ? t('admin.refund') : t('admin.cancel')} onClose={() => setDialog(null)}>
          {dialog === 'refund' && <p className="muted">{t('admin.confirmRefund')}</p>}
          {dialog === 'ship' ? (
            <>
              <label htmlFor="tracking">{t('admin.trackingNumber')}</label>
              <input id="tracking" className="input" dir="ltr" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            </>
          ) : (
            <>
              <label htmlFor="reason">{t('admin.reason')}</label>
              <textarea id="reason" className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </>
          )}
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setDialog(null)}>{t('common.cancel')}</button>
            <button
              type="button"
              className={dialog === 'ship' ? 'btn btn--primary' : 'btn btn--danger'}
              onClick={() => {
                act.mutate({ action: dialog, body: dialog === 'ship' ? { trackingNumber: tracking.trim() || undefined } : { reason: reason || undefined } });
                setDialog(null);
                setReason('');
                setTracking('');
              }}
            >
              {t('common.yes')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
