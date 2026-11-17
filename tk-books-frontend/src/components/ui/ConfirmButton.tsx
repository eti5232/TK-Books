import { useState } from 'react';
import { useLang } from '../../i18n';
import { Modal } from './Modal';

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

