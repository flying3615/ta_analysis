import cytoscape from "cytoscape";

export const isPlaywrightTest = () => localStorage.getItem("isPlaywrightTest") === "1";

/**
 * We need to access cytoscape data such as positions of nodes in playwright tests
 */
export const saveCytoscapeStateToStorage = (cytoscape: cytoscape.Core, testId: string) =>
  localStorage.setItem(`${testId}-cytoscapeData`, JSON.stringify(cytoscape.json()));
