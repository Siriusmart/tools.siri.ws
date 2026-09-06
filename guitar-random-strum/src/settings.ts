import type { Settings } from './types.js';

const STORAGE_KEY = 'guitar-strum-settings';

export interface Range {
  readonly min: number;
  readonly max: number;
  /** Slider increment; also the spacing of the values offered as buttons. */
  readonly step: number;
  readonly integer?: boolean;
}

/** The allowed span of every numeric setting: used by both the UI and validation. */
export const RANGES = {
  bpm: { min: 40, max: 220, step: 5, integer: true },
  noteDensity: { min: 0, max: 1, step: 0.1 },
  beatsPerPattern: { min: 2, max: 8, step: 1, integer: true },
  repeats: { min: 1, max: 8, step: 1, integer: true },
} as const satisfies Record<string, Range>;

type NumericSetting = keyof typeof RANGES;

export const DEFAULT_SETTINGS: Settings = {
  bpm: 80,
  beatsPerPattern: 4,
  repeats: 4,
  noteDensity: 0.5,
  allowSkippedFirstBeat: false,
};

export function clamp(value: number, range: Range): number {
  const bounded = Math.min(range.max, Math.max(range.min, value));
  return range.integer ? Math.round(bounded) : bounded;
}

/** Every value the range offers as a discrete choice, e.g. 2, 3, ... 8. */
export function valuesIn(range: Range): number[] {
  const count = Math.floor((range.max - range.min) / range.step) + 1;
  return Array.from({ length: count }, (_, i) => range.min + i * range.step);
}

/**
 * Reads stored settings, ignoring anything malformed. Stored values survive
 * across releases, so each field is validated rather than trusted.
 */
export function loadSettings(): Settings {
  const stored = readStored();
  const settings = { ...DEFAULT_SETTINGS };

  for (const key of Object.keys(RANGES) as NumericSetting[]) {
    const value = stored[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      settings[key] = clamp(value, RANGES[key]);
    }
  }
  if (typeof stored.allowSkippedFirstBeat === 'boolean') {
    settings.allowSkippedFirstBeat = stored.allowSkippedFirstBeat;
  }

  return settings;
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage is unavailable in private mode or when over quota; settings are
    // still usable for this session.
  }
}

function readStored(): Partial<Record<keyof Settings, unknown>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
