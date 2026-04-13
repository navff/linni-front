import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { MaintenancePlan, TITLE_SUGGESTIONS } from '../../types';
import { Autocomplete } from '../../components/Autocomplete/Autocomplete';
import { useWebApp, hapticSuccess, hapticError } from '../../hooks/useWebApp';
import { todayISO } from '../../utils/formatters';
import styles from './AddMaintenancePlan.module.css';

interface FormData {
  title: string;
  intervalKm: string;
  intervalMonths: string;
  lastMileage: string;
  lastDate: string;
  notes: string;
}

const EMPTY: FormData = {
  title: '',
  intervalKm: '',
  intervalMonths: '',
  lastMileage: '',
  lastDate: '',
  notes: '',
};

export function AddMaintenancePlan() {
  const { carId, planId } = useParams<{ carId: string; planId: string }>();
  const navigate = useNavigate();
  const webApp = useWebApp();
  const isEdit = !!planId && planId !== 'new';

  const [form, setForm] = useState<FormData>(EMPTY);
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
          intervalKm: plan.intervalKm != null ? String(plan.intervalKm) : '',
          intervalMonths: plan.intervalMonths != null ? String(plan.intervalMonths) : '',
          lastMileage: plan.lastMileage != null ? String(plan.lastMileage) : '',
          lastDate: plan.lastDate ?? '',
          notes: plan.notes ?? '',
        });
      }
    });
  }, [carId, planId]);

  const set = (key: keyof FormData, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Укажите наименование';
    if (!form.intervalKm && !form.intervalMonths) return 'Укажите хотя бы один интервал';
    if (form.intervalKm && Number(form.intervalKm) <= 0) return 'Интервал по пробегу должен быть больше 0';
    if (form.intervalMonths && Number(form.intervalMonths) <= 0) return 'Интервал по времени должен быть больше 0';
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
        intervalKm: form.intervalKm ? Number(form.intervalKm) : undefined,
        intervalMonths: form.intervalMonths ? Number(form.intervalMonths) : undefined,
        lastMileage: form.lastMileage ? Number(form.lastMileage) : undefined,
        lastDate: form.lastDate || undefined,
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
      <h1 className={styles.title}>{isEdit ? 'Редактировать регламент' : 'Новый регламент'}</h1>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.form}>
        <Autocomplete
          label="Наименование"
          required
          value={form.title}
          onChange={(v) => set('title', v)}
          suggestions={TITLE_SUGGESTIONS}
          placeholder="Замена масла..."
        />

        <div className={styles.sectionLabel}>Интервал (укажите хотя бы один) *</div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>По пробегу (км)</label>
            <input
              className={styles.input}
              type="number"
              min="1"
              value={form.intervalKm}
              onChange={(e) => set('intervalKm', e.target.value)}
              placeholder="5000"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>По времени (мес.)</label>
            <input
              className={styles.input}
              type="number"
              min="1"
              value={form.intervalMonths}
              onChange={(e) => set('intervalMonths', e.target.value)}
              placeholder="6"
            />
          </div>
        </div>

        <div className={styles.sectionLabel}>Последнее выполнение (необязательно)</div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>Пробег (км)</label>
            <input
              className={styles.input}
              type="number"
              min="1"
              value={form.lastMileage}
              onChange={(e) => set('lastMileage', e.target.value)}
              placeholder="50000"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Дата</label>
            <input
              className={styles.input}
              type="date"
              value={form.lastDate}
              max={todayISO()}
              onChange={(e) => set('lastDate', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Комментарий</label>
          <textarea
            className={styles.textarea}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Например: сказали в автосервисе..."
            rows={3}
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
