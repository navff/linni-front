import { MaintenancePlan } from '../../types';
import { calcPlanStatus, formatMileage } from '../../utils/formatters';
import styles from './MaintenancePlanCard.module.css';

interface Props {
  plan: MaintenancePlan;
  carMileage: number;
  onClick: () => void;
  onDelete: () => void;
  onExecute: () => void;
}

const STATUS_ICON: Record<string, string> = {
  ok: '⏳',
  soon: '⚠️',
  overdue: '🔴',
  unknown: '⬜',
};

export function MaintenancePlanCard({ plan, carMileage, onClick, onDelete, onExecute }: Props) {
  const { status, kmLabel, dateLabel } = calcPlanStatus(plan, carMileage);

  return (
    <div className={`${styles.card} ${styles[status]}`} onClick={onClick}>
      <div className={styles.top}>
        <span className={styles.icon}>{STATUS_ICON[status]}</span>
        <div className={styles.info}>
          <div className={styles.title}>{plan.title}</div>
          {plan.summary && <div className={styles.summary}>{plan.summary}</div>}
        </div>
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Удалить"
        >
          ✕
        </button>
      </div>

      <div className={styles.footer}>
        <div className={styles.labels}>
          {kmLabel && (
            <span className={`${styles.label} ${status === 'overdue' ? styles.labelRed : status === 'soon' ? styles.labelYellow : styles.labelGreen}`}>
              🛣 {kmLabel}
            </span>
          )}
          {dateLabel && (
            <span className={`${styles.label} ${status === 'overdue' ? styles.labelRed : status === 'soon' ? styles.labelYellow : styles.labelGreen}`}>
              📅 {dateLabel}
            </span>
          )}
          {!plan.targetKm && !plan.targetDate && (
            <span className={styles.labelGray}>Дата и пробег не указаны</span>
          )}
        </div>
        <button
          className={styles.executeBtn}
          onClick={(e) => { e.stopPropagation(); onExecute(); }}
        >
          ✓ Выполнить
        </button>
      </div>
    </div>
  );
}
