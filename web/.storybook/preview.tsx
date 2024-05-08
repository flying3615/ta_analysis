import { Preview } from '@storybook/react';
import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "@/index.scss";

import { INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS } from '@storybook/addon-viewport';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    viewport: {
      viewports: {
        ...INITIAL_VIEWPORTS,
        ...MINIMAL_VIEWPORTS,
      },
      defaultViewport: 'responsive',
    },
  },
};

export default preview;
