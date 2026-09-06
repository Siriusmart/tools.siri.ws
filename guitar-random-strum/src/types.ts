export type Direction = 'D' | 'U';

export interface Slot {
  direction: Direction;
  active: boolean;
}

export type Pattern = Slot[];

export interface Settings {
  bpm: number;
  beatsPerPattern: number;
  repeats: number;
  noteDensity: number;
  allowSkippedFirstBeat: boolean;
}
