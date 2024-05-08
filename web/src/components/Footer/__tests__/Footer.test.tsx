import { render, screen } from "@testing-library/react";
import Footer from "../Footer";

describe("Footer", () => {
  it("renders", async () => {
    render(
      <Footer>
        <p>Inner Text</p>
      </Footer>,
    );

    expect(await screen.findByText("Inner Text")).toBeInTheDocument();
  });
});
