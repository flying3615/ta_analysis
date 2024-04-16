import { Meta, StoryFn } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { PlangenApp } from "@/App.tsx";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
// Need the below for OL element styles
import "ol/ol.css";

export default {
  title: "DefineDiagrams",
  component: DefineDiagrams,
} as Meta<typeof DefineDiagrams>;

export const Default: StoryFn<typeof DefineDiagrams> = () => {
  return (
    <FeatureFlagProvider>
      <MemoryRouter initialEntries={["/plan-generation/define-diagrams"]}>
        <PlangenApp />
      </MemoryRouter>
    </FeatureFlagProvider>
  );
};
