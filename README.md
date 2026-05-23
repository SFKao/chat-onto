# Chat App — Tauri + React

Cliente desktop de chat en tiempo real via WebSocket.

## Protocolo WebSocket

Todos los mensajes son JSON con dos campos:

```json
{ "name": "pepito", "message": "hola a todos!" }
```

El cliente añade la hora localmente al recibir el mensaje.

## Requisitos

- [Node.js](https://nodejs.org) ≥ 18
- [Rust](https://rustup.rs) (para Tauri)
- Dependencias del sistema para Tauri: https://tauri.app/v1/guides/getting-started/prerequisites

## Desarrollo

```bash
npm install
npm run tauri dev
```

## Build (ejecutable final)

```bash
npm run tauri build
```

El instalador aparece en `src-tauri/target/release/bundle/`.

## Estructura

```
chat-app/
├── src/
│   ├── hooks/
│   │   └── useChat.js        # Toda la lógica WebSocket
│   ├── components/
│   │   ├── LoginScreen.jsx   # Pantalla de conexión
│   │   └── ChatScreen.jsx    # Interfaz de chat
│   ├── App.jsx               # Orquestador login ↔ chat
│   ├── main.jsx
│   └── index.css
├── src-tauri/                # Lado Rust (Tauri)
│   ├── src/main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── vite.config.js
└── package.json
```

## Reconexión automática

Si el servidor cae, el cliente reintenta la conexión cada 3 segundos automáticamente.
