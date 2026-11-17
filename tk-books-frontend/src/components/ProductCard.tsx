import { Link } from 'react-router-dom';
import { useConfig } from '../hooks/useConfig';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../i18n';
import { money, pick } from '../utils/format';
import type { Product } from '../types';
import { Tag } from './ui';

const CATEGORY_ICON: Record<string, string> = { FLASHCARDS: '🃏', SONGBOOK: '🎵', PRINTABLES: '🖨️', STICKERS: '⭐', STAMPS: '🔖', OTHER: '🎁' };

export function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useLang();
  const { add } = useCart();
  const toast = useToast();
  const { data: config } = useConfig();
  const img = product.images[0];
  const digital = product.kind === 'DIGITAL';

  return (
    <article className="product-card">
      <Link to={`/shop/${product.slug}`} className="product-card__img">
        {img?.url ? <img src={img.url} alt={img ? pick(lang, img, 'alt') || pick(lang, product, 'name') : ''} loading="lazy" /> : <div className="product-card__noimg">{CATEGORY_ICON[product.category]}</div>}
        <span className="product-card__kind">
          <Tag tone={digital ? 'sky' : 'pink'}>{digital ? t('shop.digital') : t('shop.physical')}</Tag>
        </span>
      </Link>
      <div className="product-card__body">
        <h3>
          <Link to={`/shop/${product.slug}`}>{pick(lang, product, 'name')}</Link>
        </h3>
        {product.book && <span className="product-card__book">{pick(lang, product.book, 'title')}</span>}
        <div className="product-card__foot">
          <strong className="price">{money(product.priceAgorot)}</strong>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => {
              add(product, 1, config?.maxItemQuantity ?? 10);
              toast(t('cart.added'));
            }}
          >
            + {t('cart.addShort')}
          </button>
        </div>
      </div>
    </article>
  );
}

