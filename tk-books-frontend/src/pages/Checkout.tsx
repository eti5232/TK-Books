import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { Field } from '../components/Field';
import { InfoBox, Notice, PageHeader } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useConfig } from '../api/hooks';
import { useLang } from '../i18n';
import { money, pick } from '../lib/format';

interface Form {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  street: string;
  city: string;
  zip: string;
  notes: string;
}

export default function Checkout() {
  const { t, lang } = useLang();
  const { items, total, hasPhysical, clear } = useCart();
  const { data: config } = useConfig();
  const nav = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Form>();

  if (items.length === 0) {
    return (
      <div className="container section">
        <Notice pose="shopping" title={t('cart.empty')} action={<Link to="/shop" className="btn btn--primary">{t('home.ctaShop')}</Link>} />
      </div>
    );
  }

  const onSubmit = async (f: Form) => {
    setServerError(null);
    try {
      const res = await api<{ code: string; totalAgorot: number }>('/api/orders', {
        body: {
          customerName: f.customerName,
          customerEmail: f.customerEmail,
          customerPhone: f.customerPhone || undefined,
          preferredLanguage: lang,
          shippingAddress: hasPhysical ? { street: f.street, city: f.city, zip: f.zip || undefined } : undefined,
          notes: f.notes || undefined,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        },
      });
      clear();
      nav('/pay', { state: { code: res.code, total: res.totalAgorot, email: f.customerEmail } });
    } catch (e) {
      if (e instanceof ApiError) {
        const fe = e.fieldErrors();
        const map: Record<string, keyof Form> = { customerName: 'customerName', customerEmail: 'customerEmail', customerPhone: 'customerPhone', 'shippingAddress.street': 'street', 'shippingAddress.city': 'city' };
        let any = false;
        for (const [k, msg] of Object.entries(fe)) {
          const target = map[k];
          if (target) {
            setError(target, { message: msg });
            any = true;
          }
        }
        if (!any) setServerError(e.message);
      } else setServerError(t('error.generic'));
    }
  };

  const req = { required: t('form.required') };

  return (
    <>
      <PageHeader title={t('checkout.title')} />
      <div className="container section checkout">
        <form className="card form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          <h2>{t('checkout.details')}</h2>
          <Field label={t('form.name')} htmlFor="name" required error={errors.customerName?.message}>
            <input id="name" className="input" autoComplete="name" {...register('customerName', { ...req, minLength: { value: 2, message: t('form.tooShort') } })} />
          </Field>
          <Field label={t('form.email')} htmlFor="email" required error={errors.customerEmail?.message}>
            <input id="email" className="input" type="email" dir="ltr" autoComplete="email" {...register('customerEmail', { ...req, pattern: { value: /^\S+@\S+\.\S+$/, message: t('form.badEmail') } })} />
          </Field>
          <Field label={t('form.phone')} htmlFor="phone" error={errors.customerPhone?.message}>
            <input id="phone" className="input" type="tel" dir="ltr" autoComplete="tel" {...register('customerPhone', { pattern: { value: /^[0-9+\-\s()]*$/, message: t('form.badPhone') } })} />
          </Field>

          {hasPhysical && (
            <fieldset className="form__address">
              <legend>{t('checkout.address')}</legend>
              <Field label={t('form.street')} htmlFor="street" required error={errors.street?.message}>
                <input id="street" className="input" autoComplete="street-address" {...register('street', { ...req, minLength: { value: 2, message: t('form.tooShort') } })} />
              </Field>
              <div className="form__row">
                <Field label={t('form.city')} htmlFor="city" required error={errors.city?.message}>
                  <input id="city" className="input" autoComplete="address-level2" {...register('city', { ...req, minLength: { value: 2, message: t('form.tooShort') } })} />
                </Field>
                <Field label={t('form.zip')} htmlFor="zip">
                  <input id="zip" className="input" dir="ltr" autoComplete="postal-code" {...register('zip')} />
                </Field>
              </div>
            </fieldset>
          )}

          <Field label={t('form.notes')} htmlFor="notes">
            <textarea id="notes" className="input" rows={3} maxLength={1000} {...register('notes')} />
          </Field>

          <InfoBox>{t('checkout.noPayment')}</InfoBox>
          {serverError && <div className="alert alert--error" role="alert">{serverError}</div>}
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={isSubmitting}>
            {isSubmitting ? t('common.sending') : t('checkout.submit')}
          </button>
        </form>

        <aside className="cart__summary">
          <h2>{t('cart.summary')}</h2>
          <ul className="summary-list">
            {items.map((i) => (
              <li key={i.productId}>
                <span>
                  {pick(lang, i, 'name')} × {i.quantity}
                </span>
                <span>{money(i.priceAgorot * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="cart__sumrow">
            <span>{t('cart.total')}</span>
            <strong className="price price--lg">{money(total)}</strong>
          </div>
          <p className="muted">{t('cart.bulkShort', { email: config?.supportEmail ?? '' })}</p>
          <Link to="/cart" className="btn btn--ghost btn--block">
            {t('checkout.backToCart')}
          </Link>
        </aside>
      </div>
    </>
  );
}
