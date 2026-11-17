import { useLang } from '../../i18n';

/** בורר כמות 1..max */
export function QuantityInput({ value, onChange, max }: { value: number; onChange: (n: number) => void; max: number }) {
  const { t } = useLang();
  return (
    <div className="qty" role="group" aria-label={t('cart.quantity')}>
      <button type="button" className="qty__btn" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="−">
        −
      </button>
      <span className="qty__value" aria-live="polite">
        {value}
      </span>
      <button type="button" className="qty__btn" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="+">
        +
      </button>
    </div>
  );
}
