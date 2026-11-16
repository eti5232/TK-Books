import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../api/client';
import { Lizzy } from '../components/Lizzy';
import { useLang } from '../i18n';

/**
 * קורא ספר – צפייה בלבד. אין כפתור הורדה. התמונה מגיעה עם סימן מים מהשרת.
 * חסימות בצד הלקוח (קליק ימני, גרירה, בחירה, הדפסה) הן הקשיה בלבד – לא הגנה מוחלטת.
 */
export default function Reader({ slug, pageCount, title }: { slug: string; pageCount: number; title: string }) {
  const { t, isRtl } = useLang();
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const go = useCallback(
    (p: number) => {
      setLoaded(false);
      setFailed(false);
      setPage(Math.min(pageCount, Math.max(1, p)));
    },
    [pageCount],
  );

  // מקלדת: בעברית החץ השמאלי = הבא
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(page + (isRtl ? 1 : -1));
      if (e.key === 'ArrowRight') go(page + (isRtl ? -1 : 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, page, isRtl]);

  if (pageCount === 0) {
    return (
      <div className="notice">
        <Lizzy pose="confused" height={150} />
        <h2>{t('reader.noPages')}</h2>
      </div>
    );
  }

  const src = (n: number) => apiUrl(`/api/books/${slug}/pages/${n}`);

  return (
    <div className="reader">
      <div className="reader__bar">
        <strong>{title}</strong>
        <span>
          {t('reader.page')} {page} {t('reader.of')} {pageCount}
        </span>
      </div>

      <div className="reader__stage">
        <button type="button" className="reader__arrow" onClick={() => go(page + (isRtl ? 1 : -1))} disabled={isRtl ? page >= pageCount : page <= 1} aria-label={isRtl ? t('common.next') : t('common.prev')}>
          ‹
        </button>

        <div className="reader__paper" onContextMenu={(e) => e.preventDefault()}>
          {!loaded && !failed && (
            <div className="reader__loading">
              <Lizzy pose="reading" height={120} />
            </div>
          )}
          {failed && <p className="reader__error">{t('reader.error')}</p>}
          <img
            key={page}
            src={src(page)}
            alt={`${title} – ${t('reader.page')} ${page}`}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={loaded ? 'is-loaded' : ''}
          />
          {/* טעינה מראש של העמוד הבא בלבד */}
          {page < pageCount && <link rel="prefetch" as="image" href={src(page + 1)} />}
        </div>

        <button type="button" className="reader__arrow" onClick={() => go(page + (isRtl ? -1 : 1))} disabled={isRtl ? page <= 1 : page >= pageCount} aria-label={isRtl ? t('common.prev') : t('common.next')}>
          ›
        </button>
      </div>

      <div className="reader__dots" role="group" aria-label={t('common.pages')}>
        {Array.from({ length: pageCount }, (_, i) => (
          <button key={i} type="button" className={`dot ${page === i + 1 ? 'is-active' : ''}`} onClick={() => go(i + 1)} aria-label={`${t('reader.page')} ${i + 1}`} />
        ))}
      </div>
      <p className="reader__note">{t('reader.viewOnly')}</p>
    </div>
  );
}
