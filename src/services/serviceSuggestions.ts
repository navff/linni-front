/**
 * Background service for fetching AI-generated maintenance recommendations.
 * The external API can take 20–40 seconds, so requests run in the background
 * with a 70-second timeout. Results are stored in memory + localStorage so
 * they survive navigation between pages.
 */

const API_URL = 'https://n8n.navff.ru/webhook/linni/service-suggestions';
const API_TOKEN = '9ndns28292bjdjhja';
const TIMEOUT_MS = 70_000;
const STORAGE_KEY = 'linni_service_suggestions';

export interface ServiceSuggestion {
  name: string;
  summary?: string;
  interval_days: number;
  interval_km: number;
  services: string[];
  date: string;
}

export type SuggestionStatus = 'idle' | 'loading' | 'done' | 'error';

export interface SuggestionState {
  status: SuggestionStatus;
  suggestions?: ServiceSuggestion[];
  lastServiceDate?: string;
  error?: string;
}

// In-memory store
const states = new Map<string, SuggestionState>();
type Listener = (state: SuggestionState) => void;
const listeners = new Map<string, Set<Listener>>();

// ── Persistence ──────────────────────────────────────────────────────────────

function loadFromStorage(): Record<string, SuggestionState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(carId: string, state: SuggestionState) {
  try {
    const all = loadFromStorage();
    all[carId] = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore quota errors */ }
}

function removeFromStorage(carId: string) {
  try {
    const all = loadFromStorage();
    delete all[carId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

// ── State management ─────────────────────────────────────────────────────────

function setState(carId: string, state: SuggestionState) {
  states.set(carId, state);
  saveToStorage(carId, state);
  listeners.get(carId)?.forEach((fn) => fn(state));
}

export function getState(carId: string): SuggestionState {
  if (states.has(carId)) return states.get(carId)!;

  // Restore from localStorage (e.g. after page reload)
  const stored = loadFromStorage();
  if (stored[carId]) {
    const s = stored[carId];
    // A persisted "loading" means the tab was closed mid-request – treat as idle
    if (s.status === 'loading') return { status: 'idle' };
    states.set(carId, s);
    return s;
  }

  return { status: 'idle' };
}

/** Subscribe to state updates for a car. Returns an unsubscribe function. */
export function subscribe(carId: string, fn: Listener): () => void {
  if (!listeners.has(carId)) listeners.set(carId, new Set());
  listeners.get(carId)!.add(fn);
  return () => listeners.get(carId)?.delete(fn);
}

/** Remove stored suggestions for a car (call after applying them). */
export function clearSuggestions(carId: string) {
  states.delete(carId);
  removeFromStorage(carId);
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget: starts a background fetch and resolves when done.
 * Callers should NOT await this — navigate away immediately.
 */
const ENGINE_TYPE_LABELS: Record<string, string> = {
  petrol: 'бензин',
  diesel: 'дизель',
  hybrid: 'гибрид',
  electric: 'электро',
};

export async function fetchSuggestions(
  carId: string,
  make: string,
  model: string,
  year: string,
  lastServiceDate: string,
  mileage: number,
  engineType?: string,
): Promise<void> {
  // Skip if already in progress or done
  const current = getState(carId);
  if (current.status === 'loading' || current.status === 'done') return;

  setState(carId, { status: 'loading', lastServiceDate });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const engineLabel = engineType ? ENGINE_TYPE_LABELS[engineType] : undefined;
    const carModel = engineLabel ? `${make} ${model} (${engineLabel})` : `${make} ${model}`;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        car_model: carModel,
        year,
        last_service_date: lastServiceDate,
        milage: String(mileage),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    // API returns: [{ output: [...suggestions] }]
    const suggestions: ServiceSuggestion[] =
      Array.isArray(data) && Array.isArray(data[0]?.output)
        ? data[0].output
        : [];

    setState(carId, { status: 'done', suggestions, lastServiceDate });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    setState(carId, {
      status: 'error',
      error: isTimeout ? 'Превышено время ожидания ответа от сервера' : err.message,
      lastServiceDate,
    });
  }
}
