import { screen } from "@testing-library/react";

import { diagrams, lineEdges, markNodes } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { getMockedStore, stateVersions } from "@/test-utils/store-mock";

import CytoscapeCanvas from "../CytoscapeCanvas";

describe.each(stateVersions)("CytoscapeCanvas with state%s", (version) => {
  it("renders", async () => {
    renderWithReduxProvider(
      <CytoscapeCanvas nodeData={markNodes} edgeData={lineEdges} diagrams={diagrams} />,
      getMockedStore(version),
    );
    expect(await screen.findByTestId("CytoscapeCanvas")).toBeInTheDocument();
  });
});
