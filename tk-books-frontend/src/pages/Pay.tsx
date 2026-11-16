import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useConfig } from '../api/hooks';
import { Lizzy } from '../components/Lizzy';
import { InfoBox, PageHeader } from '../components/ui';
import { useLang } from '../i18n';
import { money } from '../lib/format';
import type { TrackedOrder } from '../types';

interface PayState {
  code: string;
  email: string;
  total: number;
}

/**
 * עמוד תשלום דמה. לא גובה כסף ולא מבקש פרטי אשראי.
 * כשתהיה חברת סליקה אמיתית, במקום העמוד הזה הלקוחה תועבר לדף התשלום המתארח שלה.
 */
export default function Pay() {
  const { t } = useLang();
  const nav = useNavigate();
  const { data: config } = useConfig();
  const state = useLocation().state as PayState | null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!state) return <Navigate to="/track" replace />;

  const pay = async (outcome: 'success' | 'fail') => {
    setBusy(true);
    setError(null);
    try {
      const order = await api<TrackedOrder>('/api/orders/pay-demo', { body: { code: state.code, email: state.email, outcome } });
      nav('/order/success', { replace: true, state: { code: state.code, total: state.total, email: state.email, order } });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'PAYMENT_FAILED') setError(t('pay.failed'));
      else if (e instanceof ApiError && e.code === 'INVALID_STATUS') setError(t('pay.alreadyPaid'));
      else setError(e instanceof ApiError ? e.message : t('error.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={t('pay.title')} subtitle={t('pay.subtitle')} />
      <div className="container section">
        <div className="card form form--narrow" style={{ textAlign: 'center' }}>
          <Lizzy pose="shopping" height={150} />
          {config?.paymentMode === 'fake' && <InfoBox>{t('pay.demoBanner')}</InfoBox>}
          <p>
            {t('pay.order')} <strong dir="ltr">{state.code}</strong>
          </p>
          <p>
            {t('pay.total')}: <strong className="price price--lg">{money(state.total)}</strong>
          </p>
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}
          <button type="button" className="btn btn--primary btn--lg btn--block" disabled={busy} onClick={() => void pay('success')}>
            {busy ? t('pay.paying') : t('pay.now')}
          </button>
          <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => void pay('fail')}>
            {t('pay.fail')}
          </button>
          <p className="muted">{t('pay.later')}</p>
          <Link to="/track" className="btn btn--ghost btn--sm">
            {t('nav.track')}
          </Link>
        </div>
      </div>
    </>
  );
}
