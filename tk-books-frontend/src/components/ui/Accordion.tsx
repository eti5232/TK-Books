import { useState } from 'react';

export function Accordion({ items }: { items: { id: string; title: string; body: string }[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="accordion">
      {items.map((it) => {
        const isOpen = open === it.id;
        return (
          <div key={it.id} className={`accordion__item ${isOpen ? 'is-open' : ''}`}>
            <h3>
              <button type="button" className="accordion__btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : it.id)}>
                <span>{it.title}</span>
                <span className="accordion__chev" aria-hidden="true">
                  ⌄
                </span>
              </button>
            </h3>
            {isOpen && <div className="accordion__panel">{it.body}</div>}
          </div>
        );
      })}
    </div>
  );
}
