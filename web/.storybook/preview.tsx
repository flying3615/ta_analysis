import { Preview } from "@storybook/react";
import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "@/index.scss";
import "@szhsin/react-menu/dist/index.css";

import { INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";
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
        ...INITIAL_VIEWPORTS,
        ...MINIMAL_VIEWPORTS,
      },
      defaultViewport: "responsive",
    },
    msw: {
      handlers: [...handlers],
    },
  },
  loaders: [mswLoader],
};

export default preview;
