export interface Car {
  id: string;
  userId: number;
  make: string;
  model: string;
  year: number;
  vin?: string;
  mileage: number;
  nickname?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type Category = 'maintenance' | 'repair' | 'consumable';

export interface ServiceRecord {
  id: string;
  carId: string;
  category: Category;
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

export const CATEGORY_LABELS: Record<Category, string> = {
  maintenance: 'ТО',
  repair: 'Ремонт',
  consumable: 'Расходники',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  maintenance: '#2196F3',
  repair: '#FF9800',
  consumable: '#4CAF50',
};

export const TITLE_SUGGESTIONS: Record<Category, string[]> = {
  maintenance: [
    'Замена масла и масляного фильтра',
    'Замена воздушного фильтра',
    'Замена свечей зажигания',
    'Замена ремня / цепи ГРМ',
    'Замена антифриза',
    'Замена тормозной жидкости',
    'Сезонная замена шин (лето)',
    'Сезонная замена шин (зима)',
    'Балансировка колёс',
    'Компьютерная диагностика',
  ],
  repair: [
    'Кузовной ремонт',
    'Диагностика ходовой части',
    'Замена аккумулятора',
    'Замена ремня / цепи ГРМ',
    'Компьютерная диагностика',
  ],
  consumable: [
    'Замена масла и масляного фильтра',
    'Замена воздушного фильтра',
    'Замена тормозных колодок (передние)',
    'Замена тормозных колодок (задние)',
    'Замена антифриза',
    'Замена тормозной жидкости',
    'Замена аккумулятора',
  ],
};
