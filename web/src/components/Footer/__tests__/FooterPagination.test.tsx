import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FooterPagination from "@/components/Footer/FooterPagination";

describe("FooterPagination", () => {
  const onPageChangeSpy = jest.fn();
  const currentPage = 5;
  const totalPages = 10;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders pagination buttons", async () => {
    render(<FooterPagination currentPage={currentPage} totalPages={totalPages} onPageChange={jest.fn} />);

    expect(screen.getByRole("button", { name: "First" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last" })).toBeInTheDocument();
  });

  it('disables "First" and "Previous" buttons on the first page', async () => {
    render(<FooterPagination currentPage={1} totalPages={totalPages} onPageChange={jest.fn} />);

    expect(screen.getByRole("button", { name: "First" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });

  it('enables "First" and "Previous" buttons when not on the first page', async () => {
    render(<FooterPagination currentPage={2} totalPages={totalPages} onPageChange={jest.fn} />);

    expect(screen.getByRole("button", { name: "First" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
  });

  it('disables "Next" and "Last" buttons on the last page', async () => {
    render(<FooterPagination currentPage={10} totalPages={totalPages} onPageChange={jest.fn} />);

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last" })).toBeDisabled();
  });

  it('enables "Next" and "Last" buttons when not on the last page', async () => {
    render(<FooterPagination currentPage={currentPage} totalPages={totalPages} onPageChange={jest.fn} />);

    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Last" })).not.toBeDisabled();
  });

  it("disables buttons when there are no pages", async () => {
    render(<FooterPagination currentPage={0} totalPages={0} onPageChange={jest.fn} />);

    expect(screen.getByRole("button", { name: "First" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last" })).toBeDisabled();
  });

  it("disables buttons when there is only one page", async () => {
    render(<FooterPagination currentPage={1} totalPages={1} onPageChange={jest.fn} />);

    expect(screen.getByRole("button", { name: "First" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last" })).toBeDisabled();
  });

  it('calls onPageChange with correct arguments when "Next" button is clicked', async () => {
    render(<FooterPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChangeSpy} />);

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChangeSpy).toHaveBeenCalledWith(currentPage + 1);
  });

  it('calls onPageChange with correct arguments when "Previous" button is clicked', async () => {
    render(<FooterPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChangeSpy} />);

    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChangeSpy).toHaveBeenCalledWith(currentPage - 1);
  });

  it('calls onPageChange with correct arguments when "First" button is clicked', async () => {
    render(<FooterPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChangeSpy} />);

    await userEvent.click(screen.getByRole("button", { name: "First" }));
    expect(onPageChangeSpy).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with correct arguments when "Last" button is clicked', async () => {
    render(<FooterPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChangeSpy} />);

    await userEvent.click(screen.getByRole("button", { name: "Last" }));
    expect(onPageChangeSpy).toHaveBeenCalledWith(10);
  });
});
