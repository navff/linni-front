import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Car, MakeResult, ModelResult } from '../../types';
import { Autocomplete } from '../../components/Autocomplete/Autocomplete';
import { useWebApp, hapticSuccess, hapticError } from '../../hooks/useWebApp';
import { currentYear } from '../../utils/formatters';
import styles from './AddCar.module.css';

interface FormData {
  make: string;
  model: string;
  year: string;
  vin: string;
  mileage: string;
  nickname: string;
}

const EMPTY: FormData = { make: '', model: '', year: String(currentYear()), vin: '', mileage: '', nickname: '' };

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
          vin: car.vin ?? '',
          mileage: String(car.mileage),
          nickname: car.nickname ?? '',
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
        vin: form.vin.trim() || undefined,
        mileage: Number(form.mileage),
        nickname: form.nickname.trim() || undefined,
      };
      if (isEdit) {
        await api.updateCar(id!, payload as any);
      } else {
        await api.createCar(payload as any);
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
