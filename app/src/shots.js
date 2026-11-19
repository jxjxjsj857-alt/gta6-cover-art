// Neon Boulevard Cover Studio — fixed scenes for screenshots.
// ?shot=editor shows the editor with a sample photo loaded.
// ?shot=cover shows the cover alone, full-frame, at the export size the
// query asks for (w/h), with the layout, grade and caption it names.
// window.__shotReady is set once the scene has been painted.
import { drawCover, ensureCoverFonts, GRADES, LAYOUTS } from './cover.js';
import { loadImage } from './photos.js';

const SAMPLES = { boulevard: 'samples/boulevard.jpg', pier: 'samples/pier.jpg' };

// Applies a shot scene to the editor state and redraws. `apply` is the
// editor's own (state, redraw) hook, supplied by main.js.
export async function runShot(shot, query, apply) {
  const photoName = query.get('photo') || 'boulevard';
  const caption = query.get('caption') || 'Sunset Heist';
  const subtitle = query.get('subtitle') || 'neon nights on the boulevard';
  const badge = query.get('badge') || 'VICE CITY NIGHTS';
  const layout = LAYOUTS[query.get('layout')] ? query.get('layout') : 'grid9';
  const grade = GRADES[query.get('grade')] ? query.get('grade') : 'sunset';
  const w = Number(query.get('w')) || 1080;
  const h = Number(query.get('h')) || 1080;

  await ensureCoverFonts();
  const first = await loadImage(SAMPLES[photoName] || SAMPLES.boulevard);
  const second = await loadImage(SAMPLES[photoName === 'pier' ? 'boulevard' : 'pier']);

  const state = {
    layout,
    photos: [first, second],
    title: caption,
    subtitle,
    badge,
    grade,
    grain: true,
    vignette: true,
    frame: true,
  };
  apply(state);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    canvas.width = w;
    canvas.height = h;
    const live = apply(state);
    if (live && live.panels) state.panels = live.panels;
    drawCover(canvas, state);
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
