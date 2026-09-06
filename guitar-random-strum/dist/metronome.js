const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const CLICK_DURATION_SEC = 0.05;
export class Metronome {
    constructor(onTick, onPatternComplete) {
        this.onTick = onTick;
        this.onPatternComplete = onPatternComplete;
        this.audioCtx = null;
        this.timerId = null;
        this.nextTickTime = 0;
        this.slotIndex = 0;
        this.bpm = 80;
        this.totalSlots = 8;
        this.playing = false;
        this.scheduler = () => {
            const ctx = this.audioCtx;
            if (!ctx)
                return;
            while (this.nextTickTime < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
                const slot = this.slotIndex;
                if (slot % 2 === 0) {
                    this.scheduleClick(slot, this.nextTickTime);
                }
                const tickDelayMs = Math.max(0, (this.nextTickTime - ctx.currentTime) * 1000);
                window.setTimeout(() => {
                    if (this.playing)
                        this.onTick(slot);
                }, tickDelayMs);
                const secondsPerSlot = 60 / this.bpm / 2;
                this.nextTickTime += secondsPerSlot;
                this.slotIndex++;
                if (this.slotIndex >= this.totalSlots) {
                    this.slotIndex = 0;
                    const completeDelayMs = Math.max(0, (this.nextTickTime - ctx.currentTime) * 1000 - 5);
                    window.setTimeout(() => {
                        if (this.playing)
                            this.onPatternComplete();
                    }, completeDelayMs);
                }
            }
        };
    }
    isPlaying() {
        return this.playing;
    }
    setBpm(bpm) {
        this.bpm = bpm;
    }
    setTotalSlots(totalSlots) {
        this.totalSlots = totalSlots;
    }
    start(bpm, totalSlots) {
        if (this.playing)
            return;
        this.bpm = bpm;
        this.totalSlots = totalSlots;
        this.slotIndex = 0;
        if (!this.audioCtx) {
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            void this.audioCtx.resume();
        }
        this.nextTickTime = this.audioCtx.currentTime + 0.05;
        this.playing = true;
        this.timerId = window.setInterval(this.scheduler, LOOKAHEAD_MS);
        this.scheduler();
    }
    stop() {
        this.playing = false;
        if (this.timerId !== null) {
            window.clearInterval(this.timerId);
            this.timerId = null;
        }
    }
    scheduleClick(slotIndex, time) {
        const ctx = this.audioCtx;
        if (!ctx)
            return;
        const isFirstBeat = slotIndex === 0;
        const duration = isFirstBeat ? CLICK_DURATION_SEC * 0.7 : CLICK_DURATION_SEC * 1.3;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = isFirstBeat ? 1600 : 550;
        gain.gain.setValueAtTime(isFirstBeat ? 0.35 : 0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
    }
}
