import type { Pattern, Settings } from './types.js';

export function renderLabelsLine(beatsPerPattern: number): HTMLDivElement {
  const line = document.createElement('div');
  line.className = 'pattern-line';

  const slotCount = beatsPerPattern * 2;
  for (let i = 0; i < slotCount; i++) {
    const isMainBeat = i % 2 === 0;
    const label = isMainBeat ? String(i / 2 + 1) : '+';

    const col = document.createElement('div');
    col.className = 'slot';
    col.dataset.index = String(i);

    const labelEl = document.createElement('div');
    labelEl.className = 'slot-label';
    labelEl.textContent = label;
    col.appendChild(labelEl);

    line.appendChild(col);
  }

  return line;
}

export function renderLettersLine(pattern: Pattern): HTMLDivElement {
  const line = document.createElement('div');
  line.className = 'pattern-line';

  pattern.forEach((slot, i) => {
    const col = document.createElement('div');
    col.className = 'slot';
    col.dataset.index = String(i);

    const letterEl = document.createElement('div');
    letterEl.className = 'slot-letter';
    letterEl.textContent = slot.active ? slot.direction : '';
    col.appendChild(letterEl);

    line.appendChild(col);
  });

  return line;
}

export function renderHighlightRow(beatsPerPattern: number): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'highlight-row';

  const slotCount = beatsPerPattern * 2;
  for (let i = 0; i < slotCount; i++) {
    const cell = document.createElement('div');
    cell.className = 'highlight-cell';
    cell.dataset.index = String(i);
    row.appendChild(cell);
  }

  return row;
}

export function highlightSlot(
  labelsLine: HTMLDivElement,
  lettersLine: HTMLDivElement,
  highlightRow: HTMLDivElement,
  slotIndex: number | null,
): void {
  labelsLine.querySelectorAll('.slot').forEach((el) => el.classList.remove('current'));
  lettersLine.querySelectorAll('.slot').forEach((el) => el.classList.remove('current'));
  highlightRow.querySelectorAll('.highlight-cell').forEach((el) => el.classList.remove('current'));
  if (slotIndex === null) return;
  labelsLine.querySelector<HTMLDivElement>(`.slot[data-index="${slotIndex}"]`)?.classList.add('current');
  lettersLine.querySelector<HTMLDivElement>(`.slot[data-index="${slotIndex}"]`)?.classList.add('current');
  highlightRow
    .querySelector<HTMLDivElement>(`.highlight-cell[data-index="${slotIndex}"]`)
    ?.classList.add('current');
}

export interface OptionCallbacks {
  onBpmChange: (bpm: number) => void;
  onDensityChange: (density: number) => void;
  onBeatsChange: (beats: number) => void;
  onRepeatsChange: (repeats: number) => void;
  onAllowSkipChange: (allow: boolean) => void;
}

export function renderOptions(settings: Settings, callbacks: OptionCallbacks): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'options';

  root.appendChild(
    renderSliderRow('BPM', settings.bpm, 40, 220, 5, (v) => `${v}`, callbacks.onBpmChange),
  );
  root.appendChild(
    renderSliderRow(
      'Note density',
      Math.round(settings.noteDensity * 100),
      0,
      100,
      10,
      (v) => `${v}%`,
      (v) => callbacks.onDensityChange(v / 100),
    ),
  );
  root.appendChild(
    renderTapRow('Beats per pattern', range(2, 8), settings.beatsPerPattern, callbacks.onBeatsChange),
  );
  root.appendChild(renderTapRow('Repeats', range(1, 8), settings.repeats, callbacks.onRepeatsChange));
  root.appendChild(
    renderToggleRow('Allow skipped first beat', settings.allowSkippedFirstBeat, callbacks.onAllowSkipChange),
  );

  return root;
}

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

function renderSliderRow(
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  format: (v: number) => string,
  onChange: (v: number) => void,
): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'option-row';

  const labelEl = document.createElement('div');
  labelEl.className = 'option-label';
  labelEl.textContent = label;

  const controls = document.createElement('div');
  controls.className = 'option-controls';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);
  slider.value = String(value);
  slider.className = 'option-slider';

  const valueEl = document.createElement('div');
  valueEl.className = 'option-value';
  valueEl.textContent = format(value);

  slider.addEventListener('input', () => {
    const v = Number(slider.value);
    valueEl.textContent = format(v);
    onChange(v);
  });

  controls.appendChild(slider);
  controls.appendChild(valueEl);
  row.appendChild(labelEl);
  row.appendChild(controls);
  return row;
}

function renderTapRow(
  label: string,
  values: number[],
  selected: number,
  onChange: (v: number) => void,
): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'option-row';

  const labelEl = document.createElement('div');
  labelEl.className = 'option-label';
  labelEl.textContent = label;

  const targets = document.createElement('div');
  targets.className = 'tap-row';

  values.forEach((v) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tap-target' + (v === selected ? ' selected' : '');
    btn.textContent = String(v);
    btn.addEventListener('click', () => {
      targets.querySelectorAll('.tap-target').forEach((el) => el.classList.remove('selected'));
      btn.classList.add('selected');
      onChange(v);
    });
    targets.appendChild(btn);
  });

  row.appendChild(labelEl);
  row.appendChild(targets);
  return row;
}

function renderToggleRow(label: string, selected: boolean, onChange: (v: boolean) => void): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'option-row';

  const labelEl = document.createElement('div');
  labelEl.className = 'option-label';
  labelEl.textContent = label;

  const targets = document.createElement('div');
  targets.className = 'tap-row';

  (['F', 'T'] as const).forEach((text) => {
    const v = text === 'T';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tap-target' + (v === selected ? ' selected' : '');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      targets.querySelectorAll('.tap-target').forEach((el) => el.classList.remove('selected'));
      btn.classList.add('selected');
      onChange(v);
    });
    targets.appendChild(btn);
  });

  row.appendChild(labelEl);
  row.appendChild(targets);
  return row;
}
