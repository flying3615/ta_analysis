import { Paths } from "@/Paths";
import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { generatePath, MemoryRouter } from "react-router-dom";
import PlanSheets from "../PlanSheets";
import userEvent from "@testing-library/user-event";
import { store } from "@/redux/store.ts";
import { Provider } from "react-redux";
import { Route, Routes } from "react-router";
import { server } from "@/mocks/mockServer";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { rest } from "msw";

describe("PlanSheets", () => {
  const renderPlanSheets = (transactionId = 123) => {
    render(
      <MemoryRouter initialEntries={[`${generatePath(Paths.layoutPlanSheets, { transactionId })}`]}>
        <Provider store={store}>
          <Routes>
            <Route path="/plan-generation/layout-plan-sheets/:transactionId" element={<PlanSheets />}></Route>
          </Routes>
        </Provider>
      </MemoryRouter>,
    );
  };

  it("renders with the survey sheet diagrams side panel open by default", async () => {
    renderPlanSheets();

    expect(await screen.findByText("Sheets")).toBeInTheDocument();
    const diagramsSidePanelButton = screen.getByTitle("Toggle diagrams panel");
    expect(diagramsSidePanelButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "false");
  });

  it("closes the survey sheet diagrams when toggle button is pressed", async () => {
    renderPlanSheets();

    expect(await screen.findByText("Survey sheet diagrams")).toBeVisible();
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "false");

    const diagramsSidePanelButton = screen.getByTitle("Toggle diagrams panel");
    expect(diagramsSidePanelButton).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(diagramsSidePanelButton);

    expect(await screen.findByTitle("Toggle diagrams panel")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "true");
  });

  it("displays error when survey not found", async () => {
    renderPlanSheets(404);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.queryByTestId("loading-spinner"));

    expect(screen.getByText("Error fetching plan data")).toBeInTheDocument();
  });

  it("displays loading spinner while waiting for response", async () => {
    // response handler with delayed response
    server.use(
      rest.get(/\/plan\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.delay(2000), ctx.json(mockPlanData))),
    );

    renderPlanSheets(123);
    // await new Promise((resolve) => setTimeout(resolve, 3000)); // uncomment to make test fail

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("CytoscapeCanvas")).not.toBeInTheDocument();
  });
});
