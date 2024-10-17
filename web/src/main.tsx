import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "@/index.scss";
// Need the below for OL element styles
import "ol/ol.css";
// need below for LuiMenu
import "@szhsin/react-menu/dist/index.css";

import { patchFetch } from "@linz/lol-auth-js";
import React from "react";
import { createRoot } from "react-dom/client";

import App from "@/App.tsx";

export async function renderInit() {
  const {
    apiGatewayBaseUrl,
    authzBaseUrl,
    basemapApiKey,
    oidcIssuerUri,
    splitKey,
    surveyBaseUrl,
    secureFileUploadBaseUrl,
  } = await fetch("/plan-generation/config/env.json").then((r) => r.json());

  window._env_ = {
    apiGatewayBaseUrl,
    authzBaseUrl,
    basemapApiKey,
    oidcIssuerUri,
    splitKey,
    surveyBaseUrl,
    secureFileUploadBaseUrl: secureFileUploadBaseUrl ?? apiGatewayBaseUrl,
  };

  // patch fetch requests to add authorization header to api gateway requests
  patchFetch((url) => url.startsWith(window._env_.apiGatewayBaseUrl) || url.startsWith(window._env_.surveyBaseUrl));

  // Add to window, so we can check in console the current build versions
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).buildDetail = __BUILDDETAIL__;
  } catch (_ex) {
    // ignore
  }
}

async function renderApp() {
  const mode = import.meta.env.MODE.toLowerCase();
  if (mode === "mock") {
    // This should not happen, possibly a bug in vite that it serves the
    // env before the env.mock, causing us to rerender different trees.
    console.warn("main.tsx loaded instead of mainMocked.tsx despite being in mock mode");
    return;
  }

  await renderInit();
  const container = document.getElementById("root");
  createRoot(container!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void renderApp();
