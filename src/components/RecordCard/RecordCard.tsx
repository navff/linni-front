import { ServiceRecord } from '../../types';
import { formatMileage, formatCost, formatDateShort } from '../../utils/formatters';
import { CategoryBadge } from '../CategoryBadge/CategoryBadge';
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

  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.header}>
        <CategoryBadge category={record.category} size="sm" />
        <span className={styles.date}>{formatDateShort(record.date)}</span>
      </div>
      <div className={styles.title}>{record.title}</div>
      <div className={styles.footer}>
        <span className={styles.mileage}>{formatMileage(record.mileage)}</span>
        {record.cost != null && record.cost > 0 && (
          <span className={styles.cost}>{formatCost(record.cost)}</span>
        )}
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          aria-label="Удалить запись"
        >
          🗑
        </button>
      </div>
      {record.workshop && <div className={styles.workshop}>{record.workshop}</div>}
    </div>
  );
}
