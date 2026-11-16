import type { ReactNode } from 'react';

interface Props {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor: string;
  children: ReactNode;
}

export function Field({ label, error, hint, required, htmlFor, children }: Props) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="field__req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <small className="field__hint">{hint}</small>}
      {error && (
        <small className="field__error" role="alert">
          ⚠ {error}
        </small>
      )}
    </div>
  );
}
