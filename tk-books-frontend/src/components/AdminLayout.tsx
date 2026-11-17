import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet } from 'react-router-dom';
import { api } from '../api/client';
import { Lizzy } from './Lizzy';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';
import type { Stats } from '../types';

export default function AdminLayout() {
  const { t, lang, setLang } = useLang();
  const { admin, logout } = useAuth();
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api<Stats>('/api/admin/stats', { auth: true }), enabled: !!admin, refetchInterval: 60_000 });


  const links: [string, string, number?][] = [
    ['/admin', t('admin.nav.dashboard')],
    ['/admin/orders', t('admin.nav.orders'), stats.data?.pendingOrders],
    ['/admin/books', t('admin.nav.books')],
    ['/admin/materials', t('admin.nav.materials')],
    ['/admin/products', t('admin.nav.products')],
    ['/admin/faqs', t('admin.nav.faqs')],
    ['/admin/contacts', t('admin.nav.contacts'), stats.data?.newMessages],
    ['/admin/customers', t('admin.nav.customers')],
  ];

  return (
    <div className="admin">
      <aside className="admin__side">
        <div className="admin__brand">
          <Lizzy pose="face" height={40} />
          <strong>TK Books</strong>
        </div>
        <nav>
          {links.map(([to, label, badge]) => (
            <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `admin__link ${isActive ? 'is-active' : ''}`}>
              {label}
              {!!badge && <span className="admin__badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="admin__foot">
          <small dir="ltr">{admin?.email}</small>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setLang(lang === 'he' ? 'en' : 'he')}>
            {lang === 'he' ? 'EN' : 'עב'}
          </button>
          <NavLink to="/" className="btn btn--ghost btn--sm">
            {t('admin.viewSite')}
          </NavLink>
          <button type="button" className="btn btn--outline btn--sm" onClick={logout}>
            {t('admin.logout')}
          </button>
        </div>
      </aside>
      <section className="admin__main">
        <Outlet />
      </section>
    </div>
  );
}
