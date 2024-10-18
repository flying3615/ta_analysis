import cytoscape from "cytoscape";

export const isPlaywrightTest = () => localStorage.getItem("isPlaywrightTest") === "1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isStorybookTest = () => (window as any).isStorybook === true;

/**
 * Updates the cytoscape state in the window variable so we can access cytoscape data such as positions of nodes in tests
 */
export const updateCytoscapeStateForTesting = (cytoscape: cytoscape.Core, testId: string) => {
  if (!isPlaywrightTest() && !isStorybookTest()) {
    return;
  }
  const cytoscapeData = JSON.stringify(cytoscape.json());
  /* eslint-disable-next-line */
  (window as any).cytoscapeData = { [testId]: cytoscapeData }
  console.debug(`Updated ${testId} cytoscapeData`);
};
