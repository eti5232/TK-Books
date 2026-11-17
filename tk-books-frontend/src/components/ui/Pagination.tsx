import { useLang } from '../../i18n';

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const { t } = useLang();
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label={t('common.pages')}>
      <button type="button" className="btn btn--outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t('common.prev')}
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button type="button" className="btn btn--outline" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {t('common.next')}
      </button>
    </nav>
  );
}
