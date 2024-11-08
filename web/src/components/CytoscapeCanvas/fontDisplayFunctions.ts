import cytoscape from "cytoscape";

export const cytoscapeToDisplayFont = (ele: cytoscape.NodeSingular | cytoscape.EdgeSingular): string | undefined => {
  const dataFont: string | undefined = ele.data("font") as string | undefined;
  return toDisplayFont(dataFont);
};

export const toDisplayFont = (font: string | undefined): string | undefined => {
  switch (font) {
    case "Arial":
      return "Arimo, sans-serif";
    case "Times New Roman":
      return "Tinos, serif";
    case "Tahoma":
      return "Roboto, sans-serif";
    default:
      return font;
  }
};
