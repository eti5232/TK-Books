import { type ReactNode } from 'react';
import { Lizzy, type LizzyPose } from '../Lizzy';

/** ליזי + הודעה (ריק / שגיאה / טעינה) */
export function Notice({ pose, title, text, action }: { pose: LizzyPose; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="notice">
      <Lizzy pose={pose} height={170} />
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
