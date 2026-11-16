import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { Field } from '../components/Field';
import { Lizzy } from '../components/Lizzy';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';

export default function Login() {
  const { t } = useLang();
  const { admin, login } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }>();

  if (admin) return <Navigate to="/admin" replace />;

  const onSubmit = async (f: { email: string; password: string }) => {
    setError(null);
    try {
      await login(f.email.trim(), f.password);
      nav('/admin', { replace: true });
    } catch (e) {
      setError(e instanceof ApiError && e.status === 401 ? t('admin.badLogin') : e instanceof ApiError && e.status === 429 ? t('error.tooMany') : t('error.generic'));
    }
  };

  return (
    <div className="login">
      <div className="card login__card">
        <Lizzy pose="face" height={90} />
        <h1>{t('admin.loginTitle')}</h1>
        <form className="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          <Field label={t('form.email')} htmlFor="l-email" required error={errors.email?.message}>
            <input id="l-email" className="input" type="email" dir="ltr" autoComplete="username" {...register('email', { required: t('form.required') })} />
          </Field>
          <Field label={t('admin.password')} htmlFor="l-pass" required error={errors.password?.message}>
            <input id="l-pass" className="input" type="password" dir="ltr" autoComplete="current-password" {...register('password', { required: t('form.required') })} />
          </Field>
          {error && <div className="alert alert--error" role="alert">{error}</div>}
          <button className="btn btn--primary btn--block" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('admin.login')}
          </button>
        </form>
        <Link to="/" className="muted">
          ← {t('admin.viewSite')}
        </Link>
      </div>
    </div>
  );
}
