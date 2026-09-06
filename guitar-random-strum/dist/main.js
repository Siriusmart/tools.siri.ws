import { loadSettings, saveSettings } from './settings.js';
import { generatePattern } from './pattern.js';
import { Metronome } from './metronome.js';
import { renderLabelsLine, renderLettersLine, renderHighlightRow, highlightSlot, renderOptions } from './ui.js';
import { applyRandomStageTheme } from './theme.js';
applyRandomStageTheme();
const settings = loadSettings();
let currentPattern = generatePattern(settings);
let nextPattern = generatePattern(settings);
let repeatsLeft = settings.repeats;
let currentLettersEl;
let labelsLineEl;
let highlightRowEl;
const labelsContainer = document.getElementById('labels-line-container');
const currentContainer = document.getElementById('current-line-container');
const highlightContainer = document.getElementById('current-highlight');
const nextContainer = document.getElementById('next-line-container');
const counterEl = document.getElementById('counter');
const playPauseBtn = document.getElementById('play-pause');
const optionsMount = document.getElementById('options-mount');
const scrollHint = document.getElementById('scroll-hint');
const backToTopBtn = document.getElementById('back-to-top');
function renderCurrent() {
    labelsLineEl = renderLabelsLine(settings.beatsPerPattern);
    labelsContainer.replaceChildren(labelsLineEl);
    highlightRowEl = renderHighlightRow(settings.beatsPerPattern);
    highlightContainer.replaceChildren(highlightRowEl);
    currentLettersEl = renderLettersLine(currentPattern);
    currentContainer.replaceChildren(currentLettersEl);
    counterEl.textContent = `x${repeatsLeft}`;
}
function renderNext() {
    nextContainer.replaceChildren(renderLettersLine(nextPattern));
}
renderCurrent();
renderNext();
const SWAP_ANIM_MS = 280;
function animateLineSwap(outgoingLineEl, outgoingRect, incomingStartRect) {
    const ghostViewport = document.createElement('div');
    ghostViewport.style.position = 'fixed';
    ghostViewport.style.left = `${outgoingRect.left}px`;
    ghostViewport.style.top = `${outgoingRect.top}px`;
    ghostViewport.style.width = `${outgoingRect.width}px`;
    ghostViewport.style.height = `${outgoingRect.height}px`;
    ghostViewport.style.pointerEvents = 'none';
    document.body.appendChild(ghostViewport);
    const ghost = outgoingLineEl.cloneNode(true);
    ghost.style.margin = '0';
    ghost.style.transition = `transform ${SWAP_ANIM_MS}ms ease, opacity ${SWAP_ANIM_MS}ms ease`;
    ghostViewport.appendChild(ghost);
    requestAnimationFrame(() => {
        ghost.style.transform = 'translateY(-100%)';
        ghost.style.opacity = '0';
    });
    setTimeout(() => ghostViewport.remove(), SWAP_ANIM_MS + 30);
    const newCurrentRect = currentContainer.getBoundingClientRect();
    const dy = incomingStartRect.top - newCurrentRect.top;
    currentContainer.style.transition = 'none';
    currentContainer.style.transform = `translateY(${dy}px)`;
    currentContainer.style.opacity = '0.32';
    void currentContainer.offsetHeight;
    currentContainer.style.transition = `transform ${SWAP_ANIM_MS}ms ease, opacity ${SWAP_ANIM_MS}ms ease`;
    requestAnimationFrame(() => {
        currentContainer.style.transform = '';
        currentContainer.style.opacity = '';
    });
    setTimeout(() => {
        currentContainer.style.transition = '';
    }, SWAP_ANIM_MS + 30);
    nextContainer.style.transition = 'none';
    nextContainer.style.transform = `translateY(${Math.abs(dy)}px)`;
    nextContainer.style.opacity = '0';
    void nextContainer.offsetHeight;
    nextContainer.style.transition = `transform ${SWAP_ANIM_MS}ms ease, opacity ${SWAP_ANIM_MS}ms ease`;
    requestAnimationFrame(() => {
        nextContainer.style.transform = '';
        nextContainer.style.opacity = '';
    });
    setTimeout(() => {
        nextContainer.style.transition = '';
    }, SWAP_ANIM_MS + 30);
}
const metronome = new Metronome((slotIndex) => {
    highlightSlot(labelsLineEl, currentLettersEl, highlightRowEl, slotIndex);
}, () => {
    repeatsLeft--;
    if (repeatsLeft <= 0) {
        const outgoingLineEl = currentLettersEl;
        const outgoingRect = currentContainer.getBoundingClientRect();
        const incomingStartRect = nextContainer.getBoundingClientRect();
        currentPattern = nextPattern;
        nextPattern = generatePattern(settings);
        repeatsLeft = settings.repeats;
        renderCurrent();
        renderNext();
        metronome.setTotalSlots(currentPattern.length);
        animateLineSwap(outgoingLineEl, outgoingRect, incomingStartRect);
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
