# Shared Switch

A full-stack toggle whose state lives on the server and syncs live to every
connected client over WebSockets.

- **Server:** Node.js + Express + Socket.IO (`/server`)
- **Client:** Vite + React + socket.io-client (`/client`)

## Run it

In two terminals:

```bash
# 1) Backend (port 3001)
cd server
npm install
npm run dev

# 2) Frontend (port 5173, accessible from your LAN)
cd client
npm install
npm run dev
```

Then open `http://localhost:5173` on as many devices/tabs as you like and flip
the switch — every other client updates instantly.

### Mobile

The Vite dev server is started with `--host`, so on your phone (same Wi-Fi)
visit `http://<your-laptop-ip>:5173`. The layout is responsive and the toggle
is sized for touch. On the switch you can either **tap** to flip or **swipe
the thumb** across.

If your phone hits the page over your LAN IP, the client automatically points
its socket connection at `http://<that-same-host>:3001`. To override, set
`VITE_SERVER_URL` before running `npm run dev`.

## Requirements

Node.js 18+
