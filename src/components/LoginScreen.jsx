import { useState } from "react";

const S = `
  .login-wrap {
    height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg);
    backdrop-filter: blur(24px) saturate(1.6);
    -webkit-backdrop-filter: blur(24px) saturate(1.6);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .login-card {
    padding: 28px 24px; width: 100%;
    display: flex; flex-direction: column; gap: 20px;
  }
  .login-logo {
    display: flex; align-items: center; gap: 10px;
    font-size: 18px; font-weight: 700; letter-spacing: -.4px;
  }
  .login-sub { font-size: 12px; color: var(--text-muted); margin-top: -12px; }
  .login-form { display: flex; flex-direction: column; gap: 12px; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field label {
    font-size: 11px; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: .07em;
  }
  .login-error {
    font-size: 11px; color: var(--error);
    background: rgba(232,93,52,.1); border: 1px solid rgba(232,93,52,.25);
    border-radius: 7px; padding: 6px 10px;
  }
  .btn-connect {
    margin-top: 4px; background: var(--accent); color: #fff;
    font-weight: 600; font-size: 13px; padding: 9px 0;
    border-radius: var(--radius); transition: background .15s, opacity .15s;
    width: 100%; box-shadow: 0 4px 18px var(--accent-glow);
  }
  .btn-connect:hover:not(:disabled) { background: var(--accent-h); }
  .btn-connect:disabled { opacity: .5; cursor: not-allowed; }
  .drag-handle {
    height: 24px; display: flex; align-items: center; justify-content: center;
    cursor: grab; color: var(--text-muted); opacity: .4;
  }
  .reset-btn {
    font-size: 10px; color: var(--text-muted); text-decoration: underline;
    background: none; border: none; cursor: pointer; text-align: left; padding: 0;
  }
`;

export default function LoginScreen({ onConnect, isConnecting, authError, onDragStart }) {
  const [url,      setUrl]      = useState(() => localStorage.getItem("ws_url")  || "ws://localhost:8080/ws");
  const [name,     setName]     = useState(() => localStorage.getItem("ws_name") || "");
  const [password, setPassword] = useState("hacienda");
  const [error,    setError]    = useState("");

  // Mostrar error de auth si viene del hook
  const displayError = authError || error;

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim())     { setError("Ingresa tu nombre.");           return; }
    if (!url.trim())      { setError("Ingresa la URL del servidor."); return; }
    if (!password.trim()) { setError("Ingresa la contraseña.");       return; }
    setError("");
    localStorage.setItem("ws_url",  url.trim());
    localStorage.setItem("ws_name", name.trim());
    onConnect(url.trim(), name.trim(), password.trim());
  }

  return (
    <>
      <style>{S}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div className="drag-handle" onMouseDown={onDragStart}>
            <svg width="28" height="3" viewBox="0 0 28 3">
              <rect width="28" height="3" rx="1.5" fill="currentColor"/>
            </svg>
          </div>

          <div className="login-logo">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect width="26" height="26" rx="7" fill="var(--accent)" opacity=".18"/>
              <path d="M5 9h16M5 13h11M5 17h13" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Chat
          </div>
          <p className="login-sub">Conéctate a tu servidor WebSocket</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Servidor</label>
              <input type="text" value={url} spellCheck={false}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                placeholder="ws://localhost:8080/ws" disabled={isConnecting}
              />
            </div>
            <div className="field">
              <label>Tu nombre</label>
              <input type="text" value={name} maxLength={32} autoFocus
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Ej: Giacomino, Guardiano delle galassie e dell'iperspazio" disabled={isConnecting}
              />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input type="password" value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••" disabled={isConnecting}
              />
            </div>

            {displayError && <p className="login-error">⚠ {displayError}</p>}

            <button
              className="reset-btn"
              type="button"
              onClick={() => { localStorage.removeItem("chat_pos"); localStorage.removeItem("tab_pos"); }}
            >
              Resetear posición de ventana
            </button>

            <button type="submit" className="btn-connect" disabled={isConnecting}>
              {isConnecting ? "Conectando…" : "Conectar →"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}