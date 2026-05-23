import { startDragging, saveTabPosition } from "../hooks/useWindow";

const S = `
  html, body, #root { width: 36px; height: 80px; overflow: hidden; }

  .tab-root {
    width: 36px; height: 80px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 6px;
    background: var(--bg);
    backdrop-filter: blur(24px) saturate(1.6);
    -webkit-backdrop-filter: blur(24px) saturate(1.6);
    border: 1px solid var(--border);
    border-right: none;
    border-radius: 10px 0 0 10px;
    cursor: grab; position: relative; transition: background .15s;
  }
  .tab-root:hover { background: rgba(30,33,55,0.96); }
  .tab-root:active { cursor: grabbing; }

  .tab-icon {
    color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    filter: drop-shadow(0 0 5px var(--accent-glow));
    pointer-events: none; transition: transform .2s;
  }
  .tab-root:hover .tab-icon { transform: scale(1.15); }

  .tab-badge {
    position: absolute; top: 7px; right: 4px;
    min-width: 15px; height: 15px;
    background: var(--accent); color: #fff;
    border-radius: 99px; font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; padding: 0 3px;
    box-shadow: 0 0 8px var(--accent-glow);
    animation: pop .2s ease; pointer-events: none;
  }
  @keyframes pop {
    0%   { transform: scale(0.4); }
    70%  { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`;

export default function CollapsedTab({ unread, onClick }) {
  function handleMouseDown(e) {
    const startX = e.screenX;
    const startY = e.screenY;
    let dragStarted = false;

    function onMove(ev) {
      // Iniciar drag nativo solo si el ratón se ha movido más de 4px
      if (!dragStarted && (Math.abs(ev.screenX - startX) > 4 || Math.abs(ev.screenY - startY) > 4)) {
        dragStarted = true;
        window.removeEventListener("mousemove", onMove);
        startDragging().then(() => saveTabPosition());
      }
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", () => {
      window.removeEventListener("mousemove", onMove);
    }, { once: true });
  }

  return (
    <>
      <style>{S}</style>
      <div
        className="tab-root"
        onMouseDown={handleMouseDown}
        onClick={onClick}
      >
        {unread > 0 && (
          <span className="tab-badge">{unread > 99 ? "99+" : unread}</span>
        )}
        <div className="tab-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
      </div>
    </>
  );
}