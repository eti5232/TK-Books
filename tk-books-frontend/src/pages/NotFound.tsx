import { Link } from 'react-router-dom';
import { Notice } from '../components/ui';
import { useLang } from '../i18n';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="container section">
      <Notice
        pose="confused"
        title={t('notFound.title')}
        text={t('notFound.text')}
        action={
          <Link to="/" className="btn btn--primary">
            {t('notFound.home')}
          </Link>
        }
      />
    </div>
  );
}
