export function formatMileage(km: number): string {
  return `${km.toLocaleString('ru-RU')} км`;
}

export function formatCost(rub: number): string {
  return `${rub.toLocaleString('ru-RU')} ₽`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function carLabel(car: { make: string; model: string; year: number; nickname?: string }): string {
  const base = `${car.make} ${car.model} ${car.year}`;
  return car.nickname ? `${car.nickname} (${base})` : base;
}

const SOON_KM = 1000;  // км до события — «скоро»
const SOON_DAYS = 30;  // дней до события — «скоро»

export function calcPlanStatus(
  plan: { targetKm?: number; targetDate?: string },
  carMileage: number,
): { status: 'ok' | 'soon' | 'overdue' | 'unknown'; kmLabel?: string; dateLabel?: string } {
  let kmStatus: 'ok' | 'soon' | 'overdue' | null = null;
  let dateStatus: 'ok' | 'soon' | 'overdue' | null = null;
  let kmLabel: string | undefined;
  let dateLabel: string | undefined;

  if (plan.targetKm != null) {
    const remaining = plan.targetKm - carMileage;
    if (remaining <= 0) {
      kmLabel = `просрочено на ${formatMileage(Math.abs(remaining))}`;
      kmStatus = 'overdue';
    } else if (remaining <= SOON_KM) {
      kmLabel = `осталось ${formatMileage(remaining)} (при ${plan.targetKm.toLocaleString('ru-RU')} км)`;
      kmStatus = 'soon';
    } else {
      kmLabel = `при ${plan.targetKm.toLocaleString('ru-RU')} км (осталось ${formatMileage(remaining)})`;
      kmStatus = 'ok';
    }
  }

  if (plan.targetDate) {
    const target = new Date(plan.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    if (diffDays < 0) {
      dateLabel = `просрочено на ${Math.abs(diffDays)} дн.`;
      dateStatus = 'overdue';
    } else if (diffDays <= SOON_DAYS) {
      dateLabel = `через ${diffDays} дн. (${formatDateShort(plan.targetDate)})`;
      dateStatus = 'soon';
    } else {
      dateLabel = formatDateShort(plan.targetDate);
      dateStatus = 'ok';
    }
  }

  // Итоговый статус: наихудший из двух
  const rank = { overdue: 3, soon: 2, ok: 1, unknown: 0 } as const;
  const combined = [kmStatus, dateStatus].filter(Boolean) as Array<'ok' | 'soon' | 'overdue'>;
  const status: 'ok' | 'soon' | 'overdue' | 'unknown' =
    combined.length === 0
      ? 'unknown'
      : combined.reduce((worst, s) => rank[s] > rank[worst] ? s : worst);

  return { status, kmLabel, dateLabel };
}

export function totalCost(records: { cost?: number }[]): number {
  return records.reduce((sum, r) => sum + (r.cost ?? 0), 0);
}

export function yearCost(records: { cost?: number; date: string }[]): number {
  const year = new Date().getFullYear();
  return records
    .filter((r) => new Date(r.date).getFullYear() === year)
    .reduce((sum, r) => sum + (r.cost ?? 0), 0);
}
