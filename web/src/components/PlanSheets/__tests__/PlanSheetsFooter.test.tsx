import { render, screen } from "@testing-library/react";
import PlanSheetsFooter from "../PlanSheetsFooter.tsx";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import userEvent from "@testing-library/user-event";

describe("PlanSheetsFooter", () => {
  it("renders", async () => {
    render(
      <PlanSheetsFooter
        view={PlanSheetType.SURVEY}
        onChangeSheet={jest.fn()}
        setDiagramsPanelOpen={jest.fn()}
        diagramsPanelOpen={true}
      />,
    );

    expect(await screen.findByTitle("Toggle diagrams panel")).toBeInTheDocument();
  });

  it("displays menu with Title sheet selected", async () => {
    render(
      <PlanSheetsFooter
        view={PlanSheetType.TITLE}
        onChangeSheet={jest.fn()}
        setDiagramsPanelOpen={jest.fn()}
        diagramsPanelOpen={true}
      />,
    );

    expect(screen.queryByRole("menuitem")).toBeNull();

    await userEvent.click(screen.getByRole("button", { description: /Change sheet view/ }));

    expect(screen.getByText("Change sheet view")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Title sheet/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: /Survey sheet/ })).not.toHaveAttribute("aria-disabled");
  });

  it("displays menu with Survey sheet selected", async () => {
    render(
      <PlanSheetsFooter
        view={PlanSheetType.SURVEY}
        onChangeSheet={jest.fn()}
        setDiagramsPanelOpen={jest.fn()}
        diagramsPanelOpen={true}
      />,
    );

    expect(screen.queryByRole("menuitem")).toBeNull();

    await userEvent.click(screen.getByRole("button", { description: /Change sheet view/ }));

    expect(screen.getByText("Change sheet view")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Title sheet/ })).not.toHaveAttribute("aria-disabled");
    expect(screen.getByRole("menuitem", { name: /Survey sheet/ })).toHaveAttribute("aria-disabled", "true");
  });
});
