import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useConfig, useProduct, useProducts } from '../api/hooks';
import { ProductCard } from '../components/cards';
import { BackLink, ErrorBox, InfoBox, Loading, QuantityInput, Tag } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../i18n';
import { money, pick } from '../lib/format';

export default function ProductPage() {
  const { slug } = useParams();
  const { t, lang } = useLang();
  const { add } = useCart();
  const toast = useToast();
  const { data: config } = useConfig();
  const { data: p, isLoading, isError, error, refetch } = useProduct(slug);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const related = useProducts({ bookSlug: p?.book?.slug, pageSize: 4 }, !!p?.book);

  if (isLoading) return <div className="container section"><Loading rows={4} /></div>;
  if (isError || !p) return <div className="container section"><ErrorBox error={error} onRetry={() => void refetch()} /></div>;

  const max = config?.maxItemQuantity ?? 10;
  const img = p.images[imgIdx];
  const digital = p.kind === 'DIGITAL';

  return (
    <div className="container section">
      <BackLink to="/shop" label={t('nav.shop')} />
      <div className="product">
        <div className="product__gallery">
          <div className="product__main">{img?.url ? <img src={img.url} alt={pick(lang, img, 'alt') || pick(lang, p, 'name')} /> : <div className="product-card__noimg">🎁</div>}</div>
          {p.images.length > 1 && (
            <div className="product__thumbs">
              {p.images.map((im, i) => (
                <button key={i} type="button" className={i === imgIdx ? 'is-active' : ''} onClick={() => setImgIdx(i)} aria-label={`${i + 1}`}>
                  {im.url && <img src={im.url} alt="" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product__info">
          <div className="product__tags">
            <Tag tone={digital ? 'sky' : 'pink'}>{digital ? t('shop.digital') : t('shop.physical')}</Tag>
            <Tag tone="gray">{t(`category.${p.category}`)}</Tag>
            {p.book && <Link to={`/books/${p.book.slug}?tab=products`}><Tag tone="sun">{pick(lang, p.book, 'title')}</Tag></Link>}
          </div>
          <h1>{pick(lang, p, 'name')}</h1>
          <div className="price price--lg">{money(p.priceAgorot)}</div>
          <p className="product__desc">{pick(lang, p, 'description')}</p>

          <p className="muted">{digital ? t('shop.digitalNote', { days: config?.downloadValidDays ?? 3 }) : t('shop.physicalNote', { days: config?.deliveryBusinessDays ?? 7 })}</p>

          <div className="product__buy">
            <QuantityInput value={qty} onChange={(n) => setQty(Math.max(1, Math.min(max, n)))} max={max} />
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => {
                add(p, qty, max);
                toast(t('cart.added'));
              }}
            >
              {t('cart.add')}
            </button>
          </div>
          <InfoBox>{t('cart.bulkNote', { max, email: config?.supportEmail ?? '' })}</InfoBox>
        </div>
      </div>

      {p.book && related.data && related.data.items.filter((x) => x.id !== p.id).length > 0 && (
        <section className="section">
          <h2 className="section__title">{t('shop.moreForBook')}</h2>
          <div className="grid grid--products">
            {related.data.items
              .filter((x) => x.id !== p.id)
              .map((x) => (
                <ProductCard key={x.id} product={x} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
