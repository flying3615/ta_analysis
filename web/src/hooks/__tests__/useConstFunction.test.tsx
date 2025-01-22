import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement, useState } from "react";

import { useConstFunction } from "@/hooks/useConstFunction";

const funcRefs = new Set<() => void>();

const TestComponent = (): ReactElement => {
  const func = useConstFunction(() => {});
  funcRefs.add(func);

  const [x, setX] = useState(1);

  return (
    <div>
      value:{x}
      <button onClick={() => setX(x + 1)}>button</button>
    </div>
  );
};

describe("useConstFunctionRef", () => {
  test("useConstFunctionRef", async () => {
    expect(funcRefs.size).toBe(0);

    render(<TestComponent />);

    expect(funcRefs.size).toBe(1);

    // Check that a state update does not create a new function ref
    await userEvent.click(await screen.findByRole("button"));
    await screen.findByText("value:2");
    expect(funcRefs.size).toBe(1);
  });
});
