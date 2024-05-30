import { render, screen } from "@testing-library/react";
import CytoscapeCanvas from "../CytoscapeCanvas";
import { lineEdges, markNodes, diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";

describe("CytoscapeCanvas", () => {
  it("renders", async () => {
    render(<CytoscapeCanvas nodeData={markNodes} edgeData={lineEdges} diagrams={diagrams} />);

    expect(await screen.findByTestId("CytoscapeCanvas")).toBeInTheDocument();
  });
});
