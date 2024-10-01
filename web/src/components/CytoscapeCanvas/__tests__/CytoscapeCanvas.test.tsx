import { screen } from "@testing-library/react";

import { diagrams, lineEdges, markNodes } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { renderWithReduxProvider } from "@/test-utils/jest-utils.tsx";
import { mockStore } from "@/test-utils/store-mock.ts";

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
        onNodeChange={jest.fn()}
        onEdgeChange={jest.fn()}
        getContextMenuItems={() => undefined}
      />,
      mockedState,
    );
    expect(await screen.findByTestId("CytoscapeCanvas")).toBeInTheDocument();
  });
});
