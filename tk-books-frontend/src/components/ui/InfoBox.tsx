import { type ReactNode } from 'react';

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
