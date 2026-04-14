import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { MaintenancePlan, TITLE_SUGGESTIONS } from '../../types';
import { Autocomplete } from '../../components/Autocomplete/Autocomplete';
import { useWebApp, hapticSuccess, hapticError } from '../../hooks/useWebApp';
import styles from './AddMaintenancePlan.module.css';

interface FormData {
  title: string;
  targetKm: string;
  targetDate: string;
  notes: string;
}

const EMPTY: FormData = {
  title: '',
  targetKm: '',
  targetDate: '',
  notes: '',
};

export function AddMaintenancePlan() {
  const { carId, planId } = useParams<{ carId: string; planId: string }>();
  const navigate = useNavigate();
  const webApp = useWebApp();
  const isEdit = !!planId && planId !== 'new';

  const [form, setForm] = useState<FormData>(EMPTY);
  const [summary, setSummary] = useState<string | undefined>(undefined);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    webApp.BackButton.show();
    const back = () => navigate(-1);
    webApp.BackButton.onClick(back);
    return () => webApp.BackButton.offClick(back);
  }, []);

  useEffect(() => {
    if (dirty) webApp.enableClosingConfirmation();
    else webApp.disableClosingConfirmation();
    return () => webApp.disableClosingConfirmation();
  }, [dirty]);

  useEffect(() => {
    if (!isEdit || !carId || !planId) return;
    api.getMaintenancePlans(carId).then((plans) => {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setForm({
          title: plan.title,
          targetKm: plan.targetKm != null ? String(plan.targetKm) : '',
          targetDate: plan.targetDate ?? '',
          notes: plan.notes ?? '',
        });
        setSummary(plan.summary);
      }
    });
  }, [carId, planId]);

  const set = (key: keyof FormData, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Укажите наименование';
    if (!form.targetKm && !form.targetDate) return 'Укажите хотя бы пробег или дату';
    if (form.targetKm && Number(form.targetKm) <= 0) return 'Пробег должен быть больше 0';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { hapticError(); setError(err); return; }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        targetKm: form.targetKm ? Number(form.targetKm) : undefined,
        targetDate: form.targetDate || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (isEdit && planId) {
        await api.updateMaintenancePlan(carId!, planId, payload as Omit<MaintenancePlan, 'id' | 'carId' | 'createdAt'>);
      } else {
        await api.createMaintenancePlan(carId!, payload as Omit<MaintenancePlan, 'id' | 'carId' | 'createdAt'>);
      }
      hapticSuccess();
      webApp.disableClosingConfirmation();
      navigate(-1);
    } catch (e: any) {
      hapticError();
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{isEdit ? 'Редактировать пункт плана' : 'Новый пункт плана'}</h1>

      {error && <div className={styles.error}>{error}</div>}

      {summary && (
        <div className={styles.summaryBlock}>{summary}</div>
      )}

      <div className={styles.form}>
        <Autocomplete
          label="Наименование"
          required
          value={form.title}
          onChange={(v) => set('title', v)}
          suggestions={TITLE_SUGGESTIONS}
          placeholder="Замена масла..."
        />

        <div className={styles.sectionLabel}>Когда выполнить (укажите хотя бы одно) *</div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>При пробеге (км)</label>
            <input
              className={styles.input}
              type="number"
              min="1"
              value={form.targetKm}
              onChange={(e) => set('targetKm', e.target.value)}
              placeholder="74000"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Дата</label>
            <input
              className={styles.input}
              type="date"
              value={form.targetDate}
              onChange={(e) => set('targetDate', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Комментарий</label>
          <textarea
            className={styles.textarea}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Список работ, примечания..."
            rows={15}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button className={styles.cancelBtn} onClick={() => navigate(-1)}>
          Отмена
        </button>
      </div>
    </div>
  );
}
