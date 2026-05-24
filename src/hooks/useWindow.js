/**
 * useWindow — tamaño, posición y memoria de posición.
 *
 * Guardamos y restauramos en píxeles FÍSICOS (PhysicalPosition/PhysicalSize)
 * para evitar cualquier drift por conversión lógico↔físico en pantallas HiDPI.
 */

let _win = null;

async function getWin() {
  if (_win) return _win;
  try {
    const { appWindow } = await import("@tauri-apps/api/window");
    _win = appWindow;
  } catch { _win = null; }
  return _win;
}

// Tamaños en píxeles LÓGICOS (el sistema operativo los escala)
export const SIZES = {
  collapsed: { w: 36,  h: 80  },
  expanded:  { w: 360, h: 280 },
};

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadPhys(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function savePhys(key, x, y) {
  localStorage.setItem(key, JSON.stringify({ x: Math.round(x), y: Math.round(y) }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getScaleFactor(win) {
  try { return await win.scaleFactor(); } catch { return 1; }
}

function clampPhys(x, y, wLogical, hLogical, scale) {
  // screen.availWidth es lógico; lo convertimos a físico para comparar
  const sw = Math.round(window.screen.availWidth  * scale);
  const sh = Math.round(window.screen.availHeight * scale);
  const wPhys = Math.round(wLogical * scale);
  const hPhys = Math.round(hLogical * scale);
  return {
    x: Math.max(0, Math.min(x, sw - wPhys)),
    y: Math.max(0, Math.min(y, sh - hPhys)),
  };
}

async function defaultExpandedPhys(win, scale) {
  const sw = Math.round(window.screen.availWidth  * scale);
  const sh = Math.round(window.screen.availHeight * scale);
  const wPhys = Math.round(SIZES.expanded.w * scale);
  const hPhys = Math.round(SIZES.expanded.h * scale);
  return clampPhys(sw - wPhys - Math.round(12 * scale), Math.round(sh / 2 - hPhys / 2), SIZES.expanded.w, SIZES.expanded.h, scale);
}

async function defaultCollapsedPhys(win, scale) {
  const sw = Math.round(window.screen.availWidth  * scale);
  const sh = Math.round(window.screen.availHeight * scale);
  const wPhys = Math.round(SIZES.collapsed.w * scale);
  const hPhys = Math.round(SIZES.collapsed.h * scale);
  return clampPhys(sw - wPhys, Math.round(sh / 2 - hPhys / 2), SIZES.collapsed.w, SIZES.collapsed.h, scale);
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function expandWindow() {
  const win = await getWin();
  if (!win) return;
  const { PhysicalSize, PhysicalPosition, LogicalSize } = await import("@tauri-apps/api/window");

  const scale = await getScaleFactor(win);

  // Guardar posición actual del tab (física, tal cual)
  try {
    const phys = await win.outerPosition();
    savePhys("tab_pos", phys.x, phys.y);
  } catch { /* ignorar */ }

  // Restaurar posición guardada del chat o calcular default
  let saved = loadPhys("chat_pos") ?? await defaultExpandedPhys(win, scale);
  const safe = clampPhys(saved.x, saved.y, SIZES.expanded.w, SIZES.expanded.h, scale);

  // Tamaño en lógico (Tauri lo convierte internamente), posición en físico
  await win.setSize(new LogicalSize(SIZES.expanded.w, SIZES.expanded.h));
  await win.setPosition(new PhysicalPosition(safe.x, safe.y));
}

export async function collapseWindow() {
  const win = await getWin();
  if (!win) return;
  const { PhysicalSize, PhysicalPosition, LogicalSize } = await import("@tauri-apps/api/window");

  const scale = await getScaleFactor(win);

  // Guardar posición actual del chat (física, tal cual)
  try {
    const phys = await win.outerPosition();
    savePhys("chat_pos", phys.x, phys.y);
  } catch { /* ignorar */ }

  // Restaurar posición del tab o calcular default
  let saved = loadPhys("tab_pos") ?? await defaultCollapsedPhys(win, scale);
  const safe = clampPhys(saved.x, saved.y, SIZES.collapsed.w, SIZES.collapsed.h, scale);

  await win.setSize(new LogicalSize(SIZES.collapsed.w, SIZES.collapsed.h));
  await win.setPosition(new PhysicalPosition(safe.x, safe.y));
}

export async function saveTabPosition() {
  const win = await getWin();
  if (!win) return;
  try {
    const phys = await win.outerPosition();
    savePhys("tab_pos", phys.x, phys.y);
  } catch { /* ignorar */ }
}

export async function closeApp() {
  const win = await getWin();
  if (win) await win.close();
}

export async function startDragging() {
  const win = await getWin();
  if (win) await win.startDragging();
}