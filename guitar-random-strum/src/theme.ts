/**
 * Tints the stage a random hue on each load, so a practice session is visually
 * distinct from the last. Only the stage variables change; the options panel
 * keeps the base palette.
 */
export function applyRandomStageTheme(): void {
  const hue = Math.floor(Math.random() * 360);
  const style = document.documentElement.style;

  style.setProperty('--stage-bg', `hsl(${hue}, 32%, 8%)`);
  style.setProperty('--stage-panel-alt', `hsl(${hue}, 28%, 17%)`);
  style.setProperty('--stage-fg', `hsl(${hue}, 55%, 82%)`);
  style.setProperty('--accent', `hsl(${hue}, 70%, 60%)`);
}
