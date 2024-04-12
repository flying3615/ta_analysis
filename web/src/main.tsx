import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "@/index.scss";

import React from "react";
import ReactDOM from "react-dom/client";

import App from "@/App.tsx";

async function render() {
  const { splitKey, oidcIssuer } = await fetch("/plan-generation/config/env.json").then((r) => r.json());

  window._env_ = {
    splitKey,
    oidcIssuer,
  };

  // Add to window, so we can check in console the current build versions
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).buildDetail = __BUILDDETAIL__;
  } catch (_ex) {
    // ignore
  }

  const container = document.getElementById("root");
  ReactDOM.createRoot(container!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

await render();
