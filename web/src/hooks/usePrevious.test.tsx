import { ReactElement, useState } from "react";
import { render, screen } from "@testing-library/react";
import { usePrevious } from "@/hooks/usePrevious.ts";
import userEvent from "@testing-library/user-event";

describe("usePrevious", () => {
  let extPrevious: boolean | undefined = undefined;

  const usePreviousInterceptor = (value: boolean) => {
    extPrevious = usePrevious(value);
  };

  const TestComponent = (): ReactElement => {
    const [value, setValue] = useState(false);
    usePreviousInterceptor(value);

    return <button onClick={() => setValue((value) => !value)}>Change value</button>;
  };

  test("usePrevious", async () => {
    render(<TestComponent />);
    const button = await screen.findByText("Change value");

    expect(extPrevious).toBeUndefined();

    await userEvent.click(button);
    expect(extPrevious).toBe(false);

    await userEvent.click(button);
    expect(extPrevious).toBe(true);
  });
});
