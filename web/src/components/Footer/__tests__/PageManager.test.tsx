import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PageManager from "@/components/Footer/PageManager";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { setupStore } from "@/redux/store";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";

describe("PageManager", () => {
  const mockStore = setupStore({
    planSheets: {
      diagrams: [],
      pages: [],
      hasChanges: false,
      activeSheet: PlanSheetType.TITLE,
      activePageNumbers: {
        [PlanSheetType.TITLE]: 1,
        [PlanSheetType.SURVEY]: 1,
      },
    },
  });

  test("renders the component", async () => {
    renderWithReduxProvider(<PageManager />, { store: mockStore });

    expect(screen.getByRole("button", { description: "Add page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { description: "Renumber page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { description: "Delete page" })).toBeInTheDocument();

    expect(screen.getByRole("button", { description: "Add page" })).toBeEnabled();
    expect(screen.getByRole("button", { description: "Renumber page" })).toBeEnabled();
    expect(screen.getByRole("button", { description: "Delete page" })).toBeEnabled();
  });

  test("renders the Add page menu", async () => {
    renderWithReduxProvider(<PageManager />, { store: mockStore });

    await userEvent.click(screen.getByRole("button", { description: "Add page" }));
    expect(screen.getByRole("menuitem", { name: "Add new first page" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Add new page after this one" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Add new last page" })).toBeInTheDocument();
  });

  test("disables buttons when there are no pages", async () => {
    const mockNoPagesStore = setupStore({
      planSheets: {
        diagrams: [],
        pages: [],
        hasChanges: false,
        activeSheet: PlanSheetType.TITLE,
        activePageNumbers: {
          [PlanSheetType.TITLE]: 0,
          [PlanSheetType.SURVEY]: 1,
        },
      },
    });

    renderWithReduxProvider(<PageManager />, { store: mockNoPagesStore });

    expect(screen.getByRole("button", { description: "Add page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { description: "Renumber page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { description: "Delete page" })).toBeInTheDocument();

    expect(screen.getByRole("button", { description: "Add page" })).toBeDisabled();
    expect(screen.getByRole("button", { description: "Renumber page" })).toBeDisabled();
    expect(screen.getByRole("button", { description: "Delete page" })).toBeDisabled();
  });
});
