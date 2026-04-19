export type EngineType = 'petrol' | 'diesel' | 'hybrid' | 'electric';

export const ENGINE_TYPE_LABELS: Record<EngineType, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  hybrid: 'Гибрид',
  electric: 'Электро',
};

export interface Car {
  id: string;
  userId: number;
  make: string;
  model: string;
  year: number;
  engineType?: EngineType;
  vin?: string;
  mileage: number;
  nickname?: string;
  photoUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRecord {
  id: string;
  carId: string;
  title: string;
  date: string;
  mileage: number;
  cost?: number;
  workshop?: string;
  notes?: string;
  attachments: string[];
  createdAt: string;
}

export interface ShareTokenResponse {
  token: string;
  shareUrl: string;
}

export interface SharedCarData {
  car: Car;
  records: ServiceRecord[];
}

export interface MaintenancePlan {
  id: string;
  carId: string;
  title: string;
  targetKm?: number;
  targetDate?: string;
  summary?: string;
  notes?: string;
  createdAt: string;
}

export type PlanStatus = 'ok' | 'soon' | 'overdue' | 'unknown';

export interface PlanStatusInfo {
  status: PlanStatus;
  kmLabel?: string;
  dateLabel?: string;
}

export interface MakeResult {
  id: string;
  name: string;
  cyrillic_name: string;
  country?: string;
}

export interface ModelResult {
  id: string;
  name: string;
  cyrillic_name: string;
  year_from?: number;
  year_to?: number;
}

export const TITLE_SUGGESTIONS: string[] = [
  'ТО: масло, фильтры',
  'Масло в двигателе',
  'Шины: монтаж и замена',
  'Тормозные колодки: передние/задние',
  'Фильтры: масляный, топливный, воздушный',
  'Свечи зажигания',
  'Замена масла и масляного фильтра',
  'Замена воздушного фильтра',
  'Замена тормозных колодок (передние)',
  'Замена тормозных колодок (задние)',
  'Замена антифриза',
  'Замена тормозной жидкости',
  'Замена аккумулятора',
  'Кузов: антикоррозийная обработка',
  'Салон: химчистка',
  'ЛКП: промывка и защита (керамика, нанопокрытия)',
  'Компьютерная диагностика',
  'Кондиционер: проверка и заправка',
  'Ходовая: диагностика и ремонт',
  'Стойки стабилизатора',
  'Тормозные диски',
  'ГРМ: ремонт и замена (цепь/ремень)',
  'Щётки стеклоочистителей',
  'Радиатор и система охлаждения: промывка',
  'АКПП: замена масла',
  'Кузовной ремонт',
];
