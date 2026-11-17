import { useLang } from '../../i18n';

export function Loading({ rows = 3 }: { rows?: number }) {
  const { t } = useLang();
  return (
    <div className="skeletons" aria-busy="true" aria-label={t('common.loading')}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
