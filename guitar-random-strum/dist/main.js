import { byId } from './dom.js';
import { generatePattern } from './pattern.js';
import { loadSettings, saveSettings } from './settings.js';
import { Metronome } from './metronome.js';
import { PatternView } from './pattern-view.js';
import { renderOptions } from './options-view.js';
import { applyRandomStageTheme } from './theme.js';
const ICONS = {
    play: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M6 3v18l16-9z" /></svg>',
    pause: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><rect x="4" y="4" width="16" height="16" /></svg>',
};
/** Scroll distances at which the hint fades out and the return button appears. */
const HINT_HIDE_PX = 20;
const BACK_TO_TOP_SHOW_PX = 200;
const playPauseButton = byId('play-pause');
const scrollHint = byId('scroll-hint');
const backToTopButton = byId('back-to-top');
const view = new PatternView({
    labels: byId('labels-line-container'),
    highlight: byId('current-highlight'),
    current: byId('current-line-container'),
    next: byId('next-line-container'),
    counter: byId('counter'),
});
const settings = loadSettings();
let currentPattern = generatePattern(settings);
let nextPattern = generatePattern(settings);
let repeatsLeft = settings.repeats;
const metronome = new Metronome(({ slot, wrapped }) => {
    if (wrapped)
        finishRepeat();
    view.highlight(slot);
});
function updateCounter() {
    view.setCounter(settings.repeats > 1 ? `x${repeatsLeft}` : null);
}
/** Counts down one run through the pattern, moving on once none are left. */
function finishRepeat() {
    repeatsLeft -= 1;
    if (repeatsLeft <= 0) {
        currentPattern = nextPattern;
        nextPattern = generatePattern(settings);
        repeatsLeft = settings.repeats;
        view.swapIn(currentPattern, nextPattern);
        metronome.setSlotCount(currentPattern.length);
    }
    updateCounter();
}
/**
 * Re-rolls the patterns after a change to their shape. While playing, only the
 * upcoming pattern changes so the one being played stays put.
 */
function regeneratePatterns() {
    nextPattern = generatePattern(settings);
    if (!metronome.isPlaying()) {
        currentPattern = generatePattern(settings);
        repeatsLeft = settings.repeats;
        view.showCurrent(currentPattern);
        updateCounter();
    }
    view.showNext(nextPattern);
}
function applySetting(key, value) {
    settings[key] = value;
    saveSettings(settings);
    switch (key) {
        case 'bpm':
            metronome.setBpm(settings.bpm);
            break;
        case 'repeats':
            if (!metronome.isPlaying())
                repeatsLeft = settings.repeats;
            updateCounter();
            break;
        default:
            regeneratePatterns();
    }
}
function togglePlayback() {
    if (metronome.isPlaying()) {
        metronome.stop();
    }
    else {
        repeatsLeft = settings.repeats;
        updateCounter();
        metronome.start(settings.bpm, currentPattern.length);
        scrollToStage();
    }
    syncPlayButton();
}
function syncPlayButton() {
    const playing = metronome.isPlaying();
    playPauseButton.innerHTML = playing ? ICONS.pause : ICONS.play;
    playPauseButton.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}
function scrollToStage() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
applyRandomStageTheme();
view.showCurrent(currentPattern);
view.showNext(nextPattern);
updateCounter();
syncPlayButton();
byId('options-mount').appendChild(renderOptions(settings, applySetting));
playPauseButton.addEventListener('click', togglePlayback);
backToTopButton.addEventListener('click', scrollToStage);
window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || event.repeat)
        return;
    event.preventDefault();
    togglePlayback();
});
window.addEventListener('scroll', () => {
    scrollHint.classList.toggle('hidden', window.scrollY > HINT_HIDE_PX);
    backToTopButton.classList.toggle('visible', window.scrollY > BACK_TO_TOP_SHOW_PX);
}, { passive: true });
