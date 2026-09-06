/** Looks up an element the page is expected to provide, failing loudly if it is missing. */
export function byId(id) {
    const element = document.getElementById(id);
    if (element === null)
        throw new Error(`Missing element #${id}`);
    return element;
}
export function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className !== undefined)
        element.className = className;
    if (text !== undefined)
        element.textContent = text;
    return element;
}
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
