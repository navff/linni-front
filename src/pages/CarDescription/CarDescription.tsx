import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Car } from '../../types';
import { useWebApp, hapticSuccess, hapticError } from '../../hooks/useWebApp';
import { carLabel } from '../../utils/formatters';
import { analytics } from '../../utils/analytics';
import styles from './CarDescription.module.css';

// Simple markdown renderer for n8n output patterns
function MarkdownLine({ text }: { text: string }): React.ReactElement {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function MarkdownView({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split('\n');
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      blocks.push(<h1 key={key++} className={styles.mdH1}>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      blocks.push(<h2 key={key++} className={styles.mdH2}>{line.slice(3)}</h2>);
    } else if (line.trim() === '') {
      blocks.push(<div key={key++} className={styles.mdSpacer} />);
    } else {
      blocks.push(
        <p key={key++} className={styles.mdP}>
          <MarkdownLine text={line} />
        </p>
      );
    }
  }

  return <div className={styles.markdownBody}>{blocks}</div>;
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 15; // 45 seconds total

export function CarDescription() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const webApp = useWebApp();

  const [car, setCar] = useState<Car | null>(null);
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    webApp.BackButton.show();
    const back = () => navigate(-1);
    webApp.BackButton.onClick(back);
    return () => {
      webApp.BackButton.offClick(back);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (dirty) webApp.enableClosingConfirmation();
    else webApp.disableClosingConfirmation();
    return () => webApp.disableClosingConfirmation();
  }, [dirty]);

  const startPolling = (carId: string) => {
    if (pollAttemptsRef.current >= POLL_MAX_ATTEMPTS) {
      setPolling(false);
      setIsEditing(true);
      return;
    }
    setPolling(true);
    pollTimerRef.current = setTimeout(async () => {
      pollAttemptsRef.current += 1;
      try {
        const updated = await api.getCar(carId);
        if (updated.description) {
          setCar(updated);
          setDescription(updated.description);
          setPolling(false);
        } else {
          startPolling(carId);
        }
      } catch {
        startPolling(carId);
      }
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    if (!id) return;
    api.getCar(id)
      .then((c) => {
        setCar(c);
        if (c.description) {
          setDescription(c.description);
          analytics.descriptionViewed(id, true);
        } else {
          analytics.descriptionViewed(id, false);
          analytics.descriptionGenerated(id);
          api.generateDescription(id).catch(() => {});
          startPolling(id);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (val: string) => {
    setDescription(val);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateDescription(id, description.trim() || null);
      setCar(updated);
      setDirty(false);
      setIsEditing(false);
      analytics.descriptionSaved(id);
      hapticSuccess();
    } catch (e: any) {
      hapticError();
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditToggle = () => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    setPolling(false);
    setIsEditing(true);
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!car) return <div className={styles.errorPage}>{error ?? 'Автомобиль не найден'}</div>;

  const hasDescription = !!description;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backLink} onClick={() => navigate(-1)}>← Назад</button>
        <div className={styles.titleRow}>
          <div className={styles.title}>Описание</div>
          {hasDescription && !isEditing && (
            <button className={styles.editIconBtn} onClick={handleEditToggle}>✏️</button>
          )}
        </div>
        <div className={styles.subtitle}>{carLabel(car)}</div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Polling state: description is being generated */}
      {polling && !isEditing && (
        <div className={styles.generatingBanner}>
          <div className={styles.generatingSpinner} />
          <span>Формируем регламент ТО…</span>
        </div>
      )}

      {/* View mode: render markdown */}
      {hasDescription && !isEditing && (
        <MarkdownView text={description} />
      )}

      {/* Edit mode or empty (after polling gave up) */}
      {isEditing && (
        <>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => handleChange(e.target.value)}
            rows={15}
            placeholder={`Например:\nСвечи: раз в 90 тыс, оригинал\nМасло в коробке — раз в 40 тыс\nАнтифриз — раз в три года`}
            autoFocus
          />
          <div className={styles.actions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            {hasDescription && (
              <button className={styles.cancelBtn} onClick={() => { setIsEditing(false); setDirty(false); setDescription(car.description ?? ''); }}>
                Отмена
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
