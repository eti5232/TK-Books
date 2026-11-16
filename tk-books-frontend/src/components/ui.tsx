import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useLang } from '../i18n';
import { Lizzy, type LizzyPose } from './Lizzy';

/** כותרת עמוד */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="page-header">
      <div className="container">
        <h1>{title}</h1>
        {subtitle && <p className="page-header__sub">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

/** ליזי + הודעה (ריק / שגיאה / טעינה) */
export function Notice({ pose, title, text, action }: { pose: LizzyPose; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="notice">
      <Lizzy pose={pose} height={170} />
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Loading({ rows = 3 }: { rows?: number }) {
  const { t } = useLang();
  return (
    <div className="skeletons" aria-busy="true" aria-label={t('common.loading')}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useLang();
  const network = error instanceof ApiError && error.status === 0;
  return (
    <Notice
      pose="confused"
      title={network ? t('error.network') : t('error.generic')}
      text={error instanceof ApiError && error.status !== 0 ? error.message : undefined}
      action={
        onRetry && (
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            {t('common.retry')}
          </button>
        )
      }
    />
  );
}

/** קטע מידע בולט (צהוב) */
export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="infobox" role="note">
      <span className="infobox__icon" aria-hidden="true">
        ℹ️
      </span>
      <div>{children}</div>
    </div>
  );
}

/** בורר כמות 1..max */
export function QuantityInput({ value, onChange, max }: { value: number; onChange: (n: number) => void; max: number }) {
  const { t } = useLang();
  return (
    <div className="qty" role="group" aria-label={t('cart.quantity')}>
      <button type="button" className="qty__btn" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="−">
        −
      </button>
      <span className="qty__value" aria-live="polite">
        {value}
      </span>
      <button type="button" className="qty__btn" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="+">
        +
      </button>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const { t } = useLang();
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label={t('common.pages')}>
      <button type="button" className="btn btn--outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t('common.prev')}
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button type="button" className="btn btn--outline" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {t('common.next')}
      </button>
    </nav>
  );
}

export function Accordion({ items }: { items: { id: string; title: string; body: string }[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="accordion">
      {items.map((it) => {
        const isOpen = open === it.id;
        return (
          <div key={it.id} className={`accordion__item ${isOpen ? 'is-open' : ''}`}>
            <h3>
              <button type="button" className="accordion__btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : it.id)}>
                <span>{it.title}</span>
                <span className="accordion__chev" aria-hidden="true">
                  ⌄
                </span>
              </button>
            </h3>
            {isOpen && <div className="accordion__panel">{it.body}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="back-link">
      <span aria-hidden="true" className="flip-rtl">
        ‹
      </span>{' '}
      {label}
    </Link>
  );
}

export function Tag({ children, tone = 'pink' }: { children: ReactNode; tone?: 'pink' | 'sky' | 'sun' | 'green' | 'red' | 'gray' }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}
