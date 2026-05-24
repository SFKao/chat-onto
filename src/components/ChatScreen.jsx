import { useState, useRef, useEffect } from "react";
import { closeApp } from "../hooks/useWindow";

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDateLabel(date) {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Hoy";
  const y = new Date(today); y.setDate(today.getDate() - 1);
  if (date.toDateString() === y.toDateString()) return "Ayer";
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
const COLORS = ["#7c6af7","#e85d34","#f0a500","#00c9a7","#e84393","#00aaff","#ff6b6b","#a8e063"];
function avatarColor(name = "") {
  return COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
}
function initials(name = "") {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const S = `
  /* drag-shell ocupa toda la ventana sin padding — sin borde transparente */
  .drag-shell {
    height: 100%;
    position: relative;
    cursor: grab;
  }
  .drag-shell:active { cursor: grabbing; }

  .chat-widget {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    backdrop-filter: blur(28px) saturate(1.8);
    -webkit-backdrop-filter: blur(28px) saturate(1.8);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 16px 60px rgba(0,0,0,.65), 0 0 0 1px rgba(124,106,247,.10);
  }

  /* Franjas invisibles de arrastre en los 3 bordes laterales (6px).
     Están sobre el widget pero debajo de los elementos interactivos. */
  .drag-edge {
    position: absolute;
    z-index: 10;
    cursor: grab;
  }
  .drag-edge:active { cursor: grabbing; }
  .drag-edge-top    { top: 0;    left: 6px;  right: 6px; height: 6px; }
  .drag-edge-left   { top: 0;    left: 0;    width: 6px; bottom: 0;   }
  .drag-edge-right  { top: 0;    right: 0;   width: 6px; bottom: 0;   }
  .drag-edge-bottom { bottom: 0; left: 6px;  right: 6px; height: 6px; }

  /* Zona interactiva: cancela el drag */
  .no-drag { cursor: default; }
  .no-drag:active { cursor: default; }

  /* Topbar */
  .cw-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px 0 12px;
    height: 38px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .cw-title {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; color: var(--text-muted);
    pointer-events: none;
  }
  .status-pip {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    transition: background .3s;
  }

  /* Botón esconder */
  .btn-collapse {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 7px;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text-muted); font-size: 11px; font-weight: 600; letter-spacing: .04em;
    transition: background .15s, color .15s, border-color .15s, box-shadow .15s;
  }
  .btn-collapse:hover {
    background: var(--accent); border-color: var(--accent);
    color: #fff; box-shadow: 0 0 12px var(--accent-glow);
  }

  /* Messages */
  .cw-msgs {
    flex: 1; overflow-y: auto; padding: 8px 12px;
    display: flex; flex-direction: column; gap: 1px; cursor: default;
  }
  .date-sep {
    text-align: center; font-size: 10px; color: var(--text-muted);
    margin: 8px 0 4px; display: flex; align-items: center; gap: 6px;
  }
  .date-sep::before, .date-sep::after { content: ""; flex: 1; height: 1px; background: var(--border); }

  .msg-row {
    display: flex; gap: 8px; align-items: flex-start;
    padding: 2px 4px; border-radius: 7px; transition: background .1s;
  }
  .msg-row:hover { background: var(--surface2); }
  .avatar {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .avatar-gap { width: 24px; flex-shrink: 0; }
  .msg-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .msg-meta { display: flex; align-items: baseline; gap: 5px; }
  .msg-author { font-size: 11.5px; font-weight: 600; }
  .msg-time { font-size: 9.5px; color: var(--text-muted); font-family: var(--font-mono); }
  .bubble {
    font-size: 12px; line-height: 1.5; color: var(--text);
    word-break: break-word; white-space: pre-wrap;
  }
  .msg-row.self .bubble { color: #c5bcff; }

  .empty-state {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 6px; color: var(--text-muted); cursor: default;
  }
  .empty-state svg { opacity: .2; }
  .empty-state p { font-size: 11px; text-align: center; line-height: 1.5; }

  /* Input */
  .cw-input-bar {
    padding: 6px 8px 8px; border-top: 1px solid var(--border);
    display: flex; gap: 6px; align-items: flex-end;
    flex-shrink: 0; cursor: default;
  }
  textarea.cw-input {
    flex: 1; resize: none; font-size: 12px; line-height: 1.5;
    padding: 6px 10px; border-radius: 9px;
    min-height: 32px; max-height: 80px; overflow-y: auto;
  }
  .btn-send {
    width: 32px; height: 32px; border-radius: 9px;
    background: var(--accent); display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background .15s, opacity .15s;
    box-shadow: 0 2px 10px var(--accent-glow);
  }
  .btn-send:hover:not(:disabled) { background: var(--accent-h); }
  .btn-send:disabled { opacity: .35; cursor: not-allowed; }
`;

function StatusPip({ status }) {
  const c = { connected:"var(--success)", connecting:"var(--warning)", disconnected:"var(--error)", error:"#f44" };
  return <span className="status-pip" style={{
    background: c[status] ?? "var(--text-muted)",
    boxShadow: status === "connected" ? "0 0 5px var(--success)" : "none",
  }}/>;
}
function Avatar({ name }) {
  return <div className="avatar" style={{ background: avatarColor(name) }}>{initials(name)}</div>;
}

export default function ChatScreen({ messages, status, myName, onSend, onCollapse, onDragStart }) {
  const [text, setText] = useState("");
  const bottomRef  = useRef(null);
  const textRef    = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function handleSend() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
    const el = textRef.current;
    if (el) { el.style.height = "auto"; el.focus(); }
  }
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }
  function handleInput(e) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 80) + "px";
    setText(el.value);
  }
  const stopDrag = (e) => e.stopPropagation();

  const rendered = [];
  let lastDate = null;
  messages.forEach((msg, i) => {
    const dl = formatDateLabel(msg.sentAt);
    if (dl !== lastDate) { rendered.push({ type: "date", label: dl, key: `d${i}` }); lastDate = dl; }
    const prev = messages[i - 1];
    const grouped = prev && prev.name === msg.name &&
      msg.sentAt - prev.sentAt < 5 * 60 * 1000 && formatDateLabel(prev.sentAt) === dl;
    rendered.push({ type: "msg", msg, grouped, key: msg.id });
  });

  return (
    <>
      <style>{S}</style>
      {/* El shell exterior captura el drag desde cualquier borde */}
      <div className="drag-shell" onMouseDown={onDragStart}>
        {/* Franjas de arrastre en bordes — no tapan el contenido */}
        <div className="drag-edge drag-edge-top"    onMouseDown={onDragStart}/>
        <div className="drag-edge drag-edge-left"   onMouseDown={onDragStart}/>
        <div className="drag-edge drag-edge-right"  onMouseDown={onDragStart}/>
        <div className="drag-edge drag-edge-bottom" onMouseDown={onDragStart}/>
        <div className="chat-widget">

          <div className="cw-top">
            <div className="cw-title">
              <StatusPip status={status}/>
              Chat
            </div>
            <button
              className="btn-collapse no-drag"
              onMouseDown={stopDrag}
              onClick={onCollapse}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              Esconder
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="empty-state no-drag" onMouseDown={stopDrag}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p>Sin mensajes aún.<br/>¡Di algo!</p>
            </div>
          ) : (
            <div className="cw-msgs no-drag" onMouseDown={stopDrag}>
              {rendered.map((item) =>
                item.type === "date" ? (
                  <div key={item.key} className="date-sep">{item.label}</div>
                ) : (
                  <div key={item.key} className={`msg-row ${item.msg.name === myName ? "self" : ""}`}>
                    {item.grouped ? <div className="avatar-gap"/> : <Avatar name={item.msg.name}/>}
                    <div className="msg-body">
                      {!item.grouped && (
                        <div className="msg-meta">
                          <span className="msg-author" style={{ color: avatarColor(item.msg.name) }}>
                            {item.msg.name}
                          </span>
                          <span className="msg-time">{formatTime(item.msg.sentAt)}</span>
                        </div>
                      )}
                      <div className="bubble">{item.msg.message}</div>
                    </div>
                  </div>
                )
              )}
              <div ref={bottomRef}/>
            </div>
          )}

          <div className="cw-input-bar no-drag" onMouseDown={stopDrag}>
            <textarea
              ref={textRef} className="cw-input" rows={1}
              placeholder={status === "connected" ? "Mensaje… (Enter)" : "Reconectando…"}
              value={text} onChange={handleInput} onKeyDown={handleKeyDown}
              disabled={status !== "connected"}
            />
            <button className="btn-send" onClick={handleSend}
                    disabled={status !== "connected" || !text.trim()}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}