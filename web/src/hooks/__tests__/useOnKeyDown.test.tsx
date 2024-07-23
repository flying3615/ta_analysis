import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useOnKeyDown } from "../useOnKeyDown";

describe("useOnKeyDown hook", () => {
  it("useOnKeyDown should handle keypress when key name is specified", async () => {
    const handler = jest.fn();

    const Component = () => {
      useOnKeyDown("Escape", handler);
      return <span>Test</span>;
    };

    render(<Component />);
    expect(await screen.findByText("Test")).toBeInTheDocument();

    await userEvent.keyboard("{Space}");
    expect(handler).toHaveBeenCalledTimes(0);

    await userEvent.keyboard("{Escape}");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("useOnKeyDown should handle keypress when custom key matcher is defined", async () => {
    const handler = jest.fn();

    const Component = () => {
      useOnKeyDown(({ ctrlKey, key }) => ctrlKey && key === "p", handler);
      return <span>Test</span>;
    };

    render(<Component />);
    const element = await screen.findByText("Test");

    fireEvent.keyDown(element, { key: "c", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(0);

    fireEvent.keyDown(element, { key: "p", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
