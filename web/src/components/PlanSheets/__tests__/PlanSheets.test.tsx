import { Paths } from "@/Paths";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, generatePath } from "react-router-dom";
import PlanSheets from "../PlanSheets";
import userEvent from "@testing-library/user-event";

describe("PlanSheets", () => {
  it("renders with the survey sheet diagrams side panel open by default", async () => {
    render(
      <MemoryRouter initialEntries={[`${generatePath(Paths.layoutPlanSheets, { transactionId: 123 })}`]}>
        <PlanSheets />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Sheets")).toBeInTheDocument();
    const diagramsSidePanelButton = screen.getByTitle("Toggle diagrams panel");
    expect(diagramsSidePanelButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "false");
  });

  it("closes the survey sheet diagrams when toggle button is pressed", async () => {
    render(
      <MemoryRouter initialEntries={[`${generatePath(Paths.layoutPlanSheets, { transactionId: 123 })}`]}>
        <PlanSheets />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Survey sheet diagrams")).toBeVisible();
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "false");

    const diagramsSidePanelButton = screen.getByTitle("Toggle diagrams panel");
    expect(diagramsSidePanelButton).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(diagramsSidePanelButton);

    expect(await screen.findByTitle("Toggle diagrams panel")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "true");
  });
});
