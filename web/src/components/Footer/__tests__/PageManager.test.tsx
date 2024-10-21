import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PageManager from "@/components/Footer/PageManager";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { setupStore } from "@/redux/store";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { mockStore } from "@/test-utils/store-mock";

describe("PageManager", () => {
  const mockReduxStore = setupStore({
    planSheets: {
      ...mockStore.planSheets,
      pages: [],
      hasChanges: false,
      activeSheet: PlanSheetType.TITLE,
      activePageNumbers: {
        [PlanSheetType.TITLE]: 1,
        [PlanSheetType.SURVEY]: 1,
      },
      planMode: PlanMode.View,
    },
  });

  test("renders the component", async () => {
    renderWithReduxProvider(<PageManager />, { store: mockReduxStore });

    expect(screen.getByRole("button", { description: "Add page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { description: "Renumber page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { description: "Delete page" })).toBeInTheDocument();

    expect(screen.getByRole("button", { description: "Add page" })).toBeEnabled();
    expect(screen.getByRole("button", { description: "Renumber page" })).toBeEnabled();
    expect(screen.getByRole("button", { description: "Delete page" })).toBeEnabled();
  });

  test("renders the Add page menu", async () => {
    renderWithReduxProvider(<PageManager />, { store: mockReduxStore });

    await userEvent.click(screen.getByRole("button", { description: "Add page" }));
    expect(screen.getByRole("menuitem", { name: "Add new first page" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Add new page after this one" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Add new last page" })).toBeInTheDocument();
  });

  test("disables buttons when there are no pages", async () => {
    const mockNoPagesStore = setupStore({
      planSheets: {
        ...mockStore.planSheets,
        pages: [],
        activePageNumbers: {
          [PlanSheetType.TITLE]: 0,
          [PlanSheetType.SURVEY]: 1,
        },
        planMode: PlanMode.View,
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
