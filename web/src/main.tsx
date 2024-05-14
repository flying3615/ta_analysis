import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "@/index.scss";
// Need the below for OL element styles
import "ol/ol.css";
// need below for LuiMenu
import "@szhsin/react-menu/dist/index.css";

import React from "react";
import { createRoot } from "react-dom/client";

import App from "@/App.tsx";
import { patchFetch } from "@linz/lol-auth-js";

export async function renderInit() {
  const { apiGatewayBaseUrl, authzBaseUrl, basemapApiKey, oidcIssuerUri, splitKey } = await fetch(
    "/plan-generation/config/env.json",
  ).then((r) => r.json());

  window._env_ = {
    apiGatewayBaseUrl,
    authzBaseUrl,
    basemapApiKey,
    oidcIssuerUri,
    splitKey,
  };

  // patch fetch requests to add authorization header to api gateway requests
  patchFetch((url) => url.startsWith(window._env_.apiGatewayBaseUrl));

  // Add to window, so we can check in console the current build versions
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).buildDetail = __BUILDDETAIL__;
  } catch (_ex) {
    // ignore
  }
}

async function renderApp() {
  await renderInit();
  const container = document.getElementById("root");
  createRoot(container!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

renderApp();
