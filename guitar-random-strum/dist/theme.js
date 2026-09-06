export function applyRandomStageTheme() {
    const hue = Math.floor(Math.random() * 360);
    const bg = `hsl(${hue}, 32%, 8%)`;
    const panelAlt = `hsl(${hue}, 28%, 17%)`;
    const fg = `hsl(${hue}, 55%, 82%)`;
    const accent = `hsl(${hue}, 70%, 60%)`;
    const root = document.documentElement.style;
    root.setProperty('--stage-bg', bg);
    root.setProperty('--stage-panel-alt', panelAlt);
    root.setProperty('--stage-fg', fg);
    root.setProperty('--accent', accent);
}
