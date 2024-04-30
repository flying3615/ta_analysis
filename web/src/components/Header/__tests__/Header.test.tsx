import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "../Header";

describe("Header", () => {
  it("displays correct Diagrams label", () => {
    render(<Header onNavigate={jest.fn()} transactionId="123" view="Diagrams" />);

    expect(screen.getByText("Diagrams")).toBeInTheDocument();
    expect(screen.queryByText("Sheets")).toBeNull();
  });

  it("displays correct Sheets label", () => {
    render(<Header onNavigate={jest.fn()} transactionId="123" view="Sheets" />);

    expect(screen.getByText("Sheets")).toBeInTheDocument();
    expect(screen.queryByText("Diagrams")).toBeNull();
  });

  it("fires onNavigate", async () => {
    const onNavFn = jest.fn();
    render(<Header onNavigate={onNavFn} transactionId="123" view="Diagrams" />);

    await userEvent.click(screen.getByText("Diagrams"));

    await waitFor(async () => expect(await screen.findByText(/Layout Plan Sheets/)).toBeInTheDocument());
    await userEvent.click(screen.getByText(/Layout Plan Sheets/));

    expect(onNavFn).toHaveBeenCalledWith("/plan-generation/layout-plan-sheets/123");
  });
});
