import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Lizzy } from '../components/Lizzy';
import { useLang } from '../i18n';
import { daysLeft, money, pick } from '../utils/format';
import type { TrackedOrder } from '../types';

export default function OrderSuccess() {
  const { t, lang } = useLang();
  const state = useLocation().state as { code: string; total: number; email: string; order?: TrackedOrder } | null;
  const [copied, setCopied] = useState(false);
  if (!state) return <Navigate to="/" replace />;

  return (
    <div className="container section">
      <div className="success">
        <Lizzy pose="happy" height={230} />
        <h1>{t('success.title')}</h1>
        <p>{t('success.text')}</p>
        <div className="success__code" dir="ltr">
          {state.code}
        </div>
        <button
          type="button"
          className="btn btn--outline"
          onClick={() => {
            void navigator.clipboard?.writeText(state.code);
            setCopied(true);
          }}
        >
          {copied ? t('success.copied') : t('success.copy')}
        </button>
        <p className="muted">
          {t('success.total')}: <strong>{money(state.total)}</strong> · {t('success.mailTo')} <span dir="ltr">{state.email}</span>
        </p>
        {state.order && state.order.items.some((i) => i.download) && (
          <div className="card" style={{ textAlign: 'start', width: '100%', maxWidth: 520 }}>
            <h3>{t('success.downloads')}</h3>
            <ul className="order-items">
              {state.order.items
                .filter((i) => i.download)
                .map((i) => (
                  <li key={i.id}>
                    <strong>{pick(lang, i, 'name')}</strong>
                    <div className="download-box">
                      <a className="btn btn--secondary btn--sm" href={i.download!.url} download>
                        ⬇ {t('common.download')}
                      </a>
                      <small>
                        {t('track.downloadNote')} · {t('track.daysLeft', { count: daysLeft(i.download!.expiresAt) })}
                      </small>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
        <div className="success__actions">
          <Link to="/track" className="btn btn--primary">
            {t('nav.track')}
          </Link>
          <Link to="/shop" className="btn btn--ghost">
            {t('success.continue')}
          </Link>
        </div>
      </div>
    </div>
  );
}
