import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useConfig } from '../api/hooks';
import { Field } from '../components/Field';
import { Lizzy } from '../components/Lizzy';
import { PageHeader } from '../components/ui';
import { useLang } from '../i18n';

interface Form {
  name: string;
  email: string;
  subject: string;
  message: string;
  orderCode: string;
}

export default function Contact() {
  const { t } = useLang();
  const [sp] = useSearchParams();
  const { data: config } = useConfig();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ defaultValues: { orderCode: sp.get('order') ?? '', subject: sp.get('order') ? t('contact.lateSubject') : '' } });

  const onSubmit = async (f: Form) => {
    setServerError(null);
    try {
      await api('/api/contact', { body: { name: f.name, email: f.email, subject: f.subject, message: f.message, orderCode: f.orderCode.trim() ? f.orderCode.trim().toUpperCase() : undefined } });
      setDone(true);
      reset();
    } catch (e) {
      setServerError(e instanceof ApiError && e.status === 429 ? t('error.tooMany') : e instanceof ApiError ? e.message : t('error.generic'));
    }
  };

  if (done) {
    return (
      <div className="container section">
        <div className="success">
          <Lizzy pose="happy" height={220} />
          <h1>{t('contact.thanks')}</h1>
          <p>{t('contact.thanksText')}</p>
          <button className="btn btn--outline" type="button" onClick={() => setDone(false)}>
            {t('contact.another')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title={t('contact.title')} subtitle={t('contact.subtitle')} />
      <div className="container section contact">
        <form className="card form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          <Field label={t('form.name')} htmlFor="c-name" required error={errors.name?.message}>
            <input id="c-name" className="input" {...register('name', { required: t('form.required'), minLength: { value: 2, message: t('form.tooShort') } })} />
          </Field>
          <Field label={t('form.email')} htmlFor="c-email" required error={errors.email?.message}>
            <input id="c-email" className="input" type="email" dir="ltr" {...register('email', { required: t('form.required'), pattern: { value: /^\S+@\S+\.\S+$/, message: t('form.badEmail') } })} />
          </Field>
          <Field label={t('contact.orderCode')} htmlFor="c-order" hint={t('contact.orderHint')} error={errors.orderCode?.message}>
            <input id="c-order" className="input" dir="ltr" placeholder="TK-XXXXXX" {...register('orderCode', { pattern: { value: /^$|^TK-[A-Za-z0-9]{6}$/, message: t('track.badCode') } })} />
          </Field>
          <Field label={t('contact.subject')} htmlFor="c-subject" required error={errors.subject?.message}>
            <input id="c-subject" className="input" {...register('subject', { required: t('form.required'), minLength: { value: 2, message: t('form.tooShort') } })} />
          </Field>
          <Field label={t('contact.message')} htmlFor="c-message" required error={errors.message?.message}>
            <textarea id="c-message" className="input" rows={6} {...register('message', { required: t('form.required'), minLength: { value: 5, message: t('form.tooShort') } })} />
          </Field>
          {serverError && <div className="alert alert--error" role="alert">{serverError}</div>}
          <button className="btn btn--primary btn--lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.sending') : t('contact.send')}
          </button>
        </form>
        <aside className="contact__side">
          <Lizzy pose="wave" height={240} />
          <p>{t('contact.sideText')}</p>
          {config && <p dir="ltr"><strong>{config.supportEmail}</strong></p>}
        </aside>
      </div>
    </>
  );
}
