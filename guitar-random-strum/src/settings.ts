import type { Settings } from './types.js';

const STORAGE_KEY = 'guitar-strum-settings';

export const DEFAULT_SETTINGS: Settings = {
  bpm: 80,
  beatsPerPattern: 4,
  repeats: 4,
  noteDensity: 0.5,
  allowSkippedFirstBeat: false,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}
