import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import { useLang } from '../i18n';
import type { OrderStatus } from '../types';
import { Tag } from '../components/ui';

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmButton({ label, confirmText, onConfirm, className = 'btn btn--danger btn--sm' }: { label: string; confirmText: string; onConfirm: () => void; className?: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Modal title={label} onClose={() => setOpen(false)}>
          <p>{confirmText}</p>
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {t('common.yes')}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

const STATUS_TONE: Record<OrderStatus, 'sun' | 'sky' | 'pink' | 'green' | 'red' | 'gray'> = {
  PENDING: 'sun',
  PAID: 'sky',
  ORDERED: 'pink',
  SHIPPED: 'pink',
  DELIVERED: 'green',
  CANCELLED: 'gray',
  REFUNDED: 'red',
  APPROVED: 'sky',
  REJECTED: 'red',
};

export function StatusTag({ status }: { status: OrderStatus }) {
  const { t } = useLang();
  return <Tag tone={STATUS_TONE[status]}>{t(`status.${status}`)}</Tag>;
}

interface UploadResult {
  area: string;
  key: string;
  url: string | null;
}

export async function uploadFile(file: File, area: 'public' | 'private', folder: string): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('area', area);
  form.append('folder', folder);
  return api<UploadResult>('/api/admin/uploads', { form, auth: true });
}

/** שדה העלאת קובץ בודד – מחזיר key */
export function FileField({ id, value, onChange, area, folder, accept }: { id: string; value: string; onChange: (key: string) => void; area: 'public' | 'private'; folder: string; accept?: string }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="filefield">
      {preview && <img src={preview} alt="" className="filefield__preview" />}
      <div className="filefield__row">
        <code className="filefield__key" dir="ltr">
          {value || t('admin.noFile')}
        </code>
        <label className="btn btn--outline btn--sm">
          {busy ? t('common.loading') : value ? t('admin.replaceFile') : t('admin.chooseFile')}
          <input
            id={id}
            type="file"
            hidden
            accept={accept}
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setErr(null);
              uploadFile(f, area, folder)
                .then((r) => {
                  onChange(r.key);
                  setPreview(r.url);
                })
                .catch((x) => setErr(x instanceof ApiError ? x.message : String(x)))
                .finally(() => setBusy(false));
              e.target.value = '';
            }}
          />
        </label>
        {value && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => { onChange(''); setPreview(null); }}>
            {t('admin.removeFile')}
          </button>
        )}
      </div>
      {err && <small className="field__error">⚠ {err}</small>}
    </div>
  );
}

export interface ImageValue {
  key: string;
  altHe: string;
  altEn: string;
  url?: string | null;
}

/** רשימת תמונות מוצר */
export function ImagesField({ value, onChange }: { value: ImageValue[]; onChange: (v: ImageValue[]) => void }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="imagesfield">
      <div className="imagesfield__list">
        {value.map((im, i) => (
          <div key={im.key + i} className="imagesfield__item">
            {im.url ? <img src={im.url} alt="" /> : <code dir="ltr">{im.key.split('/').pop()}</code>}
            <input className="input" placeholder={t('admin.altHe')} value={im.altHe} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, altHe: e.target.value } : x)))} />
            <input className="input" dir="ltr" placeholder={t('admin.altEn')} value={im.altEn} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, altEn: e.target.value } : x)))} />
            <button type="button" className="icon-btn" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t('admin.removeFile')}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <label className="btn btn--outline btn--sm">
        {busy ? t('common.loading') : `+ ${t('admin.addImage')}`}
        <input
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setErr(null);
            uploadFile(f, 'public', 'products')
              .then((r) => onChange([...value, { key: r.key, altHe: '', altEn: '', url: r.url }]))
              .catch((x) => setErr(x instanceof ApiError ? x.message : String(x)))
              .finally(() => setBusy(false));
            e.target.value = '';
          }}
        />
      </label>
      {err && <small className="field__error">⚠ {err}</small>}
    </div>
  );
}
