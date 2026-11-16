import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLang } from '../i18n';
import { Lizzy } from './Lizzy';

function TeachersBanner() {
  const { t } = useLang();
  return (
    <div className="teachers-banner" role="note">
      <span aria-hidden="true">🍎</span> {t('banner.teachersOnly')}
    </div>
  );
}

function CartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </svg>
  );
}

export function Header() {
  const { t, lang, setLang } = useLang();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  const links: [string, string][] = [
    ['/', t('nav.home')],
    ['/books', t('nav.books')],
    ['/shop', t('nav.shop')],
    ['/faq', t('nav.faq')],
    ['/track', t('nav.track')],
    ['/contact', t('nav.contact')],
  ];

  return (
    <header className="site-header">
      <TeachersBanner />
      <div className="site-header__bar container">
        <Link to="/" className="brand" aria-label="TK Books">
          <Lizzy pose="face" height={44} />
          <span className="brand__name">TK Books</span>
        </Link>

        <nav className={`nav ${open ? 'nav--open' : ''}`} aria-label={t('nav.main')}>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__tools">
          <button type="button" className="lang-switch" onClick={() => setLang(lang === 'he' ? 'en' : 'he')} aria-label={t('lang.switch')}>
            {lang === 'he' ? 'EN' : 'עב'}
          </button>
          <Link to="/cart" className="cart-link" aria-label={`${t('nav.cart')} (${count})`}>
            <CartIcon />
            {count > 0 && <span className="cart-link__badge">{count}</span>}
          </Link>
          <button type="button" className="burger" aria-label={t('nav.menu')} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <div className="brand brand--footer">
            <Lizzy pose="face" height={40} />
            <span className="brand__name">TK Books</span>
          </div>
          <p>{t('banner.teachersOnly')}</p>
        </div>
        <div className="site-footer__links">
          <Link to="/books">{t('nav.books')}</Link>
          <Link to="/shop">{t('nav.shop')}</Link>
          <Link to="/faq">{t('nav.faq')}</Link>
          <Link to="/contact">{t('nav.contact')}</Link>
          <Link to="/admin" className="site-footer__admin">
            {t('nav.admin')}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip
      </a>
      <Header />
      <main id="main" className="site-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
