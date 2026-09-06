import { isDownbeat, SLOTS_PER_BEAT } from './pattern.js';

export interface Tick {
  /** Index of the slot that has just started. */
  slot: number;
  /** True when this slot begins a fresh run through the pattern. */
  wrapped: boolean;
}

export type TickHandler = (tick: Tick) => void;

/** How often the scheduler wakes up to queue upcoming audio. */
const LOOKAHEAD_MS = 25;
/** How far ahead of the audio clock notes are scheduled. */
const SCHEDULE_AHEAD_SEC = 0.1;
/** Head start before the first click, so scheduling never runs late. */
const START_DELAY_SEC = 0.05;

const CLICKS = {
  accent: { frequency: 1600, gain: 0.35, duration: 0.035 },
  beat: { frequency: 550, gain: 0.25, duration: 0.065 },
} as const;

/**
 * Drives playback from the audio clock. Clicks are scheduled ahead of time on
 * the `AudioContext` timeline (the only clock accurate enough for tempo), while
 * `onTick` is emitted from a rAF loop as each queued slot becomes audible, so
 * the visuals follow the sound instead of a drifting timer.
 */
export class Metronome {
  private ctx: AudioContext | null = null;
  private intervalId: number | null = null;
  private frameId: number | null = null;
  /** Slots that have been scheduled but not yet reached by the audio clock. */
  private pending: Array<Tick & { time: number }> = [];
  private nextSlotTime = 0;
  private slot = 0;
  private wrapPending = false;
  private bpm = 80;
  private slotCount = 8;
  private playing = false;

  constructor(private readonly onTick: TickHandler) {}

  isPlaying(): boolean {
    return this.playing;
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  setSlotCount(slotCount: number): void {
    this.slotCount = slotCount;
  }

  start(bpm: number, slotCount: number): void {
    if (this.playing) return;

    this.bpm = bpm;
    this.slotCount = slotCount;
    this.slot = 0;
    this.wrapPending = false;
    this.pending = [];

    // Constructed on the first play so it is created inside a user gesture.
    const ctx = (this.ctx ??= new AudioContext());
    if (ctx.state === 'suspended') void ctx.resume();

    this.nextSlotTime = ctx.currentTime + START_DELAY_SEC;
    this.playing = true;
    this.intervalId = window.setInterval(this.schedule, LOOKAHEAD_MS);
    this.frameId = requestAnimationFrame(this.emitDueTicks);
    this.schedule();
  }

  stop(): void {
    this.playing = false;
    this.pending = [];
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private schedule = (): void => {
    const ctx = this.ctx;
    if (ctx === null || !this.playing) return;

    const secondsPerSlot = 60 / this.bpm / SLOTS_PER_BEAT;

    while (this.nextSlotTime < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      if (isDownbeat(this.slot)) {
        this.scheduleClick(this.slot === 0 ? CLICKS.accent : CLICKS.beat, this.nextSlotTime);
      }
      this.pending.push({ time: this.nextSlotTime, slot: this.slot, wrapped: this.wrapPending });

      this.wrapPending = false;
      this.nextSlotTime += secondsPerSlot;
      this.slot += 1;
      if (this.slot >= this.slotCount) {
        this.slot = 0;
        this.wrapPending = true;
      }
    }
  };

  private emitDueTicks = (): void => {
    if (!this.playing) return;
    this.frameId = requestAnimationFrame(this.emitDueTicks);

    const ctx = this.ctx;
    if (ctx === null) return;

    // A backgrounded tab stops painting while audio keeps playing, so several
    // slots can fall due at once; they collapse into the latest one.
    let latest: Tick | null = null;
    let wrapped = false;
    while (this.pending.length > 0 && this.pending[0].time <= ctx.currentTime) {
      const tick = this.pending.shift()!;
      wrapped ||= tick.wrapped;
      latest = tick;
    }

    if (latest !== null) this.onTick({ slot: latest.slot, wrapped });
  };

  private scheduleClick(click: (typeof CLICKS)[keyof typeof CLICKS], time: number): void {
    const ctx = this.ctx;
    if (ctx === null) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = click.frequency;
    gain.gain.setValueAtTime(click.gain, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + click.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + click.duration);
  }
}
