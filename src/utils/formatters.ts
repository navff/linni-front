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

export function totalCost(records: { cost?: number }[]): number {
  return records.reduce((sum, r) => sum + (r.cost ?? 0), 0);
}

export function yearCost(records: { cost?: number; date: string }[]): number {
  const year = new Date().getFullYear();
  return records
    .filter((r) => new Date(r.date).getFullYear() === year)
    .reduce((sum, r) => sum + (r.cost ?? 0), 0);
}
