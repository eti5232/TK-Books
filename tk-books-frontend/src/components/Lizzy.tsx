import { useLang } from '../i18n';

export type LizzyPose = 'wave' | 'happy' | 'reading' | 'shopping' | 'confused' | 'sleepy' | 'face';

interface Props {
  pose: LizzyPose;
  height?: number;
  className?: string;
  /** דמות קישוטית בלבד (alt ריק) */
  decorative?: boolean;
}

/** ליזי – בעברית היא מביטה פנימה (הפוכה אופקית) */
export function Lizzy({ pose, height = 220, className = '', decorative = true }: Props) {
  const { lang, t } = useLang();
  const flip = lang === 'he' && pose !== 'face';
  return (
    <img
      src={`/lizzy/lizzy-${pose}.svg`}
      alt={decorative ? '' : t('lizzy.alt')}
      height={height}
      className={`lizzy ${className}`}
      style={{ height, width: 'auto', transform: flip ? 'scaleX(-1)' : undefined }}
      draggable={false}
    />
  );
}
