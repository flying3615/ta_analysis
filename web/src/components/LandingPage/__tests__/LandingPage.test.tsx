import { fireEvent, screen } from "@testing-library/react";
import { PlangenApp } from "@/App.tsx";
import { MemoryRouter } from "react-router";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { renderWithProviders } from "@/test-utils/jest-utils";

const renderPlangenApp = () => {
  renderWithProviders(
    <FeatureFlagProvider>
      <MemoryRouter initialEntries={["/plan-generation/123"]}>
        <PlangenApp mockMap={true} />
      </MemoryRouter>
    </FeatureFlagProvider>,
  );
};

describe("LandingPage", () => {
  it("should render", async () => {
    renderPlangenApp();
    expect(await screen.findByText("Plan generation")).toBeInTheDocument();
  });

  it("should go to Define Diagrams on click", async () => {
    renderPlangenApp();

    const button = await screen.findByText("Define Diagrams");
    fireEvent.click(button);

    expect(await screen.findByTestId("openlayers-map")).toBeInTheDocument();
    expect(screen.queryByText(/Sheets/)).not.toBeInTheDocument();
  });

  it("should go to Layout Plan Sheets on click", async () => {
    renderPlangenApp();

    const button = await screen.findByText("Layout Plan Sheets");
    fireEvent.click(button);

    expect(await screen.findByText(/Sheets/)).toBeInTheDocument();
    expect(screen.queryByText(/Diagrams/)).not.toBeInTheDocument();
  });
});
