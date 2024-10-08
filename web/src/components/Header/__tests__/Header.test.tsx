import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithReduxProvider } from "@/test-utils/jest-utils.tsx";

import Header from "../Header";

const mockedUsedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedUsedNavigate,
}));

const mockedUseTransactionId = jest.fn();
jest.mock("@/hooks/useTransactionId", () => ({
  useTransactionId: () => mockedUseTransactionId(),
}));

describe("Header", () => {
  beforeEach(() => {
    mockedUsedNavigate.mockClear();
    mockedUseTransactionId.mockReturnValue(123);
  });

  it("displays correct Diagrams label", () => {
    renderWithReduxProvider(<Header view="Diagrams" />);

    expect(screen.getByText("Diagrams")).toBeInTheDocument();
    expect(screen.queryByText("Sheets")).toBeNull();
  });

  it("displays correct Sheets label", () => {
    renderWithReduxProvider(<Header view="Sheets" />);

    expect(screen.getByText("Sheets")).toBeInTheDocument();
    expect(screen.queryByText("Diagrams")).toBeNull();
  });

  it("opens the dropdown menu on click and shows menu options", async () => {
    renderWithReduxProvider(<Header view="Diagrams" />);

    await userEvent.click(screen.getByText("Diagrams"));
    await screen.findByText(/Switch mode/);

    expect(screen.getByText("Define Diagrams")).toBeInTheDocument();
    expect(screen.getByText("Layout Plan Sheets")).toBeInTheDocument();
    expect(screen.getByText("Landing Page")).toBeInTheDocument();
  });

  it("fires onNavigate when clicking Layout Plan Sheets", async () => {
    renderWithReduxProvider(<Header view="Diagrams" />);

    await userEvent.click(screen.getByText("Diagrams"));

    await waitFor(async () => expect(await screen.findByText(/Layout Plan Sheets/)).toBeInTheDocument());
    await userEvent.click(screen.getByText(/Layout Plan Sheets/));

    expect(mockedUsedNavigate).toHaveBeenCalledWith("/plan-generation/layout-plan-sheets/123");
  });

  it("fires onNavigate when clicking Define Diagrams", async () => {
    renderWithReduxProvider(<Header view="Sheets" />);

    await userEvent.click(screen.getByText("Sheets"));

    await waitFor(async () => expect(await screen.findByText(/Define Diagrams/)).toBeInTheDocument());
    await userEvent.click(screen.getByText(/Define Diagrams/));

    expect(mockedUsedNavigate).toHaveBeenCalledWith("/plan-generation/define-diagrams/123");
  });

  it("navigates to Landing Page when clicked", async () => {
    renderWithReduxProvider(<Header view="Diagrams" />);

    await userEvent.click(screen.getByText("Diagrams"));
    await screen.findByText("Landing Page");
    await userEvent.click(screen.getByText("Landing Page"));

    expect(mockedUsedNavigate).toHaveBeenCalledWith("/plan-generation/123");
  });

  it("does not navigate when clicking the disabled view mode option", async () => {
    renderWithReduxProvider(<Header view="Diagrams" />);

    await userEvent.click(screen.getByText("Diagrams"));
    await screen.findByText("Define Diagrams");
    await userEvent.click(screen.getByText("Define Diagrams"));

    expect(mockedUsedNavigate).not.toHaveBeenCalled();
  });
});
