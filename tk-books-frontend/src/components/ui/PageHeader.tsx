import { type ReactNode } from 'react';

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
