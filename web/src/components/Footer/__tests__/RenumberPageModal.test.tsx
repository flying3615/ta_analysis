import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { pages } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData";
import { RenumberPageModal } from "@/components/Footer/RenumberPageModal";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { setupStore } from "@/redux/store";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { modifiedStateV1 } from "@/test-utils/store-mock";

describe("RenumberPageModal", () => {
  const pageInfo = {
    activeSheet: PlanSheetType.TITLE,
    activePageNumber: 3,
  };

  const mockStoreRedux = setupStore({
    planSheets: modifiedStateV1({
      pages: [...pages, ...pages],
      activePageNumbers: {
        [PlanSheetType.TITLE]: 3,
        [PlanSheetType.SURVEY]: 1,
      },
    }),
  });

  test("renders the component", () => {
    renderWithReduxProvider(<RenumberPageModal closeModal={jest.fn} pageInfo={pageInfo} callback={jest.fn} />, {
      store: mockStoreRedux,
    });

    expect(screen.getByRole("heading", { name: "Renumber page" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Renumber Title Page 3 to:" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter page number")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  test("validates page number to be within valid range", async () => {
    renderWithReduxProvider(<RenumberPageModal closeModal={jest.fn} pageInfo={pageInfo} callback={jest.fn} />, {
      store: mockStoreRedux,
    });

    await userEvent.type(screen.getByPlaceholderText("Enter page number"), "5");

    expect(screen.getByText("Enter a number between 1 and 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  test("validates page number (non-negative)", async () => {
    renderWithReduxProvider(<RenumberPageModal closeModal={jest.fn} pageInfo={pageInfo} callback={jest.fn} />, {
      store: mockStoreRedux,
    });

    await userEvent.type(screen.getByPlaceholderText("Enter page number"), "-3");

    expect(screen.getByText("Enter a number between 1 and 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  test("validates only numbers can be entered", async () => {
    renderWithReduxProvider(<RenumberPageModal closeModal={jest.fn} pageInfo={pageInfo} callback={jest.fn} />, {
      store: mockStoreRedux,
    });

    await userEvent.type(screen.getByPlaceholderText("Enter page number"), "abc");

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  test("validates if page number is the current page", async () => {
    renderWithReduxProvider(<RenumberPageModal closeModal={jest.fn} pageInfo={pageInfo} callback={jest.fn} />, {
      store: mockStoreRedux,
    });

    await userEvent.type(screen.getByPlaceholderText("Enter page number"), "3");

    expect(screen.getByText("Diagram is already on page 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  test("calls callback with new page number", async () => {
    const callbackSpy = jest.fn();
    renderWithReduxProvider(<RenumberPageModal closeModal={jest.fn} pageInfo={pageInfo} callback={callbackSpy} />, {
      store: mockStoreRedux,
    });

    await userEvent.type(screen.getByPlaceholderText("Enter page number"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(callbackSpy).toHaveBeenCalledWith(2);
  });
});
