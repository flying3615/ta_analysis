import { userEvent } from "@storybook/testing-library";
import { screen, waitFor } from "@testing-library/react";
import { useContext, useEffect } from "react";

import { CytoscapeContextMenu } from "@/components/CytoscapeCanvas/CytoscapeContextMenu";
import { CytoscapeContext } from "@/components/CytoscapeCanvas/CytoscapeContextProvider";
import { ContextMenuState } from "@/hooks/useCytoscapeContextMenu";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";

const mockHideMenu = jest.fn();

const mockMenuState: ContextMenuState = {
  visible: true,
  items: [
    { title: "Item 1", callback: jest.fn() },
    { title: "Item 2", callback: jest.fn(), disabled: true },
    { title: "Item 3", callback: jest.fn(), submenu: [{ title: "Subitem 1", callback: jest.fn() }] },
  ],
  position: { x: 100, y: 100 },
  target: null,
  leftMenu: false,
};

const TestComponent = () => {
  const cytoscapeContext = useContext(CytoscapeContext);

  useEffect(() => {
    if (cytoscapeContext?.cyto) {
      const cy = cytoscapeContext.cyto;
      const node = cy.add({
        group: "nodes",
        data: { id: "D1" },
        position: { x: 100, y: 100 },
      });
      node.trigger("cxttap");
    }
  }, [cytoscapeContext?.cyto]);

  return <CytoscapeContextMenu menuState={mockMenuState} hideMenu={mockHideMenu} />;
};

describe("CytoscapeContextMenu", () => {
  test("renders with menu options", async () => {
    renderWithReduxProvider(<TestComponent />);

    const optionA = await screen.findByText("Item 1");
    // eslint-disable-next-line testing-library/no-node-access
    expect(optionA.closest(".cytoscape-context-menu-container")).toHaveStyle({ top: "100px", left: "100px" });
    expect(optionA).toBeInTheDocument();
    await userEvent.click(optionA);
    await waitFor(() => expect(jest.fn()).toHaveBeenCalledTimes(0));
    const optionB = await screen.findByText("Item 2");
    expect(optionB).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(optionB.parentNode).toHaveClass("disabled");
  });
});
