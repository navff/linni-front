import { useState, useRef, useEffect } from 'react';
import styles from './Autocomplete.module.css';

interface Props {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function Autocomplete({ value, onChange, suggestions, placeholder, label, required }: Props) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length > 0) {
      const q = value.toLowerCase();
      setFiltered(suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8));
    } else {
      setFiltered(suggestions.slice(0, 8));
    }
  }, [value, suggestions]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.wrapper} ref={ref}>
      {label && <label className={styles.label}>{label}{required && ' *'}</label>}
      <input
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className={styles.dropdown}>
          {filtered.map((s) => (
            <li
              key={s}
              className={styles.item}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s);
                setOpen(false);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
