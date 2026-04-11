import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Category, ServiceRecord, TITLE_SUGGESTIONS } from '../../types';
import { Autocomplete } from '../../components/Autocomplete/Autocomplete';
import { CategoryBadge } from '../../components/CategoryBadge/CategoryBadge';
import { useWebApp, hapticSuccess, hapticError } from '../../hooks/useWebApp';
import { todayISO } from '../../utils/formatters';
import styles from './AddRecord.module.css';

interface FormData {
  category: Category;
  title: string;
  date: string;
  mileage: string;
  cost: string;
  workshop: string;
  notes: string;
}

const EMPTY: FormData = {
  category: 'maintenance',
  title: '',
  date: todayISO(),
  mileage: '',
  cost: '',
  workshop: '',
  notes: '',
};

export function AddRecord() {
  const { carId, recordId } = useParams<{ carId: string; recordId: string }>();
  const navigate = useNavigate();
  const webApp = useWebApp();
  const isEdit = !!recordId && recordId !== 'new';

  const [form, setForm] = useState<FormData>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevMileage, setPrevMileage] = useState<number>(0);

  useEffect(() => {
    webApp.BackButton.show();
    const back = () => navigate(-1);
    webApp.BackButton.onClick(back);
    return () => webApp.BackButton.offClick(back);
  }, []);

  useEffect(() => {
    if (dirty) {
      webApp.enableClosingConfirmation();
    } else {
      webApp.disableClosingConfirmation();
    }
    return () => webApp.disableClosingConfirmation();
  }, [dirty]);

  useEffect(() => {
    if (!carId) return;
    // Load existing records to get previous mileage
    api.getRecords(carId).then((records) => {
      if (records.length > 0) {
        setPrevMileage(records[0].mileage);
      }
    });

    if (isEdit && recordId) {
      api.getRecords(carId).then((records) => {
        const rec = records.find((r) => r.id === recordId);
        if (rec) {
          setForm({
            category: rec.category,
            title: rec.title,
            date: rec.date,
            mileage: String(rec.mileage),
            cost: rec.cost != null ? String(rec.cost) : '',
            workshop: rec.workshop ?? '',
            notes: rec.notes ?? '',
          });
        }
      });
    }
  }, [carId, recordId]);

  const set = (key: keyof FormData, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const setCategory = (cat: Category) => {
    setForm((f) => ({ ...f, category: cat, title: '' }));
    setDirty(true);
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Укажите наименование';
    const mileage = Number(form.mileage);
    if (!mileage || mileage <= 0) return 'Укажите корректный пробег';
    if (!isEdit && prevMileage > 0 && mileage < prevMileage) {
      return `Пробег не может быть меньше предыдущей записи (${prevMileage} км)`;
    }
    if (!form.date) return 'Укажите дату';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      hapticError();
      setError(err);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Omit<ServiceRecord, 'id' | 'carId' | 'createdAt' | 'attachments'> = {
        category: form.category,
        title: form.title.trim(),
        date: form.date,
        mileage: Number(form.mileage),
        cost: form.cost ? Number(form.cost) : undefined,
        workshop: form.workshop.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (isEdit && recordId) {
        await api.updateRecord(carId!, recordId, payload);
      } else {
        await api.createRecord(carId!, payload);
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

  const categories: Category[] = ['maintenance', 'repair', 'consumable'];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{isEdit ? 'Редактировать запись' : 'Новая запись'}</h1>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Категория *</label>
          <div className={styles.categoryRow}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`${styles.catBtn} ${form.category === cat ? styles.catActive : ''}`}
                onClick={() => setCategory(cat)}
                style={form.category === cat ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary)11' } : {}}
              >
                <CategoryBadge category={cat} />
              </button>
            ))}
          </div>
        </div>

        <Autocomplete
          label="Наименование"
          required
          value={form.title}
          onChange={(v) => set('title', v)}
          suggestions={TITLE_SUGGESTIONS[form.category]}
          placeholder="Замена масла..."
        />

        <div className={styles.field}>
          <label className={styles.label}>Дата *</label>
          <input
            className={styles.input}
            type="date"
            value={form.date}
            max={todayISO()}
            onChange={(e) => set('date', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Пробег (км) *
            {prevMileage > 0 && !isEdit && (
              <span className={styles.hintInline}> — предыдущая запись: {prevMileage.toLocaleString('ru-RU')} км</span>
            )}
          </label>
          <input
            className={styles.input}
            type="number"
            min={isEdit ? 1 : prevMileage}
            value={form.mileage}
            onChange={(e) => set('mileage', e.target.value)}
            placeholder={prevMileage > 0 ? String(prevMileage) : '45000'}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Стоимость (₽)</label>
          <input
            className={styles.input}
            type="number"
            min="0"
            value={form.cost}
            onChange={(e) => set('cost', e.target.value)}
            placeholder="3500"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Автосервис / мастер</label>
          <input
            className={styles.input}
            type="text"
            value={form.workshop}
            onChange={(e) => set('workshop', e.target.value)}
            placeholder="Иваново Авто..."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Комментарий</label>
          <textarea
            className={styles.textarea}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Дополнительная информация..."
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
