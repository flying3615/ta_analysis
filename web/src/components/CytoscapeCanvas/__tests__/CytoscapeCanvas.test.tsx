import { render, screen } from "@testing-library/react";
import CytoscapeCanvas from "../CytoscapeCanvas";

describe("CytoscapeCanvas", () => {
  it("renders", async () => {
    render(<CytoscapeCanvas />);

    expect(await screen.findByTestId("CytoscapeCanvas")).toBeInTheDocument();
  });
});
