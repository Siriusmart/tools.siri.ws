/** A strum direction: down on the beat, up on the off-beat. */
export type Direction = 'D' | 'U';

/**
 * One eighth-note slot per element: `true` is a strum, `false` a rest.
 * The direction of a slot is fixed by its position (see `directionAt`), so it
 * is derived rather than stored.
 */
export type Pattern = readonly boolean[];

export interface Settings {
  bpm: number;
  beatsPerPattern: number;
  repeats: number;
  /** Chance that any non-mandatory slot is strummed, 0..1. */
  noteDensity: number;
  allowSkippedFirstBeat: boolean;
}
