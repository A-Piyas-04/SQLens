import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErdFullscreenPage from "./pages/ErdFullscreenPage.tsx";
import "./index.css";

const root = document.getElementById("app");
if (!root) throw new Error("Root element #app not found");

const isErdFullscreenRoute =
  window.location.pathname === "/erd" ||
  window.location.pathname === "/erd/";

createRoot(root).render(
  <StrictMode>
    {isErdFullscreenRoute ? <ErdFullscreenPage /> : <App />}
  </StrictMode>,
);
