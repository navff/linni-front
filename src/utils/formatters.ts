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

export function calcPlanStatus(
  plan: { intervalKm?: number; intervalMonths?: number; lastMileage?: number; lastDate?: string },
  carMileage: number,
): { status: 'ok' | 'soon' | 'overdue' | 'unknown'; kmLabel?: string; dateLabel?: string } {
  let status: 'ok' | 'soon' | 'overdue' | 'unknown' = 'unknown';
  let kmLabel: string | undefined;
  let dateLabel: string | undefined;

  if (plan.intervalKm && plan.lastMileage != null) {
    const nextKm = plan.lastMileage + plan.intervalKm;
    const remaining = nextKm - carMileage;
    kmLabel = remaining < 0
      ? `просрочено на ${formatMileage(Math.abs(remaining))}`
      : `через ${formatMileage(remaining)} (при ${nextKm.toLocaleString('ru-RU')} км)`;
    if (remaining < 0) status = 'overdue';
    else if (remaining < plan.intervalKm * 0.2) status = 'soon';
    else status = 'ok';
  } else if (plan.intervalKm) {
    kmLabel = `при ${plan.intervalKm.toLocaleString('ru-RU')} км от последнего`;
  }

  if (plan.intervalMonths && plan.lastDate) {
    const last = new Date(plan.lastDate);
    const next = new Date(last);
    next.setMonth(next.getMonth() + plan.intervalMonths);
    const today = new Date();
    const diffDays = Math.round((next.getTime() - today.getTime()) / 86_400_000);
    if (diffDays < 0) {
      dateLabel = `просрочено на ${Math.abs(diffDays)} дн.`;
      if (status !== 'overdue') status = 'overdue';
    } else if (diffDays < 30) {
      dateLabel = `через ${diffDays} дн.`;
      if (status === 'ok' || status === 'unknown') status = 'soon';
    } else {
      const months = Math.round(diffDays / 30);
      dateLabel = `через ${months} мес.`;
      if (status === 'unknown') status = 'ok';
    }
  } else if (plan.intervalMonths) {
    dateLabel = `каждые ${plan.intervalMonths} мес.`;
  }

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
