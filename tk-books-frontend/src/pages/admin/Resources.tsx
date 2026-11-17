import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '../../api/client';
import { Loading, Pagination, Tag } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useLang } from '../../i18n';
import { fmtDateTime, money, pick } from '../../utils/format';
import type { Book, ContactMessage, Customer, Faq, Material, Paginated, Product } from '../../types';
import { ConfirmButton, Modal } from '../../components/ui';
import { type ImageValue } from '../../components/admin/parts';
import { ResourceManager, type FieldDef } from '../../components/admin/ResourceManager';

/** רשימת ספרים לבחירה בטפסים */
function useBookOptions() {
  const { lang } = useLang();
  const q = useQuery({ queryKey: ['admin', 'book-options'], queryFn: () => api<Paginated<Book>>('/api/admin/books?pageSize=200', { auth: true }) });
  return { loading: q.isLoading, options: (q.data?.items ?? []).map((b) => ({ value: b.id, label: pick(lang, b, 'title') })) };
}

/* ======================= ספרים ======================= */
function PagesManager({ book, onClose }: { book: Book; onClose: () => void }) {
  const { t } = useLang();
  const toast = useToast();
  const qc = useQueryClient();
  const [replace, setReplace] = useState(false);
  const detail = useQuery({ queryKey: ['admin', 'book', book.id], queryFn: () => api<Book & { pageNumbers: number[] }>(`/api/admin/books/${book.id}`, { auth: true }) });

  const upload = useMutation({
    mutationFn: (files: FileList) => {
      const form = new FormData();
      Array.from(files)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .forEach((f) => form.append('pages', f));
      form.append('replace', String(replace));
      return api<{ added: number }>(`/api/admin/books/${book.id}/pages`, { form, auth: true });
    },
    onSuccess: (r) => {
      toast(`${t('admin.pagesAdded')}: ${r.added}`);
      void qc.invalidateQueries({ queryKey: ['admin', 'book', book.id] });
      void qc.invalidateQueries({ queryKey: ['admin', '/api/admin/books'] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : t('error.generic'), 'error'),
  });
  const del = useMutation({
    mutationFn: (n: number) => api(`/api/admin/books/${book.id}/pages/${n}`, { method: 'DELETE', auth: true }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'book', book.id] });
      void qc.invalidateQueries({ queryKey: ['admin', '/api/admin/books'] });
    },
  });

  return (
    <Modal title={`${t('admin.bookPages')}: ${book.titleHe}`} onClose={onClose} wide>
      <p className="muted">{t('admin.pagesHint')}</p>
      <div className="filefield__row">
        <label className="btn btn--primary btn--sm">
          {upload.isPending ? t('common.loading') : `+ ${t('admin.uploadPages')}`}
          <input type="file" hidden multiple accept="image/png,image/jpeg,image/webp" disabled={upload.isPending} onChange={(e) => { if (e.target.files?.length) upload.mutate(e.target.files); e.target.value = ''; }} />
        </label>
        <label className="check">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> {t('admin.replaceAll')}
        </label>
      </div>
      {detail.isLoading && <Loading rows={1} />}
      <div className="pages-grid">
        {detail.data?.pageNumbers.map((n) => (
          <div key={n} className="pages-grid__item">
            <img src={`/api/books/${book.slug}/pages/${n}`} alt="" loading="lazy" />
            <span>{n}</span>
            <ConfirmButton label="✕" className="icon-btn" confirmText={t('admin.confirmDelete', { name: `#${n}` })} onConfirm={() => del.mutate(n)} />
          </div>
        ))}
      </div>
      {detail.data && detail.data.pageNumbers.length === 0 && <p className="muted">{t('admin.noRows')}</p>}
    </Modal>
  );
}

export function BooksAdmin() {
  const { t } = useLang();
  const [pagesFor, setPagesFor] = useState<Book | null>(null);
  const fields: FieldDef[] = [
    { name: 'titleHe', label: `${t('admin.title')} (עב)`, type: 'text', required: true, half: true },
    { name: 'titleEn', label: `${t('admin.title')} (EN)`, type: 'text', required: true, half: true, ltr: true },
    { name: 'descriptionHe', label: `${t('admin.description')} (עב)`, type: 'textarea', half: true },
    { name: 'descriptionEn', label: `${t('admin.description')} (EN)`, type: 'textarea', half: true, ltr: true },
    { name: 'slug', label: 'Slug', type: 'slug', createOnly: true, hint: t('admin.slugHint'), half: true },
    { name: 'sortOrder', label: t('admin.sortOrder'), type: 'number', half: true },
    { name: 'coverImageKey', label: t('admin.cover'), type: 'file', area: 'public', folder: 'covers', accept: 'image/*', nullable: true },
    { name: 'isActive', label: t('admin.active'), type: 'checkbox' },
  ];
  return (
    <>
      <ResourceManager<Book>
        title={t('admin.nav.books')}
        endpoint="/api/admin/books"
        rowName={(b) => b.titleHe}
        defaults={{ isActive: true, sortOrder: 1 }}
        fields={fields}
        columns={[
          { header: '', render: (b) => (b.coverImageUrl ? <img className="thumb" src={b.coverImageUrl} alt="" /> : '–') },
          { header: t('admin.title'), render: (b) => <><strong>{b.titleHe}</strong><br /><small className="muted" dir="ltr">{b.titleEn}</small></> },
          { header: 'Slug', render: (b) => <code dir="ltr">{b.slug}</code> },
          { header: t('admin.pages'), render: (b) => b.pageCount },
          { header: t('admin.active'), render: (b) => (b.isActive ? <Tag tone="green">✓</Tag> : <Tag tone="gray">—</Tag>) },
        ]}
        rowActions={(b) => (
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setPagesFor(b)}>
            {t('admin.bookPages')}
          </button>
        )}
      />
      {pagesFor && <PagesManager book={pagesFor} onClose={() => setPagesFor(null)} />}
    </>
  );
}

/* ======================= חומרים ======================= */
export function MaterialsAdmin() {
  const { t, lang } = useLang();
  const books = useBookOptions();
  const [type, setType] = useState('');
  const [bookId, setBookId] = useState('');
  if (books.loading) return <div className="admin-page"><Loading /></div>;
  const typeOptions = (['SONG', 'TEST', 'REVIEW_SHEET', 'TEACHER_GUIDE'] as const).map((v) => ({ value: v, label: t(`materialType.${v}`) }));
  const fields: FieldDef[] = [
    { name: 'bookId', label: t('admin.book'), type: 'select', options: books.options, required: true, half: true },
    { name: 'type', label: t('admin.type'), type: 'select', options: typeOptions, required: true, half: true },
    { name: 'titleHe', label: `${t('admin.title')} (עב)`, type: 'text', required: true, half: true },
    { name: 'titleEn', label: `${t('admin.title')} (EN)`, type: 'text', required: true, half: true, ltr: true },
    { name: 'unit', label: t('admin.unit'), type: 'number', nullable: true, half: true },
    { name: 'sortOrder', label: t('admin.sortOrder'), type: 'number', half: true },
    { name: 'descriptionHe', label: `${t('admin.description')} (עב)`, type: 'textarea', half: true },
    { name: 'descriptionEn', label: `${t('admin.description')} (EN)`, type: 'textarea', half: true, ltr: true },
    { name: 'fileKey', label: t('admin.file'), type: 'file', area: 'private', folder: 'materials', nullable: true, hint: t('admin.fileHint') },
    { name: 'mediaUrl', label: t('admin.mediaUrl'), type: 'text', nullable: true, ltr: true, hint: 'https://…', showIf: (v) => v['type'] === 'SONG' },
    { name: 'lyricsHe', label: `${t('materials.lyrics')} (עב)`, type: 'textarea', nullable: true, half: true, showIf: (v) => v['type'] === 'SONG' },
    { name: 'lyricsEn', label: `${t('materials.lyrics')} (EN)`, type: 'textarea', nullable: true, half: true, ltr: true, showIf: (v) => v['type'] === 'SONG' },
    { name: 'isActive', label: t('admin.active'), type: 'checkbox' },
  ];
  return (
    <ResourceManager<Material>
      title={t('admin.nav.materials')}
      endpoint="/api/admin/materials"
      rowName={(m) => pick(lang, m, 'title')}
      defaults={{ isActive: true, sortOrder: 1, type: 'SONG', bookId: books.options[0]?.value ?? '' }}
      listParams={{ type: type || undefined, bookId: bookId || undefined }}
      fields={fields}
      filters={
        <div className="filters__row">
          <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label={t('admin.type')}>
            <option value="">{t('admin.allTypes')}</option>
            {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="input" value={bookId} onChange={(e) => setBookId(e.target.value)} aria-label={t('admin.book')}>
            <option value="">{t('shop.allBooks')}</option>
            {books.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      }
      columns={[
        { header: t('admin.title'), render: (m) => <><strong>{m.titleHe}</strong><br /><small className="muted" dir="ltr">{m.titleEn}</small></> },
        { header: t('admin.type'), render: (m) => <Tag tone="sky">{t(`materialType.${m.type}`)}</Tag> },
        { header: t('admin.book'), render: (m) => books.options.find((b) => b.value === m.bookId)?.label ?? '' },
        { header: t('admin.file'), render: (m) => (m.hasFile ? '✓' : '–') },
        { header: t('admin.active'), render: (m) => (m.isActive ? <Tag tone="green">✓</Tag> : <Tag tone="gray">—</Tag>) },
      ]}
    />
  );
}

/* ======================= מוצרים ======================= */
export function ProductsAdmin() {
  const { t, lang } = useLang();
  const books = useBookOptions();
  if (books.loading) return <div className="admin-page"><Loading /></div>;
  const fields: FieldDef[] = [
    { name: 'kind', label: t('admin.kind'), type: 'select', required: true, half: true, options: [{ value: 'DIGITAL', label: t('shop.digital') }, { value: 'PHYSICAL', label: t('shop.physical') }] },
    { name: 'category', label: t('shop.category'), type: 'select', required: true, half: true, options: ['FLASHCARDS', 'SONGBOOK', 'PRINTABLES', 'STICKERS', 'STAMPS', 'OTHER'].map((c) => ({ value: c, label: t(`category.${c}`) })) },
    { name: 'nameHe', label: `${t('admin.name')} (עב)`, type: 'text', required: true, half: true },
    { name: 'nameEn', label: `${t('admin.name')} (EN)`, type: 'text', required: true, half: true, ltr: true },
    { name: 'descriptionHe', label: `${t('admin.description')} (עב)`, type: 'textarea', half: true },
    { name: 'descriptionEn', label: `${t('admin.description')} (EN)`, type: 'textarea', half: true, ltr: true },
    { name: 'priceAgorot', label: t('admin.priceAgorot'), type: 'number', required: true, half: true, hint: t('admin.priceHint') },
    { name: 'bookId', label: t('admin.book'), type: 'select', options: books.options, nullable: true, half: true, hint: t('admin.bookOptional') },
    { name: 'digitalFileKey', label: t('admin.digitalFile'), type: 'file', area: 'private', folder: 'products', nullable: true, showIf: (v) => v['kind'] === 'DIGITAL', required: true },
    { name: 'images', label: t('admin.images'), type: 'images' },
    { name: 'slug', label: 'Slug', type: 'slug', createOnly: true, hint: t('admin.slugHint'), half: true },
    { name: 'isActive', label: t('admin.active'), type: 'checkbox' },
  ];
  return (
    <ResourceManager<Product>
      title={t('admin.nav.products')}
      endpoint="/api/admin/products"
      rowName={(p) => pick(lang, p, 'name')}
      defaults={{ isActive: true, kind: 'DIGITAL', category: 'OTHER', priceAgorot: 1000, images: [] }}
      toForm={(p) => ({
        ...p,
        images: p.images.map((im, i): ImageValue => ({ key: p.imageKeys?.[i] ?? '', altHe: im.altHe, altEn: im.altEn, url: im.url })),
      })}
      fields={fields}
      columns={[
        { header: '', render: (p) => (p.images[0]?.url ? <img className="thumb" src={p.images[0].url} alt="" /> : '–') },
        { header: t('admin.name'), render: (p) => <><strong>{p.nameHe}</strong><br /><small className="muted" dir="ltr">{p.nameEn}</small></> },
        { header: t('admin.kind'), render: (p) => <Tag tone={p.kind === 'DIGITAL' ? 'sky' : 'pink'}>{p.kind === 'DIGITAL' ? t('shop.digital') : t('shop.physical')}</Tag> },
        { header: t('shop.category'), render: (p) => t(`category.${p.category}`) },
        { header: t('admin.price'), render: (p) => money(p.priceAgorot) },
        { header: t('admin.active'), render: (p) => (p.isActive ? <Tag tone="green">✓</Tag> : <Tag tone="gray">—</Tag>) },
      ]}
    />
  );
}

/* ======================= שאלות נפוצות ======================= */
export function FaqsAdmin() {
  const { t } = useLang();
  const books = useBookOptions();
  if (books.loading) return <div className="admin-page"><Loading /></div>;
  const fields: FieldDef[] = [
    { name: 'bookId', label: t('admin.book'), type: 'select', options: books.options, nullable: true, hint: t('admin.faqGeneralHint') },
    { name: 'questionHe', label: `${t('admin.question')} (עב)`, type: 'text', required: true, half: true },
    { name: 'questionEn', label: `${t('admin.question')} (EN)`, type: 'text', required: true, half: true, ltr: true },
    { name: 'answerHe', label: `${t('admin.answer')} (עב)`, type: 'textarea', required: true, half: true },
    { name: 'answerEn', label: `${t('admin.answer')} (EN)`, type: 'textarea', required: true, half: true, ltr: true },
    { name: 'sortOrder', label: t('admin.sortOrder'), type: 'number', half: true },
    { name: 'isActive', label: t('admin.active'), type: 'checkbox' },
  ];
  return (
    <ResourceManager<Faq>
      title={t('admin.nav.faqs')}
      endpoint="/api/admin/faqs"
      rowName={(f) => f.questionHe}
      defaults={{ isActive: true, sortOrder: 1, bookId: '' }}
      fields={fields}
      columns={[
        { header: t('admin.question'), render: (f) => <><strong>{f.questionHe}</strong><br /><small className="muted" dir="ltr">{f.questionEn}</small></> },
        { header: t('admin.book'), render: (f) => (f.bookId ? books.options.find((b) => b.value === f.bookId)?.label : <Tag tone="sun">{t('admin.general')}</Tag>) },
        { header: t('admin.active'), render: (f) => (f.isActive ? <Tag tone="green">✓</Tag> : <Tag tone="gray">—</Tag>) },
      ]}
    />
  );
}

/* ======================= פניות ======================= */
export function ContactsAdmin() {
  const { t, lang } = useLang();
  const toast = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const key = ['admin', 'contacts', status, page];
  const list = useQuery({ queryKey: key, queryFn: () => api<Paginated<ContactMessage>>(`/api/admin/contact-messages?page=${page}&pageSize=15${status ? `&status=${status}` : ''}`, { auth: true }) });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'contacts'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };
  const upd = useMutation({ mutationFn: (v: { id: string; status: string }) => api(`/api/admin/contact-messages/${v.id}`, { method: 'PATCH', body: { status: v.status }, auth: true }), onSuccess: refresh });
  const del = useMutation({ mutationFn: (id: string) => api(`/api/admin/contact-messages/${id}`, { method: 'DELETE', auth: true }), onSuccess: () => { toast(t('admin.deleted')); refresh(); } });

  return (
    <div className="admin-page">
      <h1>{t('admin.nav.contacts')}</h1>
      <div className="chips">
        {['', 'NEW', 'HANDLED'].map((s) => (
          <button key={s} type="button" className={`chip ${status === s ? 'is-active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>
            {s ? t(`contactStatus.${s}`) : t('shop.all')}
          </button>
        ))}
      </div>
      {list.isLoading && <Loading />}
      {list.data?.items.length === 0 && <p className="muted">{t('admin.noRows')}</p>}
      <div className="stack">
        {list.data?.items.map((m) => (
          <article key={m.id} className={`card message ${m.status === 'NEW' ? 'message--new' : ''}`}>
            <div className="message__head">
              <div>
                <strong>{m.subject}</strong>
                <div className="muted">{m.name} · <span dir="ltr">{m.email}</span> · {fmtDateTime(m.createdAt, lang)}</div>
              </div>
              <Tag tone={m.status === 'NEW' ? 'sun' : 'green'}>{t(`contactStatus.${m.status}`)}</Tag>
            </div>
            {m.orderCode && <p>{t('contact.orderCode')}: <strong dir="ltr">{m.orderCode}</strong></p>}
            <p className="message__body">{m.message}</p>
            <div className="table__actions">
              <a className="btn btn--outline btn--sm" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>{t('admin.reply')}</a>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => upd.mutate({ id: m.id, status: m.status === 'NEW' ? 'HANDLED' : 'NEW' })}>
                {m.status === 'NEW' ? t('admin.markHandled') : t('admin.markNew')}
              </button>
              <ConfirmButton label={t('admin.delete')} confirmText={t('admin.confirmDelete', { name: m.subject })} onConfirm={() => del.mutate(m.id)} />
            </div>
          </article>
        ))}
      </div>
      {list.data && <Pagination page={list.data.page} totalPages={list.data.totalPages} onChange={setPage} />}
    </div>
  );
}

/* ======================= לקוחות ======================= */
export function CustomersAdmin() {
  const { t, lang } = useLang();
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ['admin', 'customers', page], queryFn: () => api<Paginated<Customer>>(`/api/admin/customers?page=${page}&pageSize=20`, { auth: true }) });
  return (
    <div className="admin-page">
      <h1>{t('admin.nav.customers')}</h1>
      <p className="muted">{t('admin.customersHint')}</p>
      {list.isLoading && <Loading />}
      {list.data && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t('form.name')}</th><th>{t('form.email')}</th><th>{t('form.phone')}</th><th>{t('admin.ordersCount')}</th><th>{t('admin.total')}</th><th>{t('admin.lastOrder')}</th></tr></thead>
              <tbody>
                {list.data.items.length === 0 && <tr><td colSpan={6} className="muted">{t('admin.noRows')}</td></tr>}
                {list.data.items.map((c) => (
                  <tr key={c.email}>
                    <td>{c.name}</td>
                    <td dir="ltr">{c.email}</td>
                    <td dir="ltr">{c.phone ?? '–'}</td>
                    <td>{c.ordersCount}</td>
                    <td>{money(c.totalAgorot)}</td>
                    <td>{fmtDateTime(c.lastOrderAt, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={list.data.page} totalPages={list.data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
