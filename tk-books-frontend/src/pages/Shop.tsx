import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBooks, useProducts } from '../api/hooks';
import { ProductCard } from '../components/cards';
import { ErrorBox, Loading, Notice, PageHeader, Pagination } from '../components/ui';
import { useLang } from '../i18n';
import { pick } from '../lib/format';

const CATEGORIES = ['FLASHCARDS', 'SONGBOOK', 'PRINTABLES', 'STICKERS', 'STAMPS', 'OTHER'];

export default function Shop() {
  const { t, lang } = useLang();
  const [sp, setSp] = useSearchParams();
  const kind = sp.get('kind') ?? '';
  const category = sp.get('category') ?? '';
  const bookSlug = sp.get('book') ?? '';
  const sort = sp.get('sort') ?? 'new';
  const page = Number(sp.get('page') ?? '1') || 1;
  const q = sp.get('q') ?? '';
  const [text, setText] = useState(q);

  useEffect(() => {
    setText(q);
  }, [q]);

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    setSp(next);
  };

  const products = useProducts({ kind: kind || undefined, category: category || undefined, bookSlug: bookSlug || undefined, q: q || undefined, sort, page, pageSize: 12 });
  const books = useBooks();

  return (
    <>
      <PageHeader title={t('shop.title')} subtitle={t('shop.subtitle')} />
      <div className="container section">
        <div className="filters">
          <div className="chips" role="group" aria-label={t('shop.kind')}>
            {[
              ['', t('shop.all')],
              ['DIGITAL', t('shop.digital')],
              ['PHYSICAL', t('shop.physical')],
            ].map(([v, label]) => (
              <button key={v} type="button" className={`chip ${kind === v ? 'is-active' : ''}`} onClick={() => set({ kind: v ?? '' })}>
                {label}
              </button>
            ))}
          </div>

          <form
            className="filters__row"
            onSubmit={(e) => {
              e.preventDefault();
              set({ q: text.trim() });
            }}
          >
            <input className="input" type="search" placeholder={t('shop.search')} value={text} onChange={(e) => setText(e.target.value)} aria-label={t('shop.search')} />
            <select className="input" value={category} onChange={(e) => set({ category: e.target.value })} aria-label={t('shop.category')}>
              <option value="">{t('shop.allCategories')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`category.${c}`)}
                </option>
              ))}
            </select>
            <select className="input" value={bookSlug} onChange={(e) => set({ book: e.target.value })} aria-label={t('shop.book')}>
              <option value="">{t('shop.allBooks')}</option>
              {books.data?.items.map((b) => (
                <option key={b.id} value={b.slug}>
                  {pick(lang, b, 'title')}
                </option>
              ))}
            </select>
            <select className="input" value={sort} onChange={(e) => set({ sort: e.target.value })} aria-label={t('shop.sort')}>
              <option value="new">{t('shop.sortNew')}</option>
              <option value="price_asc">{t('shop.sortPriceAsc')}</option>
              <option value="price_desc">{t('shop.sortPriceDesc')}</option>
              <option value="name">{t('shop.sortName')}</option>
            </select>
            <button className="btn btn--secondary" type="submit">
              {t('shop.searchBtn')}
            </button>
          </form>
        </div>

        {products.isLoading && <Loading rows={4} />}
        {products.isError && <ErrorBox error={products.error} onRetry={() => void products.refetch()} />}
        {products.data && products.data.items.length === 0 && <Notice pose="confused" title={t('shop.empty')} text={t('shop.emptyHint')} />}
        {products.data && products.data.items.length > 0 && (
          <>
            <p className="muted">{t('shop.results', { count: products.data.total })}</p>
            <div className="grid grid--products">
              {products.data.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <Pagination page={products.data.page} totalPages={products.data.totalPages} onChange={(p) => set({ page: String(p) })} />
          </>
        )}
      </div>
    </>
  );
}
