import { screen } from "@testing-library/react";

import { diagrams, lineEdges, markNodes } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { mockStore } from "@/test-utils/store-mock";

import CytoscapeCanvas from "../CytoscapeCanvas";

const mockedState = {
  preloadedState: { ...mockStore },
};

describe("CytoscapeCanvas", () => {
  it("renders", async () => {
    renderWithReduxProvider(
      <CytoscapeCanvas
        nodeData={markNodes}
        edgeData={lineEdges}
        diagrams={diagrams}
        getContextMenuItems={() => undefined}
      />,
      mockedState,
    );
    expect(await screen.findByTestId("CytoscapeCanvas")).toBeInTheDocument();
  });
});
