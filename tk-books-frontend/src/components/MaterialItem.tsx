import { useState } from 'react';
import { useLang } from '../i18n';
import { pick } from '../utils/format';
import type { Material } from '../types';
import { Tag } from './ui';

const TYPE_ICON: Record<string, string> = { SONG: '🎵', TEST: '📝', REVIEW_SHEET: '📄', TEACHER_GUIDE: '🍎' };

export function MaterialItem({ m }: { m: Material }) {
  const { lang, t } = useLang();
  const [lyrics, setLyrics] = useState(false);
  const lyricsText = pick(lang, m, 'lyrics') || m.lyricsHe || m.lyricsEn;
  const desc = pick(lang, m, 'description');
  return (
    <div className={`material material--${m.type.toLowerCase()}`}>
      <div className="material__icon" aria-hidden="true">
        {TYPE_ICON[m.type]}
      </div>
      <div className="material__main">
        <h3>{pick(lang, m, 'title')}</h3>
        <p>
          {m.unit ? `${t('materials.unit')} ${m.unit}` : ''}
          {m.unit && desc ? ' · ' : ''}
          {desc}
        </p>
        {lyrics && lyricsText && <pre className="material__lyrics">{lyricsText}</pre>}
      </div>
      <div className="material__actions">
        <Tag tone="green">{t('common.free')}</Tag>
        {m.mediaUrl && (
          <a className="btn btn--outline btn--sm" href={m.mediaUrl} target="_blank" rel="noreferrer">
            ▶ {t('materials.listen')}
          </a>
        )}
        {lyricsText && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setLyrics((v) => !v)}>
            {t('materials.lyrics')}
          </button>
        )}
        {m.hasFile && m.downloadUrl && (
          <a className="btn btn--secondary btn--sm" href={m.downloadUrl} download>
            ⬇ {t('common.download')}
          </a>
        )}
      </div>
    </div>
  );
}
