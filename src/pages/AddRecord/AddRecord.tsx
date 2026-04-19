import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { MaintenancePlan, RecordType, ServiceRecord, TITLE_SUGGESTIONS } from '../../types';
import { Autocomplete } from '../../components/Autocomplete/Autocomplete';
import { useWebApp, hapticSuccess, hapticError } from '../../hooks/useWebApp';
import { todayISO } from '../../utils/formatters';
import { analytics } from '../../utils/analytics';
import styles from './AddRecord.module.css';

interface FormData {
  recordType: RecordType;
  title: string;
  date: string;
  mileage: string;
  cost: string;
  workshop: string;
  notes: string;
  fuelLiters: string;
}

const EMPTY: FormData = {
  recordType: 'fuel',
  title: '',
  date: todayISO(),
  mileage: '',
  cost: '',
  workshop: '',
  notes: '',
  fuelLiters: '',
};

export function AddRecord() {
  const { carId, recordId } = useParams<{ carId: string; recordId: string }>();
  const navigate = useNavigate();
  const webApp = useWebApp();
  const [searchParams] = useSearchParams();
  const prefillPlanId = searchParams.get('planId');
  const isEdit = !!recordId && recordId !== 'new';

  const [form, setForm] = useState<FormData>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevMileage, setPrevMileage] = useState<number>(0);

  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [linkedPlanId, setLinkedPlanId] = useState<string>('');

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
    api.getRecords(carId).then((records) => {
      const withMileage = records.filter((r) => r.mileage != null);
      if (withMileage.length > 0) {
        setPrevMileage(withMileage[0].mileage!);
      }
    });

    if (!isEdit) {
      api.getMaintenancePlans(carId).then((loadedPlans) => {
        setPlans(loadedPlans);
        if (prefillPlanId) {
          const plan = loadedPlans.find((p) => p.id === prefillPlanId);
          if (plan) {
            setForm((f) => ({
              ...f,
              title: plan.title,
              notes: plan.notes ?? '',
            }));
            setLinkedPlanId(plan.id);
          }
        }
      }).catch(() => {});
    }

    if (isEdit && recordId) {
      api.getRecords(carId).then((records) => {
        const rec = records.find((r) => r.id === recordId);
        if (rec) {
          setForm({
            recordType: rec.recordType,
            title: rec.title,
            date: rec.date,
            mileage: rec.mileage != null ? String(rec.mileage) : '',
            cost: rec.cost != null ? String(rec.cost) : '',
            workshop: rec.workshop ?? '',
            notes: rec.notes ?? '',
            fuelLiters: rec.fuelLiters != null ? String(rec.fuelLiters) : '',
          });
        }
      });
    }
  }, [carId, recordId]);

  const set = (key: keyof FormData, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const setRecordType = (type: RecordType) => {
    setForm((f) => ({ ...f, recordType: type }));
    setDirty(true);
  };

  const validate = (): string | null => {
    if (form.recordType === 'service') {
      if (!form.title.trim()) return 'Укажите наименование';
      const mileage = Number(form.mileage);
      if (!mileage || mileage <= 0) return 'Укажите корректный пробег';
      if (!isEdit && prevMileage > 0 && mileage < prevMileage) {
        return `Пробег не может быть меньше предыдущей записи (${prevMileage} км)`;
      }
    } else {
      const liters = Number(form.fuelLiters);
      if (!liters || liters <= 0) return 'Укажите количество литров';
      if (form.mileage) {
        const mileage = Number(form.mileage);
        if (mileage <= 0) return 'Укажите корректный пробег';
        if (!isEdit && prevMileage > 0 && mileage < prevMileage) {
          return `Пробег не может быть меньше предыдущей записи (${prevMileage} км)`;
        }
      }
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
      const mileageVal = form.mileage ? Number(form.mileage) : undefined;
      const payload: Omit<ServiceRecord, 'id' | 'carId' | 'createdAt' | 'attachments' | 'consumptionPer100km'> = {
        recordType: form.recordType,
        title: form.title.trim(),
        date: form.date,
        mileage: mileageVal,
        cost: form.cost ? Number(form.cost) : undefined,
        workshop: form.workshop.trim() || undefined,
        notes: form.notes.trim() || undefined,
        fuelLiters: form.recordType === 'fuel' && form.fuelLiters ? Number(form.fuelLiters) : undefined,
      };
      if (isEdit && recordId) {
        await api.updateRecord(carId!, recordId, payload);
        if (form.recordType === 'fuel') {
          analytics.fuelRecordEdited(carId!);
        } else {
          analytics.recordEdited(carId!);
        }
      } else {
        const created = await api.createRecord(carId!, payload);
        if (form.recordType === 'fuel') {
          analytics.fuelRecordCreated(carId!, {
            liters: Number(form.fuelLiters),
            cost: form.cost ? Number(form.cost) : undefined,
            mileage: mileageVal,
            consumptionPer100km: created.consumptionPer100km,
          });
        } else if (linkedPlanId) {
          const linkedPlan = plans.find((p) => p.id === linkedPlanId);
          await api.markMaintenancePlanDone(
            carId!,
            linkedPlanId,
            mileageVal ?? 0,
            form.date,
          );
          analytics.recordCreated(carId!, payload.title, true);
          analytics.planExecuted(carId!, linkedPlan?.title ?? '');
          hapticSuccess();
          webApp.disableClosingConfirmation();
          navigate(-1);
          return;
        } else {
          analytics.recordCreated(carId!, payload.title, false);
        }
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

  const handleDelete = async () => {
    if (!window.confirm('Удалить эту запись?')) return;
    try {
      await api.deleteRecord(carId!, recordId!);
      analytics.recordDeleted(carId!);
      hapticSuccess();
      webApp.disableClosingConfirmation();
      navigate(-1);
    } catch (e: any) {
      hapticError();
      setError(e.message);
    }
  };

  const isFuel = form.recordType === 'fuel';

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{isEdit ? 'Редактировать запись' : 'Новая запись'}</h1>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.form}>
        {!isEdit && (
          <div className={styles.typeRow}>
            <button
              className={`${styles.typeBtn} ${!isFuel ? styles.typeActive : ''}`}
              onClick={() => setRecordType('service')}
              type="button"
            >
              🔧 ТО / Ремонт
            </button>
            <button
              className={`${styles.typeBtn} ${isFuel ? styles.typeActive : ''}`}
              onClick={() => setRecordType('fuel')}
              type="button"
            >
              ⛽ Заправка
            </button>
          </div>
        )}

        {!isFuel && (
          <Autocomplete
            label="Наименование"
            required
            value={form.title}
            onChange={(v) => set('title', v)}
            suggestions={TITLE_SUGGESTIONS}
            placeholder="Замена масла..."
          />
        )}

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

        {isFuel ? (
          <>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>Литры *</label>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fuelLiters}
                  onChange={(e) => set('fuelLiters', e.target.value)}
                  placeholder="45.0"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Сумма (₽)</label>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  value={form.cost}
                  onChange={(e) => set('cost', e.target.value)}
                  placeholder="3500"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Пробег (км)
                {prevMileage > 0 && !isEdit && (
                  <span className={styles.hintInline}> — предыдущая: {prevMileage.toLocaleString('ru-RU')} км</span>
                )}
                <span className={styles.hintInline}> — для расчёта расхода</span>
              </label>
              <input
                className={styles.input}
                type="number"
                min={isEdit ? 1 : prevMileage || 1}
                value={form.mileage}
                onChange={(e) => set('mileage', e.target.value)}
                placeholder={prevMileage > 0 ? String(prevMileage) : '45000'}
              />
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

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

        {!isEdit && !isFuel && plans.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label}>Выполнение регламента</label>
            <select
              className={styles.input}
              value={linkedPlanId}
              onChange={(e) => setLinkedPlanId(e.target.value)}
            >
              <option value="">— не связывать —</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {linkedPlanId && (
              <div className={styles.hintInline} style={{ marginTop: 4 }}>
                После сохранения регламент «{plans.find(p => p.id === linkedPlanId)?.title}» обновится автоматически
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button className={styles.cancelBtn} onClick={() => navigate(-1)}>
          Отмена
        </button>
        {isEdit && isFuel && (
          <button className={styles.deleteRecordBtn} onClick={handleDelete}>
            Удалить запись
          </button>
        )}
      </div>
    </div>
  );
}
