// Need the below for OL element styles
import "ol/ol.css";

import { Meta, StoryFn } from "@storybook/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { Provider } from "react-redux";
import { setupStore } from "@/redux/store";
import { Paths } from "@/Paths";

export default {
  title: "DefineDiagrams",
  component: DefineDiagrams,
} as Meta<typeof DefineDiagrams>;

export const Default: StoryFn<typeof DefineDiagrams> = () => {
  return (
    <Provider store={setupStore()}>
      <FeatureFlagProvider>
        <MemoryRouter initialEntries={["/plan-generation/define-diagrams/123"]}>
          <Routes>
            <Route path={Paths.defineDiagrams} element={<DefineDiagrams />} />
          </Routes>
        </MemoryRouter>
      </FeatureFlagProvider>
    </Provider>
  );
};
