import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "@/index.scss";
// Need the below for OL element styles
import "ol/ol.css";
// need below for LuiMenu
import "@szhsin/react-menu/dist/index.css";

import React from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";
import { renderInit } from "@/main";
const { worker } = await import("./mocks/mockBrowser");

async function renderApp() {
  await renderInit();
  // once the Service Worker is up and ready to intercept requests.
  await worker.start({
    serviceWorker: {
      // default MSW load from root `/` so changing url
      url: `/plan-generation/mockServiceWorker.js`,
    },
    // disable warning for unhandled request other than `plan-generation/v1/`
    onUnhandledRequest(req, print) {
      if (req.url.startsWith("/plan-generation/v1/")) {
        print.warning();
      } else return;
    },
  });
  const container = document.getElementById("root");
  createRoot(container!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void renderApp();
