import { screen } from "@testing-library/react";

import { diagrams, lineEdges, markNodes } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { mockStoreV1 } from "@/test-utils/store-mock";

import CytoscapeCanvas from "../CytoscapeCanvas";

const mockedState = {
  preloadedState: { ...mockStoreV1 },
};

describe("CytoscapeCanvas", () => {
  it("renders", async () => {
    renderWithReduxProvider(
      <CytoscapeCanvas nodeData={markNodes} edgeData={lineEdges} diagrams={diagrams} />,
      mockedState,
    );
    expect(await screen.findByTestId("CytoscapeCanvas")).toBeInTheDocument();
  });
});
