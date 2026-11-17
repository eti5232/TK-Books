import { useState } from 'react';
import { useFaqs } from '../hooks/useFaqs';
import { Accordion, ErrorBox, Loading, Notice, PageHeader } from '../components/ui';
import { useLang } from '../i18n';
import { pick } from '../utils/format';

export default function FaqPage() {
  const { t, lang } = useLang();
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const general = useFaqs({ scope: 'general', q: q || undefined });

  return (
    <>
      <PageHeader title={t('faq.title')} subtitle={t('faq.subtitle')} />
      <div className="container section container--narrow">
        <form
          className="filters__row"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(text.trim());
          }}
        >
          <input className="input" type="search" placeholder={t('faq.search')} value={text} onChange={(e) => setText(e.target.value)} aria-label={t('faq.search')} />
          <button className="btn btn--secondary" type="submit">
            {t('shop.searchBtn')}
          </button>
        </form>
        {general.isLoading && <Loading />}
        {general.isError && <ErrorBox error={general.error} onRetry={() => void general.refetch()} />}
        {general.data && general.data.items.length === 0 && <Notice pose="confused" title={t('faq.empty')} />}
        {general.data && general.data.items.length > 0 && (
          <Accordion items={general.data.items.map((f) => ({ id: f.id, title: pick(lang, f, 'question'), body: pick(lang, f, 'answer') }))} />
        )}
        <p className="muted faq__more">{t('faq.bookHint')}</p>
      </div>
    </>
  );
}
