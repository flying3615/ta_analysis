import { render, screen } from "@testing-library/react";
import SidePanel from "../SidePanel";

describe("SidePanel", () => {
  it("is visible when isOpen is true", async () => {
    render(
      <SidePanel align="left" isOpen={true} data-testid="test">
        <p>Inner Text</p>
      </SidePanel>,
    );

    expect(await screen.findByTestId("test")).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByText("Inner Text")).toBeVisible();
  });

  it("has aria-hidden attribute when isOpen is false", async () => {
    render(
      <SidePanel align="left" isOpen={false} data-testid="test">
        <p>Inner Text</p>
      </SidePanel>,
    );

    expect(await screen.findByTestId("test")).toHaveAttribute("aria-hidden", "true");
  });
});
