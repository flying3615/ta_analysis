import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "./index.scss";

import { initializeEnv } from "./utils/env-utils";

async function render() {
  await initializeEnv();
  const container = document.getElementById("root");
  ReactDOM.createRoot(container!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

await render();
