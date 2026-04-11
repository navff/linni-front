import styles from './FloatButton.module.css';
import { hapticImpact } from '../../hooks/useWebApp';

interface Props {
  onClick: () => void;
  label?: string;
}

export function FloatButton({ onClick, label = '+' }: Props) {
  const handleClick = () => {
    hapticImpact('light');
    onClick();
  };

  return (
    <button className={styles.btn} onClick={handleClick} aria-label="Добавить">
      {label}
    </button>
  );
}
