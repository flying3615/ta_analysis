import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DeletePageModal from "@/components/Footer/DeletePageModal";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";

describe("DeletePageModal", () => {
  const closeModalSpy = jest.fn();
  const callbackSpy = jest.fn();
  const pageInfo = {
    activeSheet: PlanSheetType.TITLE,
    activePageNumber: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with given props", async () => {
    render(<DeletePageModal closeModal={closeModalSpy} pageInfo={pageInfo} callback={callbackSpy} />);

    expect(screen.getByRole("heading", { name: "Delete page?" })).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to remove Title Page 5?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it('calls closeModal on "Cancel" button click', async () => {
    render(<DeletePageModal closeModal={closeModalSpy} pageInfo={pageInfo} callback={callbackSpy} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(closeModalSpy).toHaveBeenCalled();
  });

  it('calls callback and closeModal on "Delete" button click', async () => {
    render(<DeletePageModal closeModal={closeModalSpy} pageInfo={pageInfo} callback={callbackSpy} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(callbackSpy).toHaveBeenCalledWith(5);
    expect(closeModalSpy).toHaveBeenCalled();
  });
});
