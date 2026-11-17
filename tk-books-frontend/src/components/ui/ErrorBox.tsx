import { ApiError } from '../../api/client';
import { useLang } from '../../i18n';
import { Notice } from './Notice';

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useLang();
  const network = error instanceof ApiError && error.status === 0;
  return (
    <Notice
      pose="confused"
      title={network ? t('error.network') : t('error.generic')}
      text={error instanceof ApiError && error.status !== 0 ? error.message : undefined}
      action={
        onRetry && (
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            {t('common.retry')}
          </button>
        )
      }
    />
  );
}
