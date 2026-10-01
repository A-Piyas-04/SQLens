import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.tsx";
import ErdFullscreenPage from "./pages/ErdFullscreenPage.tsx";
import Sql50PracticePage from "./pages/Sql50PracticePage.tsx";
import "./index.css";

const root = document.getElementById("app");
if (!root) throw new Error("Root element #app not found");

const path = window.location.pathname.replace(/\/$/, "") || "/";

const isErdFullscreenRoute = path === "/erd";
const isSql50Route = path === "/practice/sql50";

createRoot(root).render(
  <StrictMode>
    <Toaster position="bottom-right" />
    {isErdFullscreenRoute ? (
      <ErdFullscreenPage />
    ) : isSql50Route ? (
      <Sql50PracticePage />
    ) : (
      <App />
    )}
  </StrictMode>,
);
