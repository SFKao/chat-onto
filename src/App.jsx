import { useState, useEffect, useRef } from "react";
import { useChat } from "./hooks/useChat";
import { collapseWindow, expandWindow, startDragging } from "./hooks/useWindow";
import LoginScreen  from "./components/LoginScreen";
import ChatScreen   from "./components/ChatScreen";
import CollapsedTab from "./components/CollapsedTab";

export default function App() {
  const { status, messages, authError, connect, disconnect, sendMessage } = useChat();
  const [collapsed, setCollapsed] = useState(false);
  const [unread,    setUnread]    = useState(0);

  const myName       = localStorage.getItem("ws_name") || "";
  const collapsedRef = useRef(false);
  const prevLenRef   = useRef(0);

  useEffect(() => { collapsedRef.current = collapsed; }, [collapsed]);
  useEffect(() => { expandWindow(); }, []);

  useEffect(() => {
    const prev    = prevLenRef.current;
    const current = messages.length;
    if (current > prev && collapsedRef.current) {
      const newMsgs    = messages.slice(prev);
      const fromOthers = newMsgs.filter(m => m.name !== myName).length;
      if (fromOthers > 0) setUnread(n => n + fromOthers);
    }
    prevLenRef.current = current;
  }, [messages]);

  async function handleCollapse() {
    setCollapsed(true);
    await collapseWindow();
  }
  async function handleExpand() {
    setCollapsed(false);
    setUnread(0);
    await expandWindow();
  }

  // auth_failed vuelve a mostrar el login con el error
  const isConnecting = status === "connecting" || status === "authenticating";
  const showChat     = status === "connected" || status === "disconnected" || status === "error";

  if (collapsed) {
    return <CollapsedTab unread={unread} onClick={handleExpand} />;
  }

  if (!showChat) {
    return (
      <LoginScreen
        onConnect={connect}
        isConnecting={isConnecting}
        authError={authError}
        onDragStart={startDragging}
      />
    );
  }

  return (
    <ChatScreen
      messages={messages}
      status={status}
      myName={myName}
      onSend={(text) => sendMessage(myName, text)}
      onCollapse={handleCollapse}
      onDragStart={startDragging}
    />
  );
}