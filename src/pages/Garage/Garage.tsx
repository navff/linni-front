import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Car } from '../../types';
import { CarCard } from '../../components/CarCard/CarCard';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { FloatButton } from '../../components/FloatButton/FloatButton';
import { useWebApp } from '../../hooks/useWebApp';
import { analytics } from '../../utils/analytics';
import styles from './Garage.module.css';

export function Garage() {
  const navigate = useNavigate();
  const webApp = useWebApp();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    webApp.BackButton.hide();
  }, []);

  useEffect(() => {
    api.getCars()
      .then((data) => { setCars(data); analytics.garageViewed(data.length); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const user = webApp.initDataUnsafe.user;
  const name = user?.first_name ?? 'друг';

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Мой гараж</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {!error && cars.length === 0 ? (
        <EmptyState
          emoji="🚗"
          title="Гараж пуст"
          description="Добавьте свой первый автомобиль, чтобы начать вести сервисную книжку"
          action={
            <button className={styles.addBtn} onClick={() => navigate('/cars/new')}>
              Добавить первый автомобиль
            </button>
          }
        />
      ) : (
        <>
          <div className={styles.list}>
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onClick={() => navigate(`/cars/${car.id}`)}
              />
            ))}
          </div>
          <FloatButton onClick={() => navigate('/cars/new')} />
        </>
      )}
    </div>
  );
}
