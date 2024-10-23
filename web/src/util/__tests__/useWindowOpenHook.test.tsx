import { screen, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useWindowOpenHook } from "../useWindowOpenHook";

class MockWindow {
  listeners: Record<string, () => unknown> = {};
  addEventListener = (type: string, listener: () => unknown) => {
    this.listeners[type] = listener;
  };
  removeEventListener = (type: string) => {
    delete this.listeners[type];
  };
  close = () => {
    this.listeners["beforeunload"]?.();
  };
}

describe("useWindowOpenHook", () => {
  let windowOpenBackup: Window["open"] | null = null;
  let openWindows: Window[] = [];

  beforeEach(() => {
    windowOpenBackup = window.open;
  });

  afterEach(() => {
    window.open = windowOpenBackup!;
  });

  const Test = ({ listeners, url }: { listeners?: Parameters<Window["addEventListener"]>[]; url: string }) => {
    openWindows = useWindowOpenHook({ listeners });
    return <button onClick={() => window.open(url, "_blank")}>Open window</button>;
  };

  test("resets window.open on unload and counts windows", async () => {
    const mockWindowOpen = () => new MockWindow() as unknown as WindowProxy | null;
    window.open = mockWindowOpen;

    const listener: Parameters<Window["addEventListener"]> = ["mousedown", () => {}];
    const view = render(<Test listeners={[listener]} url="" />);

    expect(windowOpenBackup).toBeDefined();
    expect(window.open).toBeDefined();
    expect(window.open).not.toBe(windowOpenBackup);

    // open a window
    await userEvent.click(await screen.findByRole("button"));

    // was it added to the window list?
    expect(openWindows).toHaveLength(1);

    // listeners were added
    const firstOpenWindow = openWindows[0] as unknown as MockWindow;
    expect(firstOpenWindow.listeners[listener[0]]).toBe(listener[1]);

    openWindows[0]?.close();

    await waitFor(() => expect(openWindows).toHaveLength(0));
    // listeners were removed
    expect(firstOpenWindow.listeners[listener[0]]).toBeUndefined();

    view.unmount();

    // window.open was returned to previous handler
    expect(window.open === mockWindowOpen).toBe(true);
  });

  test("Does not count window with an url", async () => {
    const mockWindowOpen = () => new MockWindow() as unknown as WindowProxy | null;
    window.open = mockWindowOpen;

    const listener: Parameters<Window["addEventListener"]> = ["mousedown", () => {}];
    const view = render(<Test listeners={[listener]} url="http://google.com" />);

    // open a window
    await userEvent.click(await screen.findByRole("button"));

    // was it added to the window list?
    expect(openWindows).toHaveLength(0);

    view.unmount();

    // window.open was returned to previous handler
    expect(window.open === mockWindowOpen).toBe(true);
  });

  test("handles null response from window.open", async () => {
    window.open = () => null;

    render(<Test url="" />);

    await userEvent.click(await screen.findByRole("button"));

    expect(openWindows).toHaveLength(0);
  });
});
