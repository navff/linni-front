import styles from './EmptyState.module.css';

interface Props {
  emoji: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji, title, description, action }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.emoji}>{emoji}</div>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
