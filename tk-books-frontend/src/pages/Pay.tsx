import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useConfig } from '../api/hooks';
import { Field } from '../components/Field';
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

// כרטיסי בדיקה (כמו ב-Stripe): הראשון מצליח, השני נדחה
const TEST_OK = '4242424242424242';
const TEST_DECLINED = '4000000000000002';

const formatCard = (v: string): string => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v: string): string => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

function expiryValid(v: string): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

/**
 * עמוד תשלום דמה. מציג טופס כרטיס אשראי כדי להרגיש כמו אמיתי, אבל:
 *  - פרטי הכרטיס נשארים בדפדפן בלבד. הם לא נשלחים לשרת ולא נשמרים בשום מקום.
 *  - מתקבלים רק כרטיסי בדיקה (4242… מצליח, 4000…0002 נדחה). כרטיס אמיתי נדחה כבר בדפדפן.
 * כשתהיה חברת סליקה אמיתית, במקום העמוד הזה הלקוחה תועבר לדף התשלום המתארח שלה
 * (כך פרטי האשראי אף פעם לא עוברים באתר שלנו).
 */
export default function Pay() {
  const { t } = useLang();
  const nav = useNavigate();
  const { data: config } = useConfig();
  const state = useLocation().state as PayState | null;
  const [holder, setHolder] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!state) return <Navigate to="/track" replace />;

  const fillTest = () => {
    setHolder('Test Teacher');
    setCard(formatCard(TEST_OK));
    setExpiry('12/34');
    setCvv('123');
    setErrors({});
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = card.replace(/\D/g, '');
    const next: Record<string, string> = {};
    if (holder.trim().length < 2) next['holder'] = t('form.required');
    if (digits.length !== 16) next['card'] = t('pay.badCard');
    else if (digits !== TEST_OK && digits !== TEST_DECLINED) next['card'] = t('pay.testOnly');
    if (!expiryValid(expiry)) next['expiry'] = t('pay.badExpiry');
    if (!/^\d{3}$/.test(cvv)) next['cvv'] = t('pay.badCvv');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      // שים לב: נשלחים רק קוד ההזמנה, המייל והתוצאה. לא פרטי הכרטיס.
      const outcome = digits === TEST_DECLINED ? 'fail' : 'success';
      const order = await api<TrackedOrder>('/api/orders/pay-demo', { body: { code: state.code, email: state.email, outcome } });
      setCard('');
      setCvv('');
      nav('/order/success', { replace: true, state: { code: state.code, total: state.total, email: state.email, order } });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'PAYMENT_FAILED') setError(t('pay.failed'));
      else if (err instanceof ApiError && err.code === 'INVALID_STATUS') setError(t('pay.alreadyPaid'));
      else setError(err instanceof ApiError ? err.message : t('error.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={t('pay.title')} subtitle={t('pay.subtitle')} />
      <div className="container section">
        <form className="card form form--narrow" onSubmit={(e) => void submit(e)} noValidate autoComplete="off">
          <div style={{ textAlign: 'center' }}>
            <Lizzy pose="shopping" height={130} />
          </div>
          {config?.paymentMode === 'fake' && <InfoBox>{t('pay.demoBanner')}</InfoBox>}
          <p style={{ textAlign: 'center' }}>
            {t('pay.order')} <strong dir="ltr">{state.code}</strong> · {t('pay.total')}: <strong className="price price--lg">{money(state.total)}</strong>
          </p>

          <Field label={t('pay.holder')} htmlFor="holder" required error={errors['holder']}>
            <input id="holder" className="input" autoComplete="off" value={holder} onChange={(e) => setHolder(e.target.value)} />
          </Field>
          <Field label={t('pay.card')} htmlFor="card" required error={errors['card']}>
            <input id="card" className="input" dir="ltr" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" value={card} onChange={(e) => setCard(formatCard(e.target.value))} />
          </Field>
          <div className="form__row">
            <Field label={t('pay.expiry')} htmlFor="expiry" required error={errors['expiry']}>
              <input id="expiry" className="input" dir="ltr" inputMode="numeric" autoComplete="off" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} />
            </Field>
            <Field label="CVV" htmlFor="cvv" required error={errors['cvv']}>
              <input id="cvv" className="input" dir="ltr" inputMode="numeric" autoComplete="off" maxLength={3} placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </Field>
          </div>

          <div className="alert alert--warn">
            <strong>{t('pay.noRealCards')}</strong>
            <p>{t('pay.testCards')}</p>
            <button type="button" className="btn btn--outline btn--sm" onClick={fillTest}>
              {t('pay.fillTest')}
            </button>
          </div>

          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
            {busy ? t('pay.paying') : `${t('pay.now')} · ${money(state.total)}`}
          </button>
          <p className="muted">{t('pay.later')}</p>
          <div style={{ textAlign: 'center' }}>
            <Link to="/track" className="btn btn--ghost btn--sm">
              {t('nav.track')}
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
