import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Car, Category, ServiceRecord } from '../../types';
import { RecordCard } from '../../components/RecordCard/RecordCard';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { FloatButton } from '../../components/FloatButton/FloatButton';
import { useWebApp, hapticImpact } from '../../hooks/useWebApp';
import { formatMileage, formatCost, totalCost, yearCost, carLabel } from '../../utils/formatters';
import styles from './CarHistory.module.css';

const FILTERS: { label: string; value: Category | 'all' }[] = [
  { label: 'Все', value: 'all' },
  { label: 'ТО', value: 'maintenance' },
  { label: 'Ремонт', value: 'repair' },
  { label: 'Расходники', value: 'consumable' },
];

export function CarHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const webApp = useWebApp();

  const [car, setCar] = useState<Car | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    webApp.BackButton.show();
    const back = () => navigate('/');
    webApp.BackButton.onClick(back);
    return () => webApp.BackButton.offClick(back);
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getCar(id), api.getRecords(id)])
      .then(([c, r]) => { setCar(c); setRecords(r); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const loadRecords = async (cat: Category | 'all') => {
    if (!id) return;
    setFilter(cat);
    const r = await api.getRecords(id, cat === 'all' ? undefined : cat);
    setRecords(r);
  };

  const handleDelete = async (record: ServiceRecord) => {
    hapticImpact('medium');
    if (!confirm(`Удалить запись «${record.title}»?`)) return;
    await api.deleteRecord(id!, record.id);
    setRecords((prev) => prev.filter((r) => r.id !== record.id));
  };

  const handleShare = async () => {
    hapticImpact('light');
    navigate(`/cars/${id}/share`);
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!car) return <div className={styles.error}>{error ?? 'Автомобиль не найден'}</div>;

  const total = totalCost(records);
  const thisYear = yearCost(records);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backLink} onClick={() => navigate('/')}>← Гараж</button>
        <div className={styles.carName}>{carLabel(car)}</div>
        <div className={styles.mileage}>{formatMileage(car.mileage)}</div>
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

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${filter === f.value ? styles.active : ''}`}
            onClick={() => loadRecords(f.value as any)}
          >
            {f.label}
          </button>
        ))}
      </div>

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
    </div>
  );
}
