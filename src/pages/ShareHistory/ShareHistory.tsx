import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../../api/client';
import { Car, ServiceRecord, SharedCarData } from '../../types';
import { RecordCard } from '../../components/RecordCard/RecordCard';
import { CategoryBadge } from '../../components/CategoryBadge/CategoryBadge';
import { useWebApp, hapticSuccess } from '../../hooks/useWebApp';
import { formatMileage, formatDate, carLabel, totalCost } from '../../utils/formatters';
import styles from './ShareHistory.module.css';

// Share generation page
export function ShareHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const webApp = useWebApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    webApp.BackButton.show();
    const back = () => navigate(-1);
    webApp.BackButton.onClick(back);
    return () => webApp.BackButton.offClick(back);
  }, []);

  useEffect(() => {
    if (shareUrl && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shareUrl, { width: 220, margin: 2 });
    }
  }, [shareUrl]);

  const generate = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.shareCar(id);
      setShareUrl(result.shareUrl);
      hapticSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!shareUrl) return;
    try {
      webApp.shareMaxContent({ text: `История обслуживания автомобиля: ${shareUrl}` });
    } catch {
      navigator.clipboard?.writeText(shareUrl);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Передача истории</h1>
      <p className={styles.desc}>
        Сгенерируйте ссылку для передачи полной истории обслуживания новому владельцу.
        Ссылка открывает историю в режиме чтения.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      {!shareUrl ? (
        <button className={styles.generateBtn} onClick={generate} disabled={loading}>
          {loading ? 'Генерация...' : '🔗 Создать ссылку'}
        </button>
      ) : (
        <div className={styles.result}>
          <canvas ref={canvasRef} className={styles.qr} />
          <div className={styles.url}>{shareUrl}</div>
          <button className={styles.shareBtn} onClick={handleShare}>
            📤 Поделиться
          </button>
          <button className={styles.copyBtn} onClick={() => navigator.clipboard?.writeText(shareUrl)}>
            Скопировать ссылку
          </button>
        </div>
      )}
    </div>
  );
}

// Public shared view page (no auth)
export function SharedView() {
  const { token } = useParams<{ token: string }>();
  const webApp = useWebApp();
  const navigate = useNavigate();
  const [data, setData] = useState<SharedCarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    webApp.BackButton.hide();
    if (token) {
      api.getShared(token)
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (error || !data) return <div className={styles.page}><div className={styles.error}>{error ?? 'Не найдено'}</div></div>;

  const { car, records } = data;
  const total = totalCost(records);

  return (
    <div className={styles.page}>
      <div className={styles.shareHeader}>
        <div className={styles.shareIcon}>🚗</div>
        <h1 className={styles.carTitle}>{carLabel(car)}</h1>
        <div className={styles.carMeta}>
          <span>{formatMileage(car.mileage)}</span>
          {car.vin && <span>VIN: {car.vin}</span>}
        </div>
        <div className={styles.totalCost}>Всего расходов: {total.toLocaleString('ru-RU')} ₽</div>
        <div className={styles.readonlyBadge}>Только чтение</div>
      </div>

      <div className={styles.recordList}>
        {records.length === 0 ? (
          <p className={styles.empty}>Записей нет</p>
        ) : (
          records.map((r) => (
            <div key={r.id} className={styles.sharedRecord}>
              <div className={styles.srHeader}>
                <CategoryBadge category={r.category} size="sm" />
                <span className={styles.srDate}>{formatDate(r.date)}</span>
              </div>
              <div className={styles.srTitle}>{r.title}</div>
              <div className={styles.srMeta}>
                <span>{formatMileage(r.mileage)}</span>
                {r.cost != null && r.cost > 0 && <span>{r.cost.toLocaleString('ru-RU')} ₽</span>}
              </div>
              {r.workshop && <div className={styles.srWorkshop}>{r.workshop}</div>}
              {r.notes && <div className={styles.srNotes}>{r.notes}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
