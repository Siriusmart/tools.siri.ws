import { beatLabel, directionAt } from './pattern.js';
import { el, prefersReducedMotion } from './dom.js';
const SWAP_TIMING = { duration: 280, easing: 'ease' };
/** Matches the resting opacity of `#next-line-container` in the stylesheet. */
const NEXT_LINE_OPACITY = 0.32;
/**
 * Owns the pattern block: the counting row, the two pattern lines and the
 * moving highlight. Cells are kept in arrays so advancing the highlight touches
 * only the two slots that changed.
 */
export class PatternView {
    constructor(els) {
        this.els = els;
        this.labelCells = [];
        this.highlightCells = [];
        this.letterCells = [];
        this.currentLine = null;
        this.nextLine = null;
        this.highlighted = null;
    }
    showCurrent(pattern) {
        this.highlight(null);
        this.buildGrid(pattern.length);
        this.currentLine = renderLetters(pattern);
        this.letterCells = childElements(this.currentLine);
        this.els.current.replaceChildren(this.currentLine);
    }
    showNext(pattern) {
        this.nextLine = renderLetters(pattern);
        this.els.next.replaceChildren(this.nextLine);
    }
    /** Replaces both lines, sliding the next pattern up into the current slot. */
    swapIn(current, next) {
        const outgoing = this.currentLine;
        const outgoingRect = this.els.current.getBoundingClientRect();
        const nextRect = this.els.next.getBoundingClientRect();
        this.showCurrent(current);
        this.showNext(next);
        if (outgoing === null || prefersReducedMotion())
            return;
        const travel = nextRect.top - this.els.current.getBoundingClientRect().top;
        flyOut(outgoing, outgoingRect);
        this.currentLine?.animate(riseFrom(travel, NEXT_LINE_OPACITY), SWAP_TIMING);
        this.nextLine?.animate(riseFrom(Math.abs(travel), 0), SWAP_TIMING);
    }
    highlight(slot) {
        if (slot === this.highlighted)
            return;
        this.setHighlighted(this.highlighted, false);
        this.setHighlighted(slot, true);
        this.highlighted = slot;
    }
    /** Shows the remaining-repeats counter, or hides it when given `null`. */
    setCounter(text) {
        this.els.counter.textContent = text ?? '';
        this.els.counter.classList.toggle('hidden', text === null);
    }
    setHighlighted(slot, on) {
        if (slot === null)
            return;
        for (const cells of [this.labelCells, this.letterCells, this.highlightCells]) {
            cells[slot]?.classList.toggle('current', on);
        }
    }
    /** The counting row and highlight track depend only on the number of slots. */
    buildGrid(slotCount) {
        if (this.labelCells.length === slotCount)
            return;
        const labels = el('div', 'pattern-line');
        const highlights = el('div', 'highlight-row');
        for (let slot = 0; slot < slotCount; slot++) {
            const cell = el('div', 'slot');
            cell.appendChild(el('div', 'slot-label', beatLabel(slot)));
            labels.appendChild(cell);
            highlights.appendChild(el('div', 'highlight-cell'));
        }
        this.labelCells = childElements(labels);
        this.highlightCells = childElements(highlights);
        this.els.labels.replaceChildren(labels);
        this.els.highlight.replaceChildren(highlights);
    }
}
function renderLetters(pattern) {
    const line = el('div', 'pattern-line');
    pattern.forEach((active, slot) => {
        const cell = el('div', 'slot');
        cell.appendChild(el('div', 'slot-letter', active ? directionAt(slot) : ''));
        line.appendChild(cell);
    });
    return line;
}
/** Rises into place from `travel` pixels below, fading in from `fromOpacity`. */
function riseFrom(travel, fromOpacity) {
    return [
        { transform: `translateY(${travel}px)`, opacity: fromOpacity },
        { transform: 'none', opacity: 1 },
    ];
}
/** Sends a copy of the retired line up and out, over its own position. */
function flyOut(line, rect) {
    const layer = el('div', 'swap-ghost');
    layer.style.left = `${rect.left}px`;
    layer.style.top = `${rect.top}px`;
    layer.style.width = `${rect.width}px`;
    layer.style.height = `${rect.height}px`;
    layer.appendChild(line.cloneNode(true));
    document.body.appendChild(layer);
    const animation = layer.animate([
        { transform: 'none', opacity: 1 },
        { transform: 'translateY(-100%)', opacity: 0 },
    ], SWAP_TIMING);
    const remove = () => layer.remove();
    void animation.finished.then(remove, remove);
}
function childElements(parent) {
    return Array.from(parent.children);
}
