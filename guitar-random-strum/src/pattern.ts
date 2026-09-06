import type { Pattern, Settings } from './types.js';

export function generatePattern(settings: Settings): Pattern {
  const slots: Pattern = [];
  const totalSlots = settings.beatsPerPattern * 2;

  for (let i = 0; i < totalSlots; i++) {
    const isMainBeat = i % 2 === 0;
    const isFirstBeat = i === 0;
    const direction = isMainBeat ? 'D' : 'U';

    let active: boolean;
    if (isFirstBeat && !settings.allowSkippedFirstBeat) {
      active = true;
    } else {
      active = Math.random() < settings.noteDensity;
    }

    slots.push({ direction, active });
  }

  return slots;
}
