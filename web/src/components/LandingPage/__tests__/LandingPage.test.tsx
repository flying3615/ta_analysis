import { fireEvent, screen } from "@testing-library/react";
import { generatePath, Route } from "react-router-dom";

import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams";
import LandingPage from "@/components/LandingPage/LandingPage";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { Paths } from "@/Paths";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils";

describe("LandingPage", () => {
  it("should render Landing page", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<LandingPage />} path={Paths.root} />,
      generatePath(Paths.root, { transactionId: "123" }),
    );

    expect(await screen.findByRole("heading", { name: "Plan generation" })).toBeInTheDocument();
    expect(screen.getByText(/^Define Diagrams$/)).toBeTruthy();
    expect(screen.getByText(/^Layout Plan Sheets$/)).toBeTruthy();
    expect(
      screen.getByText(/Find Maintain Diagram Layers and Preferences in Define Diagrams and Layout Plan Sheets/),
    ).toBeTruthy();
  });

  it("should go to Define Diagrams on click", async () => {
    renderCompWithReduxAndRoute(
      <>
        <Route element={<LandingPage />} path={Paths.root} />
        <Route element={<DefineDiagrams />} path={Paths.defineDiagrams} />
      </>,
      generatePath(Paths.root, { transactionId: "123" }),
    );

    const button = await screen.findByText("Define Diagrams");
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Diagrams icon Diagrams Dropdown icon" })).toBeTruthy();
  });

  it("should go to Layout Plan Sheets on click", async () => {
    renderCompWithReduxAndRoute(
      <>
        <Route element={<LandingPage />} path={Paths.root} />
        <Route element={<PlanSheets />} path={Paths.layoutPlanSheets} />
      </>,
      generatePath(Paths.root, { transactionId: "123" }),
    );

    const button = await screen.findByText("Layout Plan Sheets");
    fireEvent.click(button);
    expect(await screen.findByRole("heading", { name: /Title sheet diagrams/ })).toBeInTheDocument();
  });
});
