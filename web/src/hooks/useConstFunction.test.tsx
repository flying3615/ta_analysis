import { MutableRefObject, ReactElement } from "react";
import { render } from "@testing-library/react";
import { useConstFunctionRef } from "@/hooks/useConstFunctionRef.ts";

let t: MutableRefObject<() => void>;

const TestComponent = (): ReactElement => {
  t = useConstFunctionRef(() => {});
  return <div />;
};

describe("useConstFunctionRef", () => {
  test("useConstFunctionRef", async () => {
    expect(t).toBeUndefined();

    render(<TestComponent />);

    expect(t.current).toBeDefined();
  });
});
