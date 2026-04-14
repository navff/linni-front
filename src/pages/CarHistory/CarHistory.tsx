import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Car, MaintenancePlan, ServiceRecord } from '../../types';
import { RecordCard } from '../../components/RecordCard/RecordCard';
import { MaintenancePlanCard } from '../../components/MaintenancePlanCard/MaintenancePlanCard';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { FloatButton } from '../../components/FloatButton/FloatButton';
import { useWebApp, hapticImpact, hapticSuccess, hapticError } from '../../hooks/useWebApp';
import { formatMileage, formatCost, totalCost, yearCost, carLabel } from '../../utils/formatters';
import {
  getState,
  subscribe,
  clearSuggestions,
  fetchSuggestions,
  SuggestionState,
} from '../../services/serviceSuggestions';
import { todayISO } from '../../utils/formatters';
import styles from './CarHistory.module.css';

type Tab = 'history' | 'plan';

export function CarHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const webApp = useWebApp();

  const [car, setCar] = useState<Car | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [tab, setTab] = useState<Tab>('plan');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Service suggestions state
  const [suggestionState, setSuggestionState] = useState<SuggestionState>({ status: 'idle' });
  const [applyingPlans, setApplyingPlans] = useState(false);

  // Dialog: запрос даты последнего сервиса перед получением рекомендаций
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [dialogDate, setDialogDate] = useState('');

  // Mileage update dialog
  const [showMileageDialog, setShowMileageDialog] = useState(false);
  const [newMileage, setNewMileage] = useState('');
  const [mileageSaving, setMileageSaving] = useState(false);
  const [mileageError, setMileageError] = useState<string | null>(null);

  useEffect(() => {
    webApp.BackButton.show();
    const back = () => navigate('/');
    webApp.BackButton.onClick(back);
    return () => webApp.BackButton.offClick(back);
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getCar(id), api.getRecords(id), api.getMaintenancePlans(id)])
      .then(([c, r, p]) => { setCar(c); setRecords(r); setPlans(p); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Subscribe to background suggestion updates
  useEffect(() => {
    if (!id) return;
    // Read current state immediately (may already be done/loading)
    setSuggestionState(getState(id));
    // Subscribe for future updates
    const unsubscribe = subscribe(id, (state) => setSuggestionState(state));
    return unsubscribe;
  }, [id]);

  const handleApplySuggestions = async (
    suggestions: SuggestionState['suggestions'],
    lastServiceDate: string | undefined,
  ) => {
    if (!id || !suggestions?.length) return;
    setApplyingPlans(true);
    try {
      const created: MaintenancePlan[] = [];
      for (const s of suggestions) {
        // Парсим целевой пробег из названия вида "Плановое ТО (74000 км)"
        const kmMatch = s.name.match(/\((\d[\d\s]*)\s*км\)/i);
        const targetKm = kmMatch ? parseInt(kmMatch[1].replace(/\s/g, ''), 10) : undefined;
        const plan = await api.createMaintenancePlan(id, {
          title: s.name,
          targetKm,
          targetDate: s.date || undefined,
          summary: s.summary || undefined,
          notes: s.services.length ? s.services.join('\n') : undefined,
        } as Omit<MaintenancePlan, 'id' | 'carId' | 'createdAt'>);
        created.push(plan);
      }
      clearSuggestions(id);
      setSuggestionState({ status: 'idle' });
      setPlans((prev) => [...prev, ...created]);
      hapticSuccess();
    } catch (e: any) {
      hapticError();
      setError(e.message);
    } finally {
      setApplyingPlans(false);
    }
  };

  // Автоматически применяем рекомендации, как только они пришли и регламент пуст
  useEffect(() => {
    if (
      suggestionState.status === 'done' &&
      plans.length === 0 &&
      !applyingPlans &&
      suggestionState.suggestions?.length
    ) {
      handleApplySuggestions(suggestionState.suggestions, suggestionState.lastServiceDate);
    }
  }, [suggestionState.status]);

  // Клик по кнопке «Заполнить по рекомендациям» — только в idle/error, открывает диалог даты
  const handleSuggestClick = () => {
    if (suggestionState.status === 'loading' || applyingPlans) return;
    setDialogDate('');
    setShowDateDialog(true);
  };

  const handleDateDialogSubmit = () => {
    if (!id || !car) return;
    setShowDateDialog(false);
    fetchSuggestions(id, car.make, car.model, String(car.year), dialogDate || todayISO(), car.mileage, car.engineType);
  };

  const handleDelete = async (record: ServiceRecord) => {
    hapticImpact('medium');
    if (!confirm(`Удалить запись «${record.title}»?`)) return;
    await api.deleteRecord(id!, record.id);
    setRecords((prev) => prev.filter((r) => r.id !== record.id));
  };

  const handleDeletePlan = async (plan: MaintenancePlan) => {
    hapticImpact('medium');
    if (!confirm(`Удалить пункт плана «${plan.title}»?`)) return;
    await api.deleteMaintenancePlan(id!, plan.id);
    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
  };

  const handleShare = async () => {
    hapticImpact('light');
    navigate(`/cars/${id}/share`);
  };

  const handleMileageSave = async () => {
    const val = Number(newMileage);
    if (!val || val <= (car?.mileage ?? 0)) {
      setMileageError(`Введите пробег больше текущего (${car?.mileage?.toLocaleString('ru-RU')} км)`);
      return;
    }
    setMileageSaving(true);
    setMileageError(null);
    try {
      const updated = await api.updateMileage(id!, val);
      setCar(updated);
      setShowMileageDialog(false);
      setNewMileage('');
    } catch (e: any) {
      setMileageError(e.message);
    } finally {
      setMileageSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!car) return <div className={styles.error}>{error ?? 'Автомобиль не найден'}</div>;

  const total = totalCost(records);
  const thisYear = yearCost(records);

  const overdueCount = plans.filter((p) => {
    if (p.targetKm != null && p.targetKm <= car.mileage) return true;
    if (p.targetDate && new Date(p.targetDate) < new Date()) return true;
    return false;
  }).length;

  const planIsEmpty = plans.length === 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backLink} onClick={() => navigate('/')}>← Гараж</button>
        <div className={styles.carName}>{carLabel(car)}</div>
        <button className={styles.mileageBtn} onClick={() => { setShowMileageDialog(true); setNewMileage(''); setMileageError(null); }}>
          {formatMileage(car.mileage)} ✏️
        </button>
        <div className={styles.headerActions}>
          <button className={styles.editBtn} onClick={() => navigate(`/cars/${id}/edit`)}>
            ✏️ Редактировать
          </button>
          <button className={styles.shareBtn} onClick={handleShare}>
            🔗 Передать
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>За всё время</div>
          <div className={styles.statValue}>{formatCost(total)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>В этом году</div>
          <div className={styles.statValue}>{formatCost(thisYear)}</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${tab === 'plan' ? styles.tabActive : ''}`}
          onClick={() => setTab('plan')}
        >
          План{overdueCount > 0 && <span className={styles.badge}>{overdueCount}</span>}
        </button>
        <button
          className={`${styles.tabBtn} ${tab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setTab('history')}
        >
          История
        </button>
      </div>

      {/* History tab */}
      {tab === 'history' && (
        <>
          {error && <div className={styles.error}>{error}</div>}

          {records.length === 0 ? (
            <EmptyState
              emoji="📋"
              title="Записей пока нет"
              description="Добавьте первое ТО, чтобы начать вести историю обслуживания"
            />
          ) : (
            <div className={styles.list}>
              {records.map((r) => (
                <RecordCard
                  key={r.id}
                  record={r}
                  onClick={() => navigate(`/cars/${id}/records/${r.id}`)}
                  onDelete={() => handleDelete(r)}
                />
              ))}
            </div>
          )}

          <FloatButton onClick={() => navigate(`/cars/${id}/records/new`)} />
        </>
      )}

      {/* Plan tab */}
      {tab === 'plan' && (
        <>
          {error && <div className={styles.error}>{error}</div>}

          {/* Ошибка получения рекомендаций */}
          {planIsEmpty && suggestionState.status === 'error' && (
            <div className={styles.suggestionBannerError}>
              Не удалось получить рекомендации: {suggestionState.error}
            </div>
          )}

          {planIsEmpty ? (
            <EmptyState
              emoji="📅"
              title="План не настроен"
              description="Добавьте предстоящие работы — масло, жидкости, фильтры"
            />
          ) : (
            <div className={styles.list}>
              {plans.map((p) => (
                <MaintenancePlanCard
                  key={p.id}
                  plan={p}
                  carMileage={car.mileage}
                  onClick={() => navigate(`/cars/${id}/maintenance/${p.id}`)}
                  onDelete={() => handleDeletePlan(p)}
                  onExecute={() => navigate(`/cars/${id}/records/new?planId=${p.id}`)}
                />
              ))}
            </div>
          )}

          {/* Кнопка «Заполнить по рекомендациям» — видна при пустом регламенте */}
          {planIsEmpty && (
            <button
              className={styles.applyBtn}
              onClick={handleSuggestClick}
              disabled={applyingPlans || suggestionState.status === 'loading'}
            >
              {applyingPlans
                ? 'Создаём регламент…'
                : suggestionState.status === 'loading'
                  ? 'Подбираем рекомендации…'
                  : 'Заполнить по рекомендациям'}
            </button>
          )}

          <FloatButton onClick={() => navigate(`/cars/${id}/maintenance/new`)} />
        </>
      )}

      {/* Last service date dialog */}
      {showDateDialog && (
        <div className={styles.dialogOverlay} onClick={() => setShowDateDialog(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogTitle}>Рекомендации по ТО</div>
            <div className={styles.dialogSubtitle}>
              Когда последний раз были в сервисе (примерно)?
            </div>
            <input
              className={styles.dialogInput}
              type="date"
              value={dialogDate}
              max={todayISO()}
              onChange={(e) => setDialogDate(e.target.value)}
              autoFocus
            />
            <div className={styles.dialogActions}>
              <button className={styles.dialogSave} onClick={handleDateDialogSubmit}>
                Получить рекомендации
              </button>
              <button className={styles.dialogCancel} onClick={() => setShowDateDialog(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mileage update dialog */}
      {showMileageDialog && (
        <div className={styles.dialogOverlay} onClick={() => setShowMileageDialog(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogTitle}>Обновить одометр</div>
            <div className={styles.dialogSubtitle}>Текущий: {formatMileage(car.mileage)}</div>
            {mileageError && <div className={styles.dialogError}>{mileageError}</div>}
            <input
              className={styles.dialogInput}
              type="number"
              min={car.mileage + 1}
              value={newMileage}
              onChange={(e) => setNewMileage(e.target.value)}
              placeholder={String(car.mileage + 1000)}
              autoFocus
            />
            <div className={styles.dialogActions}>
              <button className={styles.dialogSave} onClick={handleMileageSave} disabled={mileageSaving}>
                {mileageSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button className={styles.dialogCancel} onClick={() => setShowMileageDialog(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
