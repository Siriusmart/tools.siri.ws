import type { Direction, Pattern, Settings } from './types.js';

/** Patterns are written in eighth notes: a down and an up per beat. */
export const SLOTS_PER_BEAT = 2;

export function isDownbeat(slot: number): boolean {
  return slot % SLOTS_PER_BEAT === 0;
}

export function directionAt(slot: number): Direction {
  return isDownbeat(slot) ? 'D' : 'U';
}

/** Counting label for a slot: "1", "+", "2", "+", ... */
export function beatLabel(slot: number): string {
  return isDownbeat(slot) ? String(slot / SLOTS_PER_BEAT + 1) : '+';
}

export function generatePattern(settings: Settings): Pattern {
  const { beatsPerPattern, noteDensity, allowSkippedFirstBeat } = settings;

  return Array.from({ length: beatsPerPattern * SLOTS_PER_BEAT }, (_, slot) => {
    const mandatory = slot === 0 && !allowSkippedFirstBeat;
    return mandatory || Math.random() < noteDensity;
  });
}
