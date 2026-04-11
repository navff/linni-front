import { Car } from '../../types';
import { formatMileage, formatDate } from '../../utils/formatters';
import styles from './CarCard.module.css';

interface Props {
  car: Car;
  lastServiceDate?: string;
  onClick: () => void;
}

export function CarCard({ car, lastServiceDate, onClick }: Props) {
  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.carIcon}>🚗</div>
      <div className={styles.info}>
        <div className={styles.title}>
          {car.nickname && <span className={styles.nickname}>{car.nickname} · </span>}
          {car.make} {car.model}
        </div>
        <div className={styles.year}>{car.year}</div>
        <div className={styles.meta}>
          <span className={styles.mileage}>{formatMileage(car.mileage)}</span>
          {lastServiceDate && (
            <span className={styles.service}>Последнее ТО: {formatDate(lastServiceDate)}</span>
          )}
        </div>
      </div>
      <div className={styles.arrow}>›</div>
    </div>
  );
}
