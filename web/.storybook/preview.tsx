import { Preview } from "@storybook/react";
import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "@/index.scss";
import "@szhsin/react-menu/dist/index.css";
import "@linzjs/step-ag-grid/dist/GridTheme.scss";
import "@linzjs/step-ag-grid/dist/index.css";
import "../src/fonts";

import { mswDecorator, mswInitialize } from "./mswDecorator";
import { handlers } from "../src/mocks/mockHandlers";

mswInitialize({
  onUnhandledRequest: (req, print) => {
    if (req.url.startsWith("/plan-generation/v1/")) {
      print.warning();
    } else return;
    return;
  },
});

const preview: Preview = {
  decorators: [mswDecorator],
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: {
        standard: {
          name: "1280x1024",
          styles: {
            width: "1280px",
            height: "800px",
          },
        },
      },
      defaultViewport: "standard",
    },
    msw: {
      handlers: [...handlers],
    },
    loaders: [
      async () => ({
        fonts: fontLoader,
      }),
    ],
  },
};

// Use the document.fonts API to check if fonts have loaded
// https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts API to
const fontLoader = async () => ({
  fonts: await document.fonts.ready,
});

export default preview;
