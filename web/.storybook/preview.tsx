import { Preview } from "@storybook/react";
import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "@/index.scss";
import "@szhsin/react-menu/dist/index.css";
import "@linzjs/step-ag-grid/dist/GridTheme.scss";
import "@linzjs/step-ag-grid/dist/index.css";

import { initialize, mswLoader } from "msw-storybook-addon";
import { handlers } from "../src/mocks/mockHandlers";

initialize({
  onUnhandledRequest: (req, print) => {
    if (req.url.startsWith("/plan-generation/v1/")) {
      print.warning();
    } else return;
    return;
  },
});

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: {
        standard: {
          name: "1280x1024",
          styles: {
            width: '1280px',
            height: '800px',
          },
        }
      },
      defaultViewport: "standard",
    },
    msw: {
      handlers: [...handlers],
    },
  },
  loaders: [mswLoader],
};

export default preview;
