import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import { accentFor, pick } from '../utils/format';
import type { Book } from '../types';

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

