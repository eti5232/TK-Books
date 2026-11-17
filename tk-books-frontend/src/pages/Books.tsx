import { useBooks } from '../hooks/useBooks';
import { BookCard } from '../components/BookCard';
import { ErrorBox, Loading, PageHeader } from '../components/ui';
import { useLang } from '../i18n';

export default function Books() {
  const { t } = useLang();
  const books = useBooks();
  return (
    <>
      <PageHeader title={t('books.title')} subtitle={t('books.subtitle')} />
      <div className="container section">
        {books.isLoading && <Loading />}
        {books.isError && <ErrorBox error={books.error} onRetry={() => void books.refetch()} />}
        {books.data && (
          <div className="grid grid--books">
            {books.data.items.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
