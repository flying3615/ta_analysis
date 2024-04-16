import { fireEvent, render, screen } from "@testing-library/react";
import { PlangenApp } from "@/App.tsx";
import { MemoryRouter } from "react-router";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";

const renderPlangenApp = () => {
  render(
    <FeatureFlagProvider>
      <MemoryRouter initialEntries={["/plan-generation/"]}>
        <PlangenApp mockMap={true} />
      </MemoryRouter>
    </FeatureFlagProvider>,
  );
};

describe("Verify rendering of the Landing Page", () => {
  it("should render", async () => {
    renderPlangenApp();
    expect(await screen.findByText("Plan generation")).toBeInTheDocument();
  });

  it("should go to Define Diagrams on click", async () => {
    renderPlangenApp();

    const button = await screen.findByText("Define Diagrams");
    fireEvent.click(button);

    expect(await screen.findByTestId("openlayers-map")).toBeInTheDocument();
    expect(screen.queryByText(/Layout Plan Sheets/)).not.toBeInTheDocument();
  });
  it("should go to Layout Plan Sheets on click", async () => {
    renderPlangenApp();

    const button = await screen.findByText("Layout Plan Sheets");
    fireEvent.click(button);

    expect(await screen.findByText(/Layout plan sheets/)).toBeInTheDocument();
    expect(screen.queryByText(/Define diagrams/)).not.toBeInTheDocument();
  });
});
