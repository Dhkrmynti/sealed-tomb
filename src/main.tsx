import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/dela-gothic-one/latin-400.css";
import "@fontsource/schibsted-grotesk/latin-400.css";
import "@fontsource/schibsted-grotesk/latin-400-italic.css";
import "@fontsource/schibsted-grotesk/latin-600.css";
import "@fontsource/schibsted-grotesk/latin-800.css";
import "@fontsource/red-hat-mono/latin-400.css";
import "@fontsource/red-hat-mono/latin-600.css";
import "./styles/base.css";
import "./styles/tomb.css";
import { App } from "./App";

// The operator room is its own chunk: visitors never download it, and it never loads the scroll scene.
const Memex = lazy(() => import("./components/Memex").then((m) => ({ default: m.Memex })));

const isMemex = window.location.pathname.replace(/\/$/, "") === "/memex";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isMemex ? (
      <Suspense fallback={null}>
        <Memex />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
