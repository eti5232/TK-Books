import { Link } from 'react-router-dom';
import { useBooks } from '../hooks/useBooks';
import { BookCard } from '../components/BookCard';
import { Lizzy } from '../components/Lizzy';
import { ErrorBox, Loading } from '../components/ui';
import { useLang } from '../i18n';

export default function Home() {
  const { t } = useLang();
  const books = useBooks();

  const features: [string, string, string][] = [
    ['🎵', t('home.f.songs'), t('home.f.songsText')],
    ['📝', t('home.f.tests'), t('home.f.testsText')],
    ['📄', t('home.f.review'), t('home.f.reviewText')],
    ['🍎', t('home.f.guide'), t('home.f.guideText')],
  ];

  return (
    <>
      <section className="hero">
        <div className="hero__blob hero__blob--pink" />
        <div className="hero__blob hero__blob--sky" />
        <div className="container hero__inner">
          <div className="hero__text">
            <h1>{t('home.title')}</h1>
            <p>{t('home.subtitle')}</p>
            <div className="hero__actions">
              <Link to="/books" className="btn btn--primary btn--lg">
                {t('home.ctaBooks')}
              </Link>
              <Link to="/shop" className="btn btn--outline btn--lg">
                {t('home.ctaShop')}
              </Link>
            </div>
          </div>
          <div className="hero__lizzy">
            <Lizzy pose="wave" height={330} className="float" />
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section__title">{t('home.ourBooks')}</h2>
        {books.isLoading && <Loading />}
        {books.isError && <ErrorBox error={books.error} onRetry={() => void books.refetch()} />}
        {books.data && (
          <div className="grid grid--books">
            {books.data.items.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </section>

      <section className="section section--sky">
        <div className="container">
          <h2 className="section__title">{t('home.whatHere')}</h2>
          <div className="grid grid--features">
            {features.map(([icon, title, text]) => (
              <div key={title} className="feature">
                <div className="feature__icon" aria-hidden="true">
                  {icon}
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="tag tag--green">{t('common.free')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section__title">{t('home.how')}</h2>
        <ol className="steps">
          {[t('home.step1'), t('home.step2'), t('home.step3')].map((s, i) => (
            <li key={i}>
              <span className="steps__num">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="container">
        <div className="cta-strip">
          <Lizzy pose="shopping" height={150} />
          <div>
            <h2>{t('home.shopTitle')}</h2>
            <p>{t('home.shopText')}</p>
            <Link to="/shop" className="btn btn--primary">
              {t('home.ctaShop')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
