import cytoscape from "cytoscape";

export const isPlaywrightTest = () => localStorage.getItem("isPlaywrightTest") === "1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isStorybookTest = () => (window as any).isStorybook === true;

/**
 * We need to access cytoscape data such as positions of nodes in playwright tests
 */
export const saveCytoscapeState = (cytoscape: cytoscape.Core, testId: string) => {
  const cytoscapeData = JSON.stringify(cytoscape.json());
  /* eslint-disable-next-line */
  (window as any).cytoscapeData = { [testId]: cytoscapeData }
};
