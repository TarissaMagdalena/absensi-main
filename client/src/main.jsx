import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./styles.css"; // ⬅ WAJIB ADA
import "./styles/global.css";
import "./styles/dashboard.css";
import "./styles/table.css";
import "./styles/modal.css";
import "./styles/profile.css";
import "./styles/responsive.css";
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
