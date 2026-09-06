import { loadSettings, saveSettings } from './settings.js';
import { generatePattern } from './pattern.js';
import { Metronome } from './metronome.js';
import { renderPatternLine, highlightSlot, renderOptions } from './ui.js';
import { applyRandomStageTheme } from './theme.js';
applyRandomStageTheme();
const settings = loadSettings();
let currentPattern = generatePattern(settings);
let nextPattern = generatePattern(settings);
let repeatsLeft = settings.repeats;
let currentLineEl;
const currentContainer = document.getElementById('current-line-container');
const nextContainer = document.getElementById('next-line-container');
const counterEl = document.getElementById('counter');
const playPauseBtn = document.getElementById('play-pause');
const optionsMount = document.getElementById('options-mount');
const scrollHint = document.getElementById('scroll-hint');
const backToTopBtn = document.getElementById('back-to-top');
function renderCurrent() {
    currentLineEl = renderPatternLine(currentPattern);
    currentContainer.replaceChildren(currentLineEl);
    counterEl.textContent = `x${repeatsLeft}`;
}
function renderNext() {
    nextContainer.replaceChildren(renderPatternLine(nextPattern, false));
}
renderCurrent();
renderNext();
const metronome = new Metronome((slotIndex) => {
    highlightSlot(currentLineEl, slotIndex);
}, () => {
    repeatsLeft--;
    if (repeatsLeft <= 0) {
        currentPattern = nextPattern;
        nextPattern = generatePattern(settings);
        repeatsLeft = settings.repeats;
        renderCurrent();
        renderNext();
        metronome.setTotalSlots(currentPattern.length);
    }
    else {
        counterEl.textContent = `x${repeatsLeft}`;
    }
});
const PLAY_ICON = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M6 3v18l16-9z" /></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><rect x="4" y="4" width="16" height="16" /></svg>';
function updatePlayPauseLabel() {
    playPauseBtn.innerHTML = metronome.isPlaying() ? PAUSE_ICON : PLAY_ICON;
}
updatePlayPauseLabel();
function togglePlayPause() {
    if (metronome.isPlaying()) {
        metronome.stop();
    }
    else {
        repeatsLeft = settings.repeats;
        renderCurrent();
        metronome.start(settings.bpm, currentPattern.length);
    }
    updatePlayPauseLabel();
}
playPauseBtn.addEventListener('click', togglePlayPause);
window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space')
        return;
    e.preventDefault();
    const wasPlaying = metronome.isPlaying();
    togglePlayPause();
    if (!wasPlaying) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
function onShapeAffectingChange() {
    if (metronome.isPlaying()) {
        nextPattern = generatePattern(settings);
        renderNext();
    }
    else {
        currentPattern = generatePattern(settings);
        nextPattern = generatePattern(settings);
        repeatsLeft = settings.repeats;
        renderCurrent();
        renderNext();
    }
}
optionsMount.appendChild(renderOptions(settings, {
    onBpmChange: (bpm) => {
        settings.bpm = bpm;
        saveSettings(settings);
        metronome.setBpm(bpm);
    },
    onDensityChange: (density) => {
        settings.noteDensity = density;
        saveSettings(settings);
        onShapeAffectingChange();
    },
    onBeatsChange: (beats) => {
        settings.beatsPerPattern = beats;
        saveSettings(settings);
        onShapeAffectingChange();
    },
    onRepeatsChange: (repeats) => {
        settings.repeats = repeats;
        saveSettings(settings);
        if (!metronome.isPlaying()) {
            repeatsLeft = repeats;
            counterEl.textContent = `x${repeatsLeft}`;
        }
    },
    onAllowSkipChange: (allow) => {
        settings.allowSkippedFirstBeat = allow;
        saveSettings(settings);
        onShapeAffectingChange();
    },
}));
window.addEventListener('scroll', () => {
    scrollHint.classList.toggle('hidden', window.scrollY > 20);
    backToTopBtn.classList.toggle('visible', window.scrollY > 200);
});
backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
