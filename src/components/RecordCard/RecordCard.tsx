import { ServiceRecord } from '../../types';
import { formatMileage, formatCost, formatDateShort } from '../../utils/formatters';
import styles from './RecordCard.module.css';

interface Props {
  record: ServiceRecord;
  onClick: () => void;
  onDelete: () => void;
}

export function RecordCard({ record, onClick, onDelete }: Props) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const isFuel = record.recordType === 'fuel';

  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.header}>
        <span className={styles.date}>{formatDateShort(record.date)}</span>
        {isFuel && <span className={styles.fuelBadge}>⛽</span>}
      </div>
      <div className={styles.title}>{record.title}</div>
      {isFuel ? (
        <div className={styles.footer}>
          <span className={styles.mileage}>
            {record.fuelLiters != null ? `${record.fuelLiters} л` : ''}
            {record.mileage != null ? ` · ${formatMileage(record.mileage)}` : ''}
          </span>
          {record.consumptionPer100km != null && (
            <span className={styles.consumption}>{record.consumptionPer100km} л/100км</span>
          )}
          {record.cost != null && record.cost > 0 && (
            <span className={styles.cost}>{formatCost(record.cost)}</span>
          )}
          <button className={styles.deleteBtn} onClick={handleDelete} aria-label="Удалить запись">🗑</button>
        </div>
      ) : (
        <div className={styles.footer}>
          {record.mileage != null && (
            <span className={styles.mileage}>{formatMileage(record.mileage)}</span>
          )}
          {record.cost != null && record.cost > 0 && (
            <span className={styles.cost}>{formatCost(record.cost)}</span>
          )}
          <button className={styles.deleteBtn} onClick={handleDelete} aria-label="Удалить запись">🗑</button>
        </div>
      )}
      {record.workshop && <div className={styles.workshop}>{record.workshop}</div>}
    </div>
  );
}
