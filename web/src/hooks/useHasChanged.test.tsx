import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement, useState } from "react";

import { useHasChanged } from "@/hooks/useHasChanged.ts";

describe("useHasChanged", () => {
  let extHasChanged: boolean | undefined = undefined;

  const useHasChangedInterceptor = (value: boolean) => {
    extHasChanged = useHasChanged(value);
  };

  const TestComponent = (): ReactElement => {
    const [value, setValue] = useState(false);
    useHasChangedInterceptor(value);

    return <button onClick={() => setValue((value) => !value)}>Change value</button>;
  };

  test("useHasChanged", async () => {
    render(<TestComponent />);
    const button = await screen.findByText("Change value");

    expect(extHasChanged).toBe(false);

    await userEvent.click(button);
    expect(extHasChanged).toBe(true);
  });
});
