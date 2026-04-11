import { Category, CATEGORY_COLORS, CATEGORY_LABELS } from '../../types';
import styles from './CategoryBadge.module.css';

interface Props {
  category: Category;
  size?: 'sm' | 'md';
}

const ICONS: Record<Category, string> = {
  maintenance: '🔧',
  repair: '🛠️',
  consumable: '🧴',
};

export function CategoryBadge({ category, size = 'md' }: Props) {
  const color = CATEGORY_COLORS[category];
  return (
    <span
      className={`${styles.badge} ${styles[size]}`}
      style={{ backgroundColor: color + '22', color }}
    >
      <span className={styles.icon}>{ICONS[category]}</span>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
