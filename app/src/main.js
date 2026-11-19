// Neon Boulevard Cover Studio — editor wiring.
// Connects the controls to the cover painter: photos, layout, grade,
// lettering and export. The preview canvas redraws live on every change.
import { drawCover, ensureCoverFonts, GRADES, LAYOUTS } from './cover.js';
import { PhotoStore, loadImage, panelsForLayout, fillAllPanels } from './photos.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const tray = document.getElementById('tray');
const store = new PhotoStore();

const state = {
  layout: 'grid9',
  photos: [],
  panels: panelsForLayout(LAYOUTS.grid9.panels, 0),
  title: 'Sunset Heist',
  subtitle: 'neon nights on the boulevard',
  badge: 'VICE CITY NIGHTS',
  grade: 'sunset',
  grain: true,
  vignette: true,
  frame: true,
};

let selectedPhoto = 0;
let selectedPanel = 0;
let fontsReady = false;

function syncPhotos() {
  state.photos = store.images();
}

function redraw() {
  drawCover(canvas, state);
}

function setStatus(text) {
  status.textContent = text;
}

// Rebuilds the panel list when the layout changes, keeping each panel's
// photo where one was already assigned.
function rebuildPanels() {
  const count = LAYOUTS[state.layout].panels;
  const old = state.panels;
  state.panels = panelsForLayout(count, store.length);
  for (let i = 0; i < Math.min(old.length, count); i++) {
    // Keep a panel's framing only when it already had a photo assigned;
    // a fresh panel keeps the new layout's default assignment.
    if (old[i].photoIndex != null) state.panels[i].photoIndex = old[i].photoIndex;
    state.panels[i].zoom = old[i].zoom;
    state.panels[i].panX = old[i].panX;
    state.panels[i].panY = old[i].panY;
    state.panels[i].flip = old[i].flip;
  }
}

// The photo tray: one thumbnail button per loaded photo.
function renderTray() {
  tray.innerHTML = '';
  store.photos.forEach((entry, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb' + (i === selectedPhoto ? ' selected' : '');
    button.title = entry.name;
    const img = document.createElement('img');
    img.src = entry.image.src;
    img.alt = entry.name;
    button.appendChild(img);
    button.addEventListener('click', () => {
      selectedPhoto = i;
      state.panels[selectedPanel].photoIndex = i;
      renderTray();
      redraw();
      setStatus(`Panel ${selectedPanel + 1} now shows ${entry.name}.`);
    });
    tray.appendChild(button);
  });
  const hint = document.createElement('span');
  hint.className = 'tray-hint';
  hint.textContent = store.length === 0 ? 'No photos yet — add one below, or use a sample.' : 'Tap a photo to put it in the selected panel.';
  tray.appendChild(hint);
}

async function addFiles(files) {
  let added = 0;
  for (const file of files) {
    const index = await store.addFile(file);
    if (index === -1) {
      setStatus(`Tray full — at most ${store.length} photos.`);
      break;
    }
    added += 1;
    selectedPhoto = index;
  }
  if (added > 0) {
    syncPhotos();
    rebuildPanels();
    renderTray();
    redraw();
    setStatus(`Added ${added} photo${added > 1 ? 's' : ''}.`);
  }
}

async function loadSamples() {
  await store.addSample('samples/boulevard.jpg', 'boulevard.jpg');
  await store.addSample('samples/pier.jpg', 'pier.jpg');
  selectedPhoto = 0;
  syncPhotos();
  rebuildPanels();
  renderTray();
}

// --- Controls: layout -------------------------------------------------------
document.querySelectorAll('[data-layout]').forEach((button) => {
  button.addEventListener('click', () => {
    state.layout = button.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === button));
    rebuildPanels();
    redraw();
    setStatus(`Layout: ${LAYOUTS[state.layout].name}.`);
  });
});

// --- Controls: grade --------------------------------------------------------
document.querySelectorAll('[data-grade]').forEach((button) => {
  button.addEventListener('click', () => {
    state.grade = button.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === button));
    redraw();
    setStatus(`Grade: ${GRADES[state.grade].name}.`);
  });
});

// --- Controls: lettering ----------------------------------------------------
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const badgeInput = document.getElementById('badge');
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
badgeInput.addEventListener('input', () => { state.badge = badgeInput.value; redraw(); });

// --- Controls: effects ------------------------------------------------------
const grainInput = document.getElementById('grain');
const vignetteInput = document.getElementById('vignette');
const frameInput = document.getElementById('frame');
grainInput.addEventListener('change', () => { state.grain = grainInput.checked; redraw(); });
vignetteInput.addEventListener('change', () => { state.vignette = vignetteInput.checked; redraw(); });
frameInput.addEventListener('change', () => { state.frame = frameInput.checked; redraw(); });

// --- Controls: selected panel framing ---------------------------------------
const zoomInput = document.getElementById('zoom');
const flipButton = document.getElementById('flip');
const fillAllButton = document.getElementById('fill-all');
zoomInput.addEventListener('input', () => {
  state.panels[selectedPanel].zoom = Number(zoomInput.value);
  redraw();
});
flipButton.addEventListener('click', () => {
  const panel = state.panels[selectedPanel];
  panel.flip = !panel.flip;
  redraw();
  setStatus(`Panel ${selectedPanel + 1} ${panel.flip ? 'flipped' : 'unflipped'}.`);
});
fillAllButton.addEventListener('click', () => {
  fillAllPanels(state.panels, selectedPhoto);
  redraw();
  setStatus(`All panels now show ${store.photos[selectedPhoto]?.name || 'the selected photo'}.`);
});

// --- Controls: photos -------------------------------------------------------
document.getElementById('photo').addEventListener('change', (event) => {
  addFiles(event.target.files);
  event.target.value = '';
});
document.getElementById('add-sample').addEventListener('click', () => {
  loadSamples().then(() => {
    redraw();
    setStatus('Sample photos loaded.');
  });
});
const dropZone = document.getElementById('dropzone');
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('over');
  addFiles(event.dataTransfer.files);
});

// --- Canvas interaction: drag to pan the selected panel, wheel to zoom
let dragging = false;
let dragX = 0;
let dragY = 0;
canvas.addEventListener('pointerdown', (event) => {
  dragging = true;
  dragX = event.clientX;
  dragY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const panel = state.panels[selectedPanel];
  panel.panX += ((event.clientX - dragX) / rect.width) * (canvas.width / Math.min(canvas.width, canvas.height));
  panel.panY += ((event.clientY - dragY) / rect.height) * (canvas.height / Math.min(canvas.width, canvas.height));
  panel.panX = Math.max(-0.6, Math.min(0.6, panel.panX));
  panel.panY = Math.max(-0.6, Math.min(0.6, panel.panY));
  dragX = event.clientX;
  dragY = event.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const panel = state.panels[selectedPanel];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
  zoomInput.value = String(panel.zoom);
  redraw();
}, { passive: false });

// --- Export -----------------------------------------------------------------
const exportSizes = { square: [1080, 1080], portrait: [1080, 1350], wide: [1920, 1080] };

async function exportCover(sizeKey) {
  const [w, h] = exportSizes[sizeKey];
  await ensureCoverFonts();
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  drawCover(offscreen, state);
  const name = `neon-boulevard-cover-${w}x${h}.png`;
  offscreen.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved ${name}.`);
  }, 'image/png');
  return offscreen;
}

document.querySelectorAll('[data-export]').forEach((button) => {
  button.addEventListener('click', () => exportCover(button.dataset.export));
});

// Exposed for the screenshot scenes (and for testing): draws the cover at
// full export resolution and returns the offscreen canvas.
window.__exportCover = exportCover;

// --- Screenshot scenes ------------------------------------------------------
// Applies a fixed scene (from shots.js) onto this editor's state.
function applyShotScene(scene) {
  state.layout = scene.layout;
  state.title = scene.title;
  state.subtitle = scene.subtitle;
  state.badge = scene.badge;
  state.grade = scene.grade;
  state.grain = scene.grain;
  state.vignette = scene.vignette;
  state.frame = scene.frame;
  titleInput.value = scene.title;
  subtitleInput.value = scene.subtitle;
  badgeInput.value = scene.badge;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === scene.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === scene.grade));
  grainInput.checked = scene.grain;
  vignetteInput.checked = scene.vignette;
  frameInput.checked = scene.frame;
  store.photos = scene.photos.map((image, i) => ({ image, name: i === 0 ? 'boulevard.jpg' : 'pier.jpg' }));
  selectedPhoto = 0;
  syncPhotos();
  rebuildPanels();
  renderTray();
  redraw();
  return state;
}

async function boot() {
  try {
    await ensureCoverFonts();
    fontsReady = true;
  } catch {
    fontsReady = false;
  }
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    await runShot(shot, query, applyShotScene);
  } else {
    await loadSamples();
    redraw();
  }
}

boot();
