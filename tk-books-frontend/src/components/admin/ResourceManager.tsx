import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { api, ApiError, qs } from '../../api/client';
import { Field } from '../ui/Field';
import { Pagination } from '../ui';
import { useToast } from '../../context/ToastContext';
import { useLang } from '../../i18n';
import type { Paginated } from '../../types';
import { ConfirmButton, Modal } from '../ui';
import { FileField, ImagesField, type ImageValue } from './parts';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'file' | 'images' | 'slug';
  required?: boolean;
  nullable?: boolean;
  options?: { value: string; label: string }[];
  area?: 'public' | 'private';
  folder?: string;
  accept?: string;
  hint?: string;
  ltr?: boolean;
  createOnly?: boolean;
  half?: boolean;
  showIf?: (v: Values) => boolean;
}

export type Values = Record<string, unknown>;

interface Props<T extends { id: string }> {
  title: string;
  endpoint: string;
  columns: { header: string; render: (row: T) => ReactNode }[];
  fields: FieldDef[];
  defaults: Values;
  toForm?: (row: T) => Values;
  rowName: (row: T) => string;
  listParams?: Record<string, string | undefined>;
  filters?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  searchable?: boolean;
}

export function ResourceManager<T extends { id: string }>({ title, endpoint, columns, fields, defaults, toForm, rowName, listParams = {}, filters, rowActions, searchable = true }: Props<T>) {
  const { t } = useLang();
  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ row: T | null } | null>(null);

  const key = ['admin', endpoint, page, q, listParams];
  const list = useQuery({
    queryKey: key,
    queryFn: () => api<Paginated<T>>(`${endpoint}${qs({ page, pageSize: 15, q: q || undefined, ...listParams })}`, { auth: true }),
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ['admin', endpoint] });

  const del = useMutation({
    mutationFn: (id: string) => api(`${endpoint}/${id}`, { method: 'DELETE', auth: true }),
    onSuccess: () => {
      toast(t('admin.deleted'));
      refresh();
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : t('error.generic'), 'error'),
  });

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1>{title}</h1>
        <button type="button" className="btn btn--primary" onClick={() => setEditing({ row: null })}>
          + {t('admin.add')}
        </button>
      </div>

      <div className="admin-toolbar">
        {searchable && (
          <form
            className="filters__row"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQ(text.trim());
            }}
          >
            <input className="input" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('shop.search')} aria-label={t('shop.search')} />
            <button className="btn btn--secondary" type="submit">
              {t('shop.searchBtn')}
            </button>
          </form>
        )}
        {filters}
      </div>

      {list.isLoading && <p>{t('common.loading')}</p>}
      {list.isError && <div className="alert alert--error">{list.error instanceof ApiError ? list.error.message : t('error.generic')}</div>}
      {list.data && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.header}>{c.header}</th>
                  ))}
                  <th>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} className="muted">
                      {t('admin.noRows')}
                    </td>
                  </tr>
                )}
                {list.data.items.map((row) => (
                  <tr key={row.id}>
                    {columns.map((c) => (
                      <td key={c.header}>{c.render(row)}</td>
                    ))}
                    <td className="table__actions">
                      {rowActions?.(row)}
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing({ row })}>
                        {t('admin.edit')}
                      </button>
                      <ConfirmButton label={t('admin.delete')} confirmText={t('admin.confirmDelete', { name: rowName(row) })} onConfirm={() => del.mutate(row.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={list.data.page} totalPages={list.data.totalPages} onChange={setPage} />
        </>
      )}

      {editing && (
        <FormModal<T>
          title={editing.row ? `${t('admin.edit')}: ${rowName(editing.row)}` : `${t('admin.add')}: ${title}`}
          endpoint={endpoint}
          row={editing.row}
          fields={fields}
          initial={editing.row ? (toForm ? toForm(editing.row) : (editing.row as unknown as Values)) : defaults}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast(t('admin.saved'));
            refresh();
          }}
        />
      )}
    </div>
  );
}

function FormModal<T extends { id: string }>({ title, endpoint, row, fields, initial, onClose, onSaved }: { title: string; endpoint: string; row: T | null; fields: FieldDef[]; initial: Values; onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [values, setValues] = useState<Values>(() => {
    const v: Values = {};
    for (const f of fields) v[f.name] = initial[f.name] ?? (f.type === 'checkbox' ? false : f.type === 'images' ? [] : '');
    return v;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (name: string, v: unknown) => setValues((s) => ({ ...s, [name]: v }));

  const buildPayload = (): Values => {
    const p: Values = {};
    for (const f of fields) {
      if (f.createOnly && row) continue;
      if (f.showIf && !f.showIf(values)) continue;
      const raw = values[f.name];
      switch (f.type) {
        case 'checkbox':
          p[f.name] = !!raw;
          break;
        case 'number':
          if (raw === '' || raw === null || raw === undefined) {
            if (f.nullable) p[f.name] = null;
          } else p[f.name] = Number(raw);
          break;
        case 'images':
          p[f.name] = (raw as ImageValue[]).map((i) => ({ key: i.key, altHe: i.altHe, altEn: i.altEn }));
          break;
        case 'slug':
          if (raw) p[f.name] = raw;
          break;
        default:
          if (raw === '' || raw === null || raw === undefined) {
            if (f.nullable) p[f.name] = null;
            else if (f.type === 'text' || f.type === 'textarea') p[f.name] = '';
          } else p[f.name] = raw;
      }
    }
    return p;
  };

  const submit = async () => {
    setErrors({});
    setFormError(null);
    const missing: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && (!f.showIf || f.showIf(values)) && !(f.createOnly && row)) {
        const v = values[f.name];
        if (v === '' || v === null || v === undefined) missing[f.name] = t('form.required');
      }
    }
    if (Object.keys(missing).length) {
      setErrors(missing);
      return;
    }
    setSaving(true);
    try {
      await api(row ? `${endpoint}/${row.id}` : endpoint, { method: row ? 'PUT' : 'POST', body: buildPayload(), auth: true });
      onSaved();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fieldErrors());
        setFormError(e.message);
      } else setFormError(t('error.generic'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose} wide>
      <form
        className="form form--grid"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
      >
        {fields.map((f) => {
          if (f.createOnly && row) return null;
          if (f.showIf && !f.showIf(values)) return null;
          const id = `f-${f.name}`;
          const err = errors[f.name];
          const val = values[f.name];
          let control: ReactNode;
          switch (f.type) {
            case 'textarea':
              control = <textarea id={id} className="input" rows={3} dir={f.ltr ? 'ltr' : undefined} value={String(val ?? '')} onChange={(e) => set(f.name, e.target.value)} />;
              break;
            case 'number':
              control = <input id={id} className="input" type="number" dir="ltr" value={String(val ?? '')} onChange={(e) => set(f.name, e.target.value)} />;
              break;
            case 'checkbox':
              control = (
                <label className="check">
                  <input id={id} type="checkbox" checked={!!val} onChange={(e) => set(f.name, e.target.checked)} /> {f.label}
                </label>
              );
              break;
            case 'select':
              control = (
                <select id={id} className="input" value={String(val ?? '')} onChange={(e) => set(f.name, e.target.value)}>
                  {(f.nullable || !f.required) && <option value="">—</option>}
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              );
              break;
            case 'file':
              control = <FileField id={id} value={String(val ?? '')} onChange={(k) => set(f.name, k)} area={f.area ?? 'private'} folder={f.folder ?? 'misc'} accept={f.accept} />;
              break;
            case 'images':
              control = <ImagesField value={(val as ImageValue[]) ?? []} onChange={(v) => set(f.name, v)} />;
              break;
            default:
              control = <input id={id} className="input" dir={f.ltr || f.type === 'slug' ? 'ltr' : undefined} value={String(val ?? '')} onChange={(e) => set(f.name, e.target.value)} />;
          }
          return (
            <div key={f.name} className={f.half ? 'form__half' : 'form__full'}>
              <Field label={f.type === 'checkbox' ? '' : f.label} htmlFor={id} required={f.required} error={err} hint={f.hint}>
                {control}
              </Field>
            </div>
          );
        })}
        {formError && <div className="alert alert--error form__full" role="alert">{formError}</div>}
        <div className="modal__actions form__full">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? t('common.sending') : t('admin.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
