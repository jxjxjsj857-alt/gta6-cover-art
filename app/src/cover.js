// Neon Boulevard Cover Studio — cover drawing.
// drawCover(canvas, state) paints one poster-style cover at the canvas's own
// resolution: a multi-panel photo layout, a colour grade, grain and vignette,
// a white frame, and bold lettering (Anton caps with a sunset gradient fill,
// Pacifico neon script, a Bebas Neue badge ribbon). All lettering is original
// and uses only the OFL fonts shipped under app/fonts/.

export const GRADES = {
  sunset: { name: 'Vice Sunset', sky: ['#ff5e8a', '#ff9a3d', '#ffd23d'], wash: 'rgba(255, 94, 138, 0.16)', deep: 'rgba(20, 8, 48, 0.28)', filter: 'saturate(1.25) contrast(1.08)' },
  neon: { name: 'Neon Night', sky: ['#ff2fb3', '#7b2fff', '#00e5ff'], wash: 'rgba(123, 47, 255, 0.20)', deep: 'rgba(4, 4, 32, 0.38)', filter: 'saturate(1.45) contrast(1.12)' },
  golden: { name: 'Golden Hour', sky: ['#ff7a1a', '#ffb347', '#ffe9a8'], wash: 'rgba(255, 150, 40, 0.18)', deep: 'rgba(48, 20, 0, 0.22)', filter: 'saturate(1.3) contrast(1.05) sepia(0.18)' },
  noir: { name: 'Noir', sky: ['#f5f5f5', '#c9c9c9', '#8a8a8a'], wash: 'rgba(255, 255, 255, 0.05)', deep: 'rgba(0, 0, 0, 0.30)', filter: 'grayscale(1) contrast(1.35) brightness(1.05)' },
};

export const LAYOUTS = {
  grid9: { name: '9-Panel Grid', panels: 6 },
  hero3: { name: 'Hero + 3', panels: 4 },
  grid4: { name: '4-Panel Grid', panels: 4 },
  full: { name: 'Full Bleed', panels: 1 },
  collage: { name: 'Tilted Collage', panels: 5 },
};

// Panel rectangles as fractions of the cover [x, y, w, h, rotationDegrees].
export function layoutPanels(layout, w, h) {
  const g = 0.018; // gutter, as a fraction of the short side
  const gap = Math.min(w, h) * g;
  switch (layout) {
    case 'hero3': {
      const heroW = w * 0.66 - gap / 2;
      const sideX = heroW + gap;
      const sideW = w - sideX;
      const sh = (h - gap * 2) / 3;
      return [
        [0, 0, heroW, h, 0],
        [sideX, 0, sideW, sh, 0],
        [sideX, sh + gap, sideW, sh, 0],
        [sideX, (sh + gap) * 2, sideW, sh, 0],
      ];
    }
    case 'grid4': {
      const cw = (w - gap) / 2;
      const ch = (h - gap) / 2;
      return [
        [0, 0, cw, ch, 0],
        [cw + gap, 0, cw, ch, 0],
        [0, ch + gap, cw, ch, 0],
        [cw + gap, ch + gap, cw, ch, 0],
      ];
    }
    case 'full':
      return [[0, 0, w, h, 0]];
    case 'collage': {
      const cw = w * 0.52;
      const ch = h * 0.52;
      return [
        [w * 0.04, h * 0.05, cw, ch, -4],
        [w * 0.44, h * 0.02, cw, ch, 3],
        [w * 0.08, h * 0.46, cw * 0.9, ch * 0.9, 3],
        [w * 0.48, h * 0.44, cw, ch, -3],
        [w * 0.28, h * 0.24, cw * 0.62, ch * 0.62, -1],
      ];
    }
    case 'grid9':
    default: {
      const cw = (w - gap * 2) / 3;
      const ch = (h - gap * 2) / 3;
      const heroW = cw * 2 + gap;
      const heroH = ch * 2 + gap;
      return [
        [0, 0, heroW, heroH, 0], // hero cell, top-left, spans 2 x 2
        [heroW + gap, 0, cw, ch, 0],
        [heroW + gap, ch + gap, cw, ch, 0],
        [0, heroH + gap, cw, ch, 0],
        [cw + gap, heroH + gap, cw, ch, 0],
        [heroW + gap, heroH + gap, cw, ch, 0],
      ];
    }
  }
}

// Draws one photo into a panel rect, honouring pan (fractions of the panel)
// and zoom, with an optional horizontal flip.
export function drawPanelPhoto(ctx, photo, rect, panel, grade) {
  const [x, y, pw, ph, rot] = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  if (rot) {
    ctx.translate(x + pw / 2, y + ph / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(-pw / 2, -ph / 2);
  } else {
    ctx.translate(x, y);
  }
  if (!photo) {
    const grad = ctx.createLinearGradient(0, 0, pw, ph);
    grad.addColorStop(0, '#3a1c5e');
    grad.addColorStop(1, '#12081f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, pw, ph);
    ctx.restore();
    return;
  }
  const zoom = panel.zoom || 1;
  const base = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight) * zoom;
  const dw = photo.naturalWidth * base;
  const dh = photo.naturalHeight * base;
  const dx = (pw - dw) / 2 + (panel.panX || 0) * pw;
  const dy = (ph - dh) / 2 + (panel.panY || 0) * ph;
  ctx.filter = grade.filter;
  if (panel.flip) {
    ctx.translate(pw, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

// Paints a deterministic film-grain speckle over the whole cover.
export function drawGrain(ctx, w, h, seed) {
  let s = seed || 12345;
  const next = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  ctx.save();
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < Math.floor((w * h) / 900); i++) {
    const v = Math.floor(next() * 255);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(next() * w, next() * h, 1.6, 1.6);
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= Math.max(2, Math.floor(size * 0.04));
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// The caption band: sunset-gradient Anton title, Pacifico neon subtitle.
export function drawLettering(ctx, w, h, state, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const bandH = h * 0.24;
  const bandY = h - bandH;
  const grad = ctx.createLinearGradient(0, bandY, 0, h);
  grad.addColorStop(0, 'rgba(10, 4, 24, 0)');
  grad.addColorStop(0.45, 'rgba(10, 4, 24, 0.55)');
  grad.addColorStop(1, 'rgba(10, 4, 24, 0.85)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, bandY, w, h - bandY);

  if (title) {
    const size = fitFont(ctx, title, w * 0.92, h * 0.115, 'Anton, sans-serif', 400);
    const ty = h - h * 0.085;
    const fill = ctx.createLinearGradient(0, ty - size, 0, ty);
    fill.addColorStop(0, grade.sky[0]);
    fill.addColorStop(0.55, grade.sky[1]);
    fill.addColorStop(1, grade.sky[2]);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = '#0a0418';
    ctx.strokeText(title, w / 2, ty);
    ctx.fillStyle = fill;
    ctx.fillText(title, w / 2, ty);
    ctx.restore();
  }
  if (subtitle) {
    const size = fitFont(ctx, subtitle, w * 0.7, h * 0.052, 'Pacifico, cursive', 400);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = grade.sky[0];
    ctx.shadowBlur = h * 0.02;
    ctx.fillStyle = '#ffffff';
    ctx.font = `400 ${size}px Pacifico, cursive`;
    ctx.fillText(subtitle, w / 2, h - h * 0.05);
    ctx.restore();
  }
}

// Small ribbon badge, top-left, with invented (never trademarked) wording.
export function drawBadge(ctx, w, h, badge) {
  const text = (badge || '').trim().toUpperCase();
  if (!text) return;
  const size = Math.max(14, h * 0.026);
  ctx.save();
  ctx.font = `400 ${size}px "Bebas Neue", sans-serif`;
  const tw = ctx.measureText(text).width;
  const padX = size * 0.9;
  const bw = tw + padX * 2;
  const bh = size * 1.9;
  const bx = w * 0.03;
  const by = h * 0.03;
  ctx.fillStyle = 'rgba(10, 4, 24, 0.72)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#ff2fb3';
  ctx.fillRect(bx, by, size * 0.22, bh);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + padX + size * 0.22, by + bh / 2 + size * 0.06);
  ctx.restore();
}

export function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Main entry: paints the whole cover onto `canvas` at its own pixel size.
// state: { layout, photos, panels, title, subtitle, badge, grade, grain,
//          vignette, frame }
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);

  const rects = layoutPanels(state.layout || 'grid9', w, h);
  rects.forEach((rect, i) => {
    const panel = (state.panels && state.panels[i]) || { photoIndex: i, zoom: 1, panX: 0, panY: 0, flip: false };
    const photo = state.photos && panel.photoIndex != null ? state.photos[panel.photoIndex] : null;
    drawPanelPhoto(ctx, photo, rect, panel, grade);
  });

  // Grade wash: a warm sky tint from the top, deep shadow from the foot.
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  sky.addColorStop(0, grade.wash);
  sky.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = grade.deep;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);

  if (state.vignette) drawVignette(ctx, w, h);
  if (state.grain) drawGrain(ctx, w, h, 20261119);
  drawLettering(ctx, w, h, state, grade);
  drawBadge(ctx, w, h, state.badge);
  if (state.frame) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(4, Math.min(w, h) * 0.012);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
    ctx.restore();
  }
}

// Waits until the shipped OFL fonts are usable for canvas text.
export async function ensureCoverFonts() {
  await Promise.all([
    document.fonts.load('400 80px Anton'),
    document.fonts.load('400 40px Pacifico'),
    document.fonts.load('400 30px "Bebas Neue"'),
  ]);
  await document.fonts.ready;
}
