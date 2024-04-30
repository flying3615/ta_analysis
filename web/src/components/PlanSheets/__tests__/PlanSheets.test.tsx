import { Paths } from "@/Paths";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, generatePath } from "react-router-dom";
import PlanSheets from "../PlanSheets";

describe("PlanSheets", () => {
  it("renders", () => {
    render(
      <MemoryRouter initialEntries={[`${generatePath(Paths.layoutPlanSheets, { transactionId: 123 })}`]}>
        <PlanSheets />
      </MemoryRouter>,
    );

    expect(screen.getByText("Sheets")).toBeInTheDocument();
  });
});
