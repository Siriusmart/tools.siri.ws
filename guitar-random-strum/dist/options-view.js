import { RANGES, valuesIn } from './settings.js';
import { el } from './dom.js';
export function renderOptions(settings, onChange) {
    const root = el('div', 'options');
    root.append(sliderRow('BPM', RANGES.bpm, settings.bpm, String, (bpm) => onChange('bpm', bpm)), sliderRow('Note density', RANGES.noteDensity, settings.noteDensity, (density) => `${Math.round(density * 100)}%`, (density) => onChange('noteDensity', density)), segmentedRow('Beats per pattern', numericChoices(RANGES.beatsPerPattern), settings.beatsPerPattern, (beats) => onChange('beatsPerPattern', beats)), segmentedRow('Repeats', numericChoices(RANGES.repeats), settings.repeats, (repeats) => onChange('repeats', repeats)), segmentedRow('Allow skipped first beat', [
        { label: 'F', value: false },
        { label: 'T', value: true },
    ], settings.allowSkippedFirstBeat, (allow) => onChange('allowSkippedFirstBeat', allow)));
    return root;
}
function numericChoices(range) {
    return valuesIn(range).map((value) => ({ label: String(value), value }));
}
function optionRow(label, control) {
    const row = el('div', 'option-row');
    row.append(el('div', 'option-label', label), control);
    return row;
}
function sliderRow(label, range, value, format, onInput) {
    const slider = el('input', 'option-slider');
    slider.type = 'range';
    slider.min = String(range.min);
    slider.max = String(range.max);
    slider.step = String(range.step);
    slider.value = String(value);
    slider.setAttribute('aria-label', label);
    const readout = el('div', 'option-value', format(value));
    slider.addEventListener('input', () => {
        const parsed = Number(slider.value);
        readout.textContent = format(parsed);
        onInput(parsed);
    });
    const controls = el('div', 'option-controls');
    controls.append(slider, readout);
    return optionRow(label, controls);
}
function segmentedRow(label, choices, selected, onSelect) {
    const group = el('div', 'tap-row');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', label);
    const buttons = choices.map((choice) => {
        const button = el('button', 'tap-target', choice.label);
        button.type = 'button';
        button.setAttribute('role', 'radio');
        button.addEventListener('click', () => {
            select(choice.value);
            onSelect(choice.value);
        });
        return button;
    });
    function select(value) {
        buttons.forEach((button, i) => {
            const isSelected = choices[i].value === value;
            button.classList.toggle('selected', isSelected);
            button.setAttribute('aria-checked', String(isSelected));
        });
    }
    select(selected);
    group.append(...buttons);
    return optionRow(label, group);
}
