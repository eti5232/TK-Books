import { Link, useNavigate } from 'react-router-dom';
import { useConfig } from '../api/hooks';
import { InfoBox, Notice, PageHeader, QuantityInput } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useLang } from '../i18n';
import { money, pick } from '../lib/format';

export default function Cart() {
  const { t, lang } = useLang();
  const { items, total, setQty, remove, hasPhysical } = useCart();
  const { data: config } = useConfig();
  const nav = useNavigate();
  const max = config?.maxItemQuantity ?? 10;

  if (items.length === 0) {
    return (
      <div className="container section">
        <Notice
          pose="shopping"
          title={t('cart.empty')}
          text={t('cart.emptyText')}
          action={
            <Link to="/shop" className="btn btn--primary">
              {t('home.ctaShop')}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader title={t('cart.title')} />
      <div className="container section cart">
        <div className="cart__list">
          <InfoBox>{t('cart.bulkNote', { max, email: config?.supportEmail ?? '' })}</InfoBox>
          {items.map((i) => (
            <div key={i.productId} className="cart-row">
              <Link to={`/shop/${i.slug}`} className="cart-row__img">
                {i.image ? <img src={i.image} alt="" /> : <span>🎁</span>}
              </Link>
              <div className="cart-row__main">
                <Link to={`/shop/${i.slug}`}>
                  <strong>{pick(lang, i, 'name')}</strong>
                </Link>
                <span className="muted">{i.kind === 'DIGITAL' ? t('shop.digital') : t('shop.physical')} · {money(i.priceAgorot)}</span>
              </div>
              <QuantityInput value={i.quantity} max={max} onChange={(n) => setQty(i.productId, n, max)} />
              <div className="cart-row__total">{money(i.priceAgorot * i.quantity)}</div>
              <button type="button" className="icon-btn" onClick={() => remove(i.productId)} aria-label={t('cart.remove')}>
                ✕
              </button>
            </div>
          ))}
        </div>

        <aside className="cart__summary">
          <h2>{t('cart.summary')}</h2>
          <div className="cart__sumrow">
            <span>{t('cart.total')}</span>
            <strong className="price price--lg">{money(total)}</strong>
          </div>
          <p className="muted">{hasPhysical ? t('cart.shippingNeeded') : t('cart.digitalOnly')}</p>
          <p className="muted">{t('cart.noPayment')}</p>
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => nav('/checkout')}>
            {t('cart.checkout')}
          </button>
        </aside>
      </div>
    </>
  );
}
