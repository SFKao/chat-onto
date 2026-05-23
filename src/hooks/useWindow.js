/**
 * useWindow — tamaño, posición y memoria de posición.
 *
 * IMPORTANTE: Tauri v1 outerPosition() devuelve píxeles FÍSICOS.
 * Nosotros trabajamos siempre en píxeles LÓGICOS (CSS) y dejamos que
 * LogicalPosition haga la conversión. Para guardar/leer usamos coordenadas
 * lógicas calculadas desde window.screen (que ya es lógico en el navegador).
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

export const SIZES = {
  collapsed: { w: 36, h: 80  },
  expanded:  { w: 360, h: 280 },
};

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadPos(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function savePos(key, x, y) {
  localStorage.setItem(key, JSON.stringify({ x: Math.round(x), y: Math.round(y) }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Clamp position so the window is always fully visible.
 * Usa screen.availWidth/availHeight (lógicos, incluye la barra de tareas).
 */
function clamp(x, y, w, h) {
  const sw = window.screen.availWidth;
  const sh = window.screen.availHeight;
  return {
    x: Math.max(0, Math.min(x, sw - w)),
    y: Math.max(0, Math.min(y, sh - h)),
  };
}

function defaultExpandedPos() {
  const { x, y } = clamp(
    window.screen.availWidth  - SIZES.expanded.w - 12,
    Math.round(window.screen.availHeight / 2 - SIZES.expanded.h / 2),
    SIZES.expanded.w, SIZES.expanded.h,
  );
  return { x, y };
}

function defaultCollapsedPos() {
  const { x, y } = clamp(
    window.screen.availWidth  - SIZES.collapsed.w,
    Math.round(window.screen.availHeight / 2 - SIZES.collapsed.h / 2),
    SIZES.collapsed.w, SIZES.collapsed.h,
  );
  return { x, y };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function expandWindow() {
  const win = await getWin();
  if (!win) return;
  const { LogicalSize, LogicalPosition } = await import("@tauri-apps/api/window");

  let saved = loadPos("chat_pos") ?? defaultExpandedPos();
  // Siempre revalidar que sigue dentro de pantalla (puede haber cambiado resolución)
  const safe = clamp(saved.x, saved.y, SIZES.expanded.w, SIZES.expanded.h);

  await win.setSize(new LogicalSize(SIZES.expanded.w, SIZES.expanded.h));
  await win.setPosition(new LogicalPosition(safe.x, safe.y));
}

export async function collapseWindow() {
  const win = await getWin();
  if (!win) return;
  const { LogicalSize, LogicalPosition } = await import("@tauri-apps/api/window");

  // Guardar posición actual del chat leyendo el factor de escala
  try {
    const factor = await win.scaleFactor();
    const phys   = await win.outerPosition();
    savePos("chat_pos", phys.x / factor, phys.y / factor);
  } catch { /* si falla, no importa, usaremos el último guardado */ }

  let saved = loadPos("tab_pos") ?? defaultCollapsedPos();
  const safe = clamp(saved.x, saved.y, SIZES.collapsed.w, SIZES.collapsed.h);

  await win.setSize(new LogicalSize(SIZES.collapsed.w, SIZES.collapsed.h));
  await win.setPosition(new LogicalPosition(safe.x, safe.y));
}

export async function saveTabPosition() {
  const win = await getWin();
  if (!win) return;
  try {
    const factor = await win.scaleFactor();
    const phys   = await win.outerPosition();
    savePos("tab_pos", phys.x / factor, phys.y / factor);
  } catch { /* ignorar */ }
}

export async function startDragging() {
  const win = await getWin();
  if (win) await win.startDragging();
}