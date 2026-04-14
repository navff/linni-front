/**
 * Background service for fetching AI-generated maintenance recommendations.
 * The external API can take 20–40 seconds, so requests run in the background
 * with a 70-second timeout. Results are stored in memory + localStorage so
 * they survive navigation between pages.
 *
 * The backend handles fetching from n8n and saving plans to the DB.
 * On success, `suggestions` contains the created MaintenancePlan records.
 */

import { MaintenancePlan } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
const TIMEOUT_MS = 70_000;
const STORAGE_KEY = 'linni_service_suggestions';

export type SuggestionStatus = 'idle' | 'loading' | 'done' | 'error';

export interface SuggestionState {
  status: SuggestionStatus;
  suggestions?: MaintenancePlan[];
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
 * Fire-and-forget: starts a background request to the backend, which fetches
 * suggestions from n8n and saves them as MaintenancePlan records in the DB.
 * Callers should NOT await this — navigate away immediately.
 */
export async function fetchSuggestions(
  carId: string,
  lastServiceDate: string,
): Promise<void> {
  const current = getState(carId);
  if (current.status === 'loading' || current.status === 'done') return;

  setState(carId, { status: 'loading' });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}/api/cars/${carId}/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Init-Data': window.WebApp?.initData ?? 'dev',
      },
      body: JSON.stringify({ last_service_date: lastServiceDate }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
      throw new Error(err.detail ?? `HTTP ${res.status}`);
    }

    const suggestions: MaintenancePlan[] = await res.json();
    setState(carId, { status: 'done', suggestions });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    setState(carId, {
      status: 'error',
      error: isTimeout ? 'Превышено время ожидания ответа от сервера' : err.message,
    });
  }
}
