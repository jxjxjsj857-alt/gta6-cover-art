// Neon Boulevard Cover Studio — photo store and per-panel framing state.
// Photos live only in the browser: files are read on the user's own machine
// and never uploaded anywhere.

export const MAX_PHOTOS = 6;

// One entry in the photo tray: the loaded image plus its file name.
export class PhotoStore {
  constructor() {
    this.photos = [];
  }

  get length() {
    return this.photos.length;
  }

  // Adds an image element, returns its index, or -1 when the tray is full.
  add(image, name) {
    if (this.photos.length >= MAX_PHOTOS) return -1;
    this.photos.push({ image, name: name || `photo-${this.photos.length + 1}` });
    return this.photos.length - 1;
  }

  // Loads a File object (from the picker or a drop) into the tray.
  async addFile(file) {
    if (!file || !file.type.startsWith('image/')) return -1;
    const image = await loadImage(URL.createObjectURL(file));
    return this.add(image, file.name);
  }

  // Loads a bundled sample photo (a file under app/samples/).
  async addSample(url, name) {
    const image = await loadImage(url);
    return this.add(image, name);
  }

  at(index) {
    return index == null ? null : this.photos[index] || null;
  }

  // The plain image list drawCover expects, in tray order.
  images() {
    return this.photos.map((entry) => entry.image);
  }
}

// Loads an image from a URL, resolving once it can be drawn.
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

// A fresh framing state for one panel: which photo it shows, its zoom,
// its pan offset (fractions of the panel) and whether it is flipped.
export function freshPanel(photoIndex) {
  return { photoIndex, zoom: 1, panX: 0, panY: 0, flip: false };
}

// Builds a panel list for a layout: panel i starts on photo i, wrapping
// around the tray, so a single photo fills every panel by default.
export function panelsForLayout(panelCount, photoCount) {
  const panels = [];
  for (let i = 0; i < panelCount; i++) {
    panels.push(freshPanel(photoCount > 0 ? i % photoCount : null));
  }
  return panels;
}

// Points every panel at the same photo.
export function fillAllPanels(panels, photoIndex) {
  panels.forEach((panel) => {
    panel.photoIndex = photoIndex;
  });
}
