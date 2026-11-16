import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Loading } from '../components/ui';
import { useLang } from '../i18n';
import { fmtDateTime, money } from '../lib/format';
import type { AdminOrder, Paginated, Stats } from '../types';
import { StatusTag } from './parts';

export default function Dashboard() {
  const { t, lang } = useLang();
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api<Stats>('/api/admin/stats', { auth: true }) });
  const orders = useQuery({ queryKey: ['admin', 'recent-orders'], queryFn: () => api<Paginated<AdminOrder>>('/api/admin/orders?pageSize=6', { auth: true }) });

  const cards: [string, number | undefined, string, string][] = [
    [t('admin.stat.pending'), stats.data?.pendingOrders, '/admin/orders', 'sun'],
    [t('admin.stat.messages'), stats.data?.newMessages, '/admin/contacts', 'pink'],
    [t('admin.stat.products'), stats.data?.products, '/admin/products', 'sky'],
    [t('admin.stat.books'), stats.data?.books, '/admin/books', 'sky'],
    [t('admin.stat.materials'), stats.data?.materials, '/admin/materials', 'pink'],
    [t('admin.stat.orders'), stats.data?.totalOrders, '/admin/orders', 'sun'],
  ];

  return (
    <div className="admin-page">
      <h1>{t('admin.nav.dashboard')}</h1>
      {stats.isLoading && <Loading rows={1} />}
      <div className="stat-grid">
        {cards.map(([label, n, to, tone]) => (
          <Link key={label} to={to} className={`stat stat--${tone}`}>
            <strong>{n ?? '–'}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <h2>{t('admin.recentOrders')}</h2>
      {orders.data && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.code')}</th>
                <th>{t('admin.customer')}</th>
                <th>{t('admin.total')}</th>
                <th>{t('admin.status')}</th>
                <th>{t('admin.date')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.data.items.map((o) => (
                <tr key={o.id}>
                  <td dir="ltr">
                    <Link to={`/admin/orders/${o.id}`}>{o.code}</Link>
                  </td>
                  <td>{o.customerName}</td>
                  <td>{money(o.totalAgorot)}</td>
                  <td>
                    <StatusTag status={o.status} />
                  </td>
                  <td>{fmtDateTime(o.createdAt, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
