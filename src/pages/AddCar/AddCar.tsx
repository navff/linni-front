import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Car, EngineType, ENGINE_TYPE_LABELS, MakeResult, ModelResult } from '../../types';
import { Autocomplete } from '../../components/Autocomplete/Autocomplete';
import { useWebApp, hapticSuccess, hapticError, hapticImpact } from '../../hooks/useWebApp';
import { currentYear, todayISO } from '../../utils/formatters';
import { fetchSuggestions } from '../../services/serviceSuggestions';
import { analytics } from '../../utils/analytics';
import styles from './AddCar.module.css';

interface FormData {
  make: string;
  model: string;
  year: string;
  engineType: EngineType | '';
  vin: string;
  mileage: string;
  nickname: string;
  lastServiceDate: string;
}

const EMPTY: FormData = {
  make: '',
  model: '',
  year: String(currentYear()),
  engineType: '',
  vin: '',
  mileage: '',
  nickname: '',
  lastServiceDate: '',
};

const ENGINE_OPTIONS = Object.entries(ENGINE_TYPE_LABELS) as [EngineType, string][];

export function AddCar() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const webApp = useWebApp();
  const isEdit = !!id && id !== 'new';

  const [form, setForm] = useState<FormData>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [makeSuggestions, setMakeSuggestions] = useState<MakeResult[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);

  useEffect(() => {
    webApp.BackButton.show();
    const back = () => navigate(-1);
    webApp.BackButton.onClick(back);
    return () => webApp.BackButton.offClick(back);
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.getCar(id!).then((car) => {
        setForm({
          make: car.make,
          model: car.model,
          year: String(car.year),
          engineType: car.engineType ?? '',
          vin: car.vin ?? '',
          mileage: String(car.mileage),
          nickname: car.nickname ?? '',
          lastServiceDate: '',
        });
      });
    }
  }, [id]);

  useEffect(() => {
    if (dirty) {
      webApp.enableClosingConfirmation();
    } else {
      webApp.disableClosingConfirmation();
    }
    return () => webApp.disableClosingConfirmation();
  }, [dirty]);

  // Поиск марок: дебаунс 300 мс, минимум 2 символа
  useEffect(() => {
    if (form.make.length < 2) {
      setMakeSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      api.searchMakes(form.make).then(setMakeSuggestions).catch(() => setMakeSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [form.make]);

  // Загрузка моделей при точном совпадении введённой марки с одним из результатов
  useEffect(() => {
    const match = makeSuggestions.find(
      (m) => m.name.toLowerCase() === form.make.toLowerCase() ||
             m.cyrillic_name.toLowerCase() === form.make.toLowerCase(),
    );
    if (match) {
      api.getModels(match.id)
        .then((models: ModelResult[]) => setModelSuggestions(models.map((m) => m.name)))
        .catch(() => setModelSuggestions([]));
    } else {
      setModelSuggestions([]);
    }
  }, [form.make, makeSuggestions]);

  const set = (key: keyof FormData, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === 'make') setForm((f) => ({ ...f, make: val, model: '' }));
    setDirty(true);
  };

  const validate = (): string | null => {
    if (!form.make.trim()) return 'Укажите марку автомобиля';
    if (!form.model.trim()) return 'Укажите модель автомобиля';
    if (!form.engineType) return 'Укажите тип двигателя';
    const year = Number(form.year);
    if (!year || year < 1990 || year > currentYear()) return `Год должен быть от 1990 до ${currentYear()}`;
    const mileage = Number(form.mileage);
    if (!mileage || mileage <= 0) return 'Укажите корректный пробег';
    if (form.vin && form.vin.trim().length > 30) return 'VIN не может быть длиннее 30 символов';
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
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        engineType: form.engineType || undefined,
        vin: form.vin.trim() || undefined,
        mileage: Number(form.mileage),
        nickname: form.nickname.trim() || undefined,
      };
      if (isEdit) {
        await api.updateCar(id!, payload as any);
        analytics.carEdited(id!);
      } else {
        const newCar = await api.createCar(payload as any);
        analytics.carCreated(payload.make, payload.engineType ?? '');
        if (form.lastServiceDate) {
          fetchSuggestions(newCar.id, form.lastServiceDate);
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
    hapticImpact('medium');
    if (!confirm('Удалить автомобиль? Все записи и план обслуживания будут удалены безвозвратно.')) return;
    try {
      await api.deleteCar(id!);
      analytics.carDeleted(id!);
      hapticSuccess();
      webApp.disableClosingConfirmation();
      navigate('/', { replace: true });
    } catch (e: any) {
      hapticError();
      setError(e.message);
    }
  };

  const years = Array.from({ length: currentYear() - 1989 }, (_, i) => String(currentYear() - i));

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{isEdit ? 'Редактировать' : 'Новый автомобиль'}</h1>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.form}>
        <Autocomplete
          label="Марка"
          required
          value={form.make}
          onChange={(v) => { setForm((f) => ({ ...f, make: v, model: '' })); setDirty(true); }}
          suggestions={makeSuggestions.map((m) => m.name)}
          placeholder="Toyota, BMW, Lada..."
        />

        <Autocomplete
          label="Модель"
          required
          value={form.model}
          onChange={(v) => set('model', v)}
          suggestions={modelSuggestions}
          placeholder={form.make ? 'Выберите модель' : 'Сначала выберите марку'}
        />

        <div className={styles.field}>
          <label className={styles.label}>Тип двигателя *</label>
          <select
            className={styles.select}
            value={form.engineType}
            onChange={(e) => set('engineType', e.target.value as EngineType)}
          >
            <option value="">— выберите —</option>
            {ENGINE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Год выпуска *</label>
          <select
            className={styles.select}
            value={form.year}
            onChange={(e) => set('year', e.target.value)}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Текущий пробег (км) *</label>
          <input
            className={styles.input}
            type="number"
            min="1"
            value={form.mileage}
            onChange={(e) => set('mileage', e.target.value)}
            placeholder="45000"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>VIN / Номер кузова</label>
          <input
            className={styles.input}
            type="text"
            maxLength={30}
            value={form.vin}
            onChange={(e) => set('vin', e.target.value)}
            placeholder="JT..."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Псевдоним</label>
          <input
            className={styles.input}
            type="text"
            value={form.nickname}
            onChange={(e) => set('nickname', e.target.value)}
            placeholder="Рабочая, Жена..."
          />
        </div>

        {!isEdit && (
          <div className={styles.field}>
            <label className={styles.label}>Когда последний раз были в сервисе (примерно)?</label>
            <input
              className={styles.input}
              type="date"
              value={form.lastServiceDate}
              max={todayISO()}
              onChange={(e) => set('lastServiceDate', e.target.value)}
            />
            <span className={styles.fieldHint}>
              Используется для составления рекомендаций по ТО
            </span>
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
        {isEdit && (
          <button className={styles.deleteBtn} onClick={handleDelete}>
            Удалить автомобиль
          </button>
        )}
      </div>
    </div>
  );
}
