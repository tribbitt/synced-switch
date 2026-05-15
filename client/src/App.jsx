import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

const socket = io(SERVER_URL, { transports: ["websocket", "polling"] });

const TAP_THRESHOLD_PX = 6;

export default function App() {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [thumbTranslate, setThumbTranslate] = useState(null);
  const trackRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onState = (value) => setState(value ? 1 : 0);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("state", onState);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("state", onState);
    };
  }, []);

  const isOn = state === 1;

  const flipOptimistically = (next) => {
    setState(next);
    socket.emit("set", next);
  };

  const onPointerDown = (e) => {
    if (state === null) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const rect = track.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      rect,
      startState: state,
      moved: false,
      fraction: state === 1 ? 1 : 0,
    };
    setDragging(true);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const deltaX = e.clientX - drag.startX;
    if (Math.abs(deltaX) > TAP_THRESHOLD_PX) drag.moved = true;
    const rect = drag.rect;
    const f = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    drag.fraction = f;
    const maxTravel = rect.width - rect.height;
    setThumbTranslate(f * maxTravel);
  };

  const endDrag = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setDragging(false);
    setThumbTranslate(null);

    if (!drag.moved) {
      flipOptimistically(drag.startState === 1 ? 0 : 1);
      return;
    }
    const next = drag.fraction >= 0.5 ? 1 : 0;
    if (next !== drag.startState) flipOptimistically(next);
  };

  const onKeyDown = (e) => {
    if (state === null) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flipOptimistically(isOn ? 0 : 1);
    }
  };

  const label = state === null ? "…" : isOn ? "ON (1)" : "OFF (0)";
  const disabled = state === null;

  return (
    <div className={`app ${isOn ? "on" : "off"}`}>
      <header className="header">
        <h1>Shared Switch</h1>
        <span className={`status ${connected ? "ok" : "bad"}`}>
          {connected ? "connected" : "disconnected"}
        </span>
      </header>

      <main className="main">
        <div
          role="switch"
          tabIndex={disabled ? -1 : 0}
          aria-checked={isOn}
          aria-disabled={disabled}
          aria-label="Shared switch — tap or swipe to toggle"
          className={`switch ${isOn ? "switch--on" : "switch--off"} ${
            dragging ? "switch--dragging" : ""
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        >
          <span ref={trackRef} className="switch__track">
            <span
              className="switch__thumb"
              style={
                thumbTranslate !== null
                  ? { transform: `translateX(${thumbTranslate}px)` }
                  : undefined
              }
            />
          </span>
          <span className="switch__label">{label}</span>
        </div>

        <p className="hint">
          Tap or swipe the thumb to flip. State is stored on the server and
          synced live across all connected devices.
        </p>
      </main>
    </div>
  );
}
