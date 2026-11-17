import { type ReactNode } from 'react';

export function Tag({ children, tone = 'pink' }: { children: ReactNode; tone?: 'pink' | 'sky' | 'sun' | 'green' | 'red' | 'gray' }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}
