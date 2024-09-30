import { screen } from "@testing-library/react";

import { diagrams, lineEdges, markNodes } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { renderWithReduxProvider } from "@/test-utils/jest-utils.tsx";

import CytoscapeCanvas from "../CytoscapeCanvas";

const mockedState = {
  preloadedState: {
    planSheets: {
      diagrams: [],
      pages: [{ id: 0, pageNumber: 1, pageType: PlanSheetType.TITLE }],
      activeSheet: PlanSheetType.TITLE,
      activePageNumbers: {
        [PlanSheetType.TITLE]: 0,
        [PlanSheetType.SURVEY]: 0,
      },
      hasChanges: false,
      planMode: PlanMode.View,
    },
  },
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
