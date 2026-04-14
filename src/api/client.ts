import { Car, MaintenancePlan, ServiceRecord, ShareTokenResponse, SharedCarData, MakeResult, ModelResult } from '../types';
import { useWebApp } from '../hooks/useWebApp';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

function getInitData(): string {
  return window.WebApp?.initData ?? 'dev';
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Init-Data': getInitData(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ошибка сети' }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Cars
export const api = {
  getCars: () => request<Car[]>('/api/cars'),

  createCar: (data: Omit<Car, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'photoUrl'>) =>
    request<Car>('/api/cars', { method: 'POST', body: JSON.stringify(data) }),

  getCar: (id: string) => request<Car>(`/api/cars/${id}`),

  updateCar: (id: string, data: Omit<Car, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'photoUrl'>) =>
    request<Car>(`/api/cars/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCar: (id: string) => request<void>(`/api/cars/${id}`, { method: 'DELETE' }),

  shareCar: (id: string) =>
    request<ShareTokenResponse>(`/api/cars/${id}/share`, { method: 'POST' }),

  // Records
  getRecords: (carId: string) =>
    request<ServiceRecord[]>(`/api/cars/${carId}/records`),

  createRecord: (
    carId: string,
    data: Omit<ServiceRecord, 'id' | 'carId' | 'createdAt' | 'attachments'>,
  ) =>
    request<ServiceRecord>(`/api/cars/${carId}/records`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRecord: (
    carId: string,
    recordId: string,
    data: Omit<ServiceRecord, 'id' | 'carId' | 'createdAt' | 'attachments'>,
  ) =>
    request<ServiceRecord>(`/api/cars/${carId}/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRecord: (carId: string, recordId: string) =>
    request<void>(`/api/cars/${carId}/records/${recordId}`, { method: 'DELETE' }),

  // Car mileage quick update
  updateMileage: (carId: string, mileage: number) =>
    request<Car>(`/api/cars/${carId}/mileage`, {
      method: 'PATCH',
      body: JSON.stringify({ mileage }),
    }),

  // Maintenance plans
  getMaintenancePlans: (carId: string) =>
    request<MaintenancePlan[]>(`/api/cars/${carId}/maintenance`),

  createMaintenancePlan: (
    carId: string,
    data: Omit<MaintenancePlan, 'id' | 'carId' | 'createdAt'>,
  ) =>
    request<MaintenancePlan>(`/api/cars/${carId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMaintenancePlan: (
    carId: string,
    planId: string,
    data: Omit<MaintenancePlan, 'id' | 'carId' | 'createdAt'>,
  ) =>
    request<MaintenancePlan>(`/api/cars/${carId}/maintenance/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMaintenancePlan: (carId: string, planId: string) =>
    request<void>(`/api/cars/${carId}/maintenance/${planId}`, { method: 'DELETE' }),

  // Catalog (public, no auth required)
  searchMakes: (q: string) =>
    request<MakeResult[]>(`/api/catalog/makes?q=${encodeURIComponent(q)}`),

  getModels: (makeId: string) =>
    request<ModelResult[]>(`/api/catalog/makes/${encodeURIComponent(makeId)}/models`),

  // Share (public, no auth)
  getShared: (token: string) =>
    fetch(`${BASE_URL}/api/share/${token}`).then((r) => {
      if (!r.ok) throw new Error('Ссылка не найдена');
      return r.json() as Promise<SharedCarData>;
    }),
};
