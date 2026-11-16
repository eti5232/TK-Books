import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../api/hooks';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../i18n';
import { accentFor, money, pick } from '../lib/format';
import type { Book, Material, Product } from '../types';
import { Tag } from './ui';

export function BookCard({ book }: { book: Book }) {
  const { lang, t } = useLang();
  const accent = accentFor(book.sortOrder);
  return (
    <Link to={`/books/${book.slug}`} className={`book-card book-card--${accent}`}>
      <div className="book-card__cover">
        {book.coverImageUrl ? <img src={book.coverImageUrl} alt={pick(lang, book, 'title')} loading="lazy" /> : <div className="book-card__nocover">TK</div>}
      </div>
      <div className="book-card__body">
        <h3>{pick(lang, book, 'title')}</h3>
        <p>{pick(lang, book, 'description')}</p>
        <span className="btn btn--primary btn--sm">
          {t('books.enter')} <span className="flip-rtl">›</span>
        </span>
      </div>
    </Link>
  );
}

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

const TYPE_ICON: Record<string, string> = { SONG: '🎵', TEST: '📝', REVIEW_SHEET: '📄', TEACHER_GUIDE: '🍎' };

export function MaterialItem({ m }: { m: Material }) {
  const { lang, t } = useLang();
  const [lyrics, setLyrics] = useState(false);
  const lyricsText = pick(lang, m, 'lyrics') || m.lyricsHe || m.lyricsEn;
  const desc = pick(lang, m, 'description');
  return (
    <div className={`material material--${m.type.toLowerCase()}`}>
      <div className="material__icon" aria-hidden="true">
        {TYPE_ICON[m.type]}
      </div>
      <div className="material__main">
        <h3>{pick(lang, m, 'title')}</h3>
        <p>
          {m.unit ? `${t('materials.unit')} ${m.unit}` : ''}
          {m.unit && desc ? ' · ' : ''}
          {desc}
        </p>
        {lyrics && lyricsText && <pre className="material__lyrics">{lyricsText}</pre>}
      </div>
      <div className="material__actions">
        <Tag tone="green">{t('common.free')}</Tag>
        {m.mediaUrl && (
          <a className="btn btn--outline btn--sm" href={m.mediaUrl} target="_blank" rel="noreferrer">
            ▶ {t('materials.listen')}
          </a>
        )}
        {lyricsText && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setLyrics((v) => !v)}>
            {t('materials.lyrics')}
          </button>
        )}
        {m.hasFile && m.downloadUrl && (
          <a className="btn btn--secondary btn--sm" href={m.downloadUrl} download>
            ⬇ {t('common.download')}
          </a>
        )}
      </div>
    </div>
  );
}
