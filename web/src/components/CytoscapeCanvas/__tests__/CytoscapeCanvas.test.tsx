import { render, screen } from "@testing-library/react";

import { diagrams, lineEdges, markNodes } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";

import CytoscapeCanvas from "../CytoscapeCanvas";

describe("CytoscapeCanvas", () => {
  it("renders", async () => {
    render(<CytoscapeCanvas nodeData={markNodes} edgeData={lineEdges} diagrams={diagrams} />);

    expect(await screen.findByTestId("CytoscapeCanvas")).toBeInTheDocument();
  });
});
