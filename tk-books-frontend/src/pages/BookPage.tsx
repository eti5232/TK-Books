import { useSearchParams, useParams } from 'react-router-dom';
import { useBook, useFaqs, useMaterials, useProducts } from '../api/hooks';
import { MaterialItem, ProductCard } from '../components/cards';
import { Lizzy } from '../components/Lizzy';
import { Accordion, BackLink, ErrorBox, Loading, Notice } from '../components/ui';
import { useLang } from '../i18n';
import { accentFor, pick } from '../lib/format';
import type { MaterialType } from '../types';
import Reader from './Reader';

type TabKey = 'read' | 'songs' | 'tests' | 'review' | 'guide' | 'faq' | 'products';
const MATERIAL_TABS: Partial<Record<TabKey, MaterialType>> = { songs: 'SONG', tests: 'TEST', review: 'REVIEW_SHEET', guide: 'TEACHER_GUIDE' };

function MaterialsTab({ slug, type }: { slug: string; type: MaterialType }) {
  const { t } = useLang();
  const q = useMaterials(slug, type);
  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => void q.refetch()} />;
  if (!q.data || q.data.items.length === 0) return <Notice pose="confused" title={t('materials.empty')} />;
  return (
    <div className="stack">
      {q.data.items.map((m) => (
        <MaterialItem key={m.id} m={m} />
      ))}
    </div>
  );
}

function FaqTab({ slug }: { slug: string }) {
  const { t, lang } = useLang();
  const q = useFaqs({ bookSlug: slug, includeGeneral: true });
  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => void q.refetch()} />;
  if (!q.data || q.data.items.length === 0) return <Notice pose="confused" title={t('faq.empty')} />;
  return <Accordion items={q.data.items.map((f) => ({ id: f.id, title: pick(lang, f, 'question'), body: pick(lang, f, 'answer') }))} />;
}

function ProductsTab({ slug }: { slug: string }) {
  const { t } = useLang();
  const q = useProducts({ bookSlug: slug, pageSize: 50 });
  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => void q.refetch()} />;
  if (!q.data || q.data.items.length === 0) return <Notice pose="shopping" title={t('shop.emptyBook')} />;
  return (
    <div className="grid grid--products">
      {q.data.items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default function BookPage() {
  const { slug } = useParams();
  const { t, lang } = useLang();
  const [sp, setSp] = useSearchParams();
  const { data: book, isLoading, isError, error, refetch } = useBook(slug);

  if (isLoading) return <div className="container section"><Loading rows={4} /></div>;
  if (isError || !book) {
    return (
      <div className="container section">
        <ErrorBox error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const tab = (sp.get('tab') as TabKey | null) ?? 'read';
  const accent = accentFor(book.sortOrder);
  const mc = book.materialCounts;
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'read', label: t('tabs.read'), count: book.pageCount },
    { key: 'songs', label: t('tabs.songs'), count: mc.SONG },
    { key: 'tests', label: t('tabs.tests'), count: mc.TEST },
    { key: 'review', label: t('tabs.review'), count: mc.REVIEW_SHEET },
    { key: 'guide', label: t('tabs.guide'), count: mc.TEACHER_GUIDE },
    { key: 'faq', label: t('tabs.faq'), count: book.faqCount },
    { key: 'products', label: t('tabs.products'), count: book.productCount },
  ];

  const title = pick(lang, book, 'title');
  const matType = MATERIAL_TABS[tab];

  return (
    <>
      <section className={`book-hero book-hero--${accent}`}>
        <div className="container book-hero__inner">
          <div>
            <BackLink to="/books" label={t('nav.books')} />
            <h1>{title}</h1>
            <p>{pick(lang, book, 'description')}</p>
          </div>
          {book.coverImageUrl ? <img className="book-hero__cover" src={book.coverImageUrl} alt={title} /> : <Lizzy pose="reading" height={150} />}
        </div>
      </section>

      <div className="container">
        <div className="tabs" role="tablist" aria-label={title}>
          {tabs.map((tb) => (
            <button
              key={tb.key}
              type="button"
              role="tab"
              aria-selected={tab === tb.key}
              className={`tabs__tab ${tab === tb.key ? 'is-active' : ''} ${tb.count === 0 ? 'is-dim' : ''}`}
              onClick={() => setSp({ tab: tb.key })}
            >
              {tb.label}
              {tb.count !== undefined && <span className="tabs__count">{tb.count}</span>}
            </button>
          ))}
        </div>

        <div className="tabpanel" role="tabpanel">
          {tab === 'read' && <Reader slug={book.slug} pageCount={book.pageCount} title={title} />}
          {matType && slug && <MaterialsTab slug={slug} type={matType} />}
          {tab === 'faq' && slug && <FaqTab slug={slug} />}
          {tab === 'products' && slug && <ProductsTab slug={slug} />}
        </div>
      </div>
    </>
  );
}
