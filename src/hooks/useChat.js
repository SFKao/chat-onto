/**
 * Protocolo WebSocket
 * ─────────────────────────────────────────────────────────────────
 * Cliente → Servidor:
 *   { "type": "auth",    "name": "pepito", "password": "secret" }
 *   { "type": "message", "name": "pepito", "message": "hola!" }
 *
 * Servidor → Cliente:
 *   { "type": "auth_ok" }
 *   { "type": "auth_fail", "reason": "Contraseña incorrecta." }
 *   { "type": "message", "name": "pepito", "message": "hola!" }
 *   { "name": "pepito", "message": "hola!" }  ← sin type (retrocompat)
 */

import { useState, useRef, useEffect, useCallback } from "react";

const RECONNECT_DELAY_MS = 3000;
const MAX_MESSAGES = 500;

const log  = (...a) => console.log ("[useChat]", ...a);
const warn = (...a) => console.warn("[useChat]", ...a);

export function useChat() {
  const wsRef        = useRef(null);
  const reconnectRef = useRef(null);
  const savedRef     = useRef(null);

  const [status,    setStatus]    = useState("idle");
  const [messages,  setMessages]  = useState([]);
  const [authError, setAuthError] = useState("");

  const appendMessage = useCallback((name, message) => {
    log("appendMessage →", name, message);
    setMessages(prev => [
      ...prev.slice(-MAX_MESSAGES + 1),
      { id: `${Date.now()}-${Math.random()}`, name, message, sentAt: new Date() },
    ]);
  }, []);

  const connect = useCallback((url, name, password) => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    clearTimeout(reconnectRef.current);

    savedRef.current = { url, name, password };
    setStatus("connecting");
    setAuthError("");

    log("Connecting to", url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      log("WS open — sending auth");
      setStatus("authenticating");
      ws.send(JSON.stringify({ type: "auth", name, password }));
    };

    ws.onmessage = (e) => {
      log("Raw frame received:", e.data);

      let data;
      try { data = JSON.parse(e.data); }
      catch { warn("Failed to parse frame:", e.data); return; }

      // Normalizar: si no hay type pero hay name+message, tratarlo como mensaje de chat
      const type = data.type ?? (data.name && data.message ? "message" : "unknown");
      log("Frame type:", type, "| data:", data);

      switch (type) {
        case "auth_ok":
          log("Auth OK");
          setStatus("connected");
          setAuthError("");
          break;

        case "auth_fail":
          warn("Auth FAILED:", data.reason);
          setAuthError(data.reason ?? "Autenticación fallida.");
          setStatus("auth_failed");
          savedRef.current = null;
          ws.close();
          break;

        case "message":
          if (data.name && data.message) {
            appendMessage(data.name, data.message);
          } else {
            warn("Message frame missing name/message:", data);
          }
          break;

        default:
          warn("Unknown frame type:", type, data);
          break;
      }
    };

    ws.onerror = (e) => {
      warn("WS error:", e);
      setStatus("error");
    };

    ws.onclose = (e) => {
      log("WS closed — code:", e.code, "reason:", e.reason);
      if (savedRef.current) {
        setStatus("disconnected");
        reconnectRef.current = setTimeout(() => {
          const { url: u, name: n, password: p } = savedRef.current;
          connect(u, n, p);
        }, RECONNECT_DELAY_MS);
      }
    };
  }, [appendMessage]);

  const disconnect = useCallback(() => {
    savedRef.current = null;
    clearTimeout(reconnectRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    setStatus("idle");
    setAuthError("");
    setMessages([]);
  }, []);

  const sendMessage = useCallback((name, text) => {
    if (!text.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
    log("Sending message:", text);
    wsRef.current.send(JSON.stringify({ type: "message", name, message: text.trim() }));
    // Optimistic: propio mensaje se muestra de inmediato
    appendMessage(name, text.trim());
  }, [appendMessage]);

  useEffect(() => () => {
    clearTimeout(reconnectRef.current);
    wsRef.current?.close();
  }, []);

  return { status, messages, authError, connect, disconnect, sendMessage };
}