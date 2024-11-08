import cytoscape from "cytoscape";

import { toDisplayFont } from "@/components/CytoscapeCanvas/fontDisplayFunctions";

describe("fontDisplayFunctions", () => {
  describe("toDisplayFont", () => {
    const fontCases: string[][] = [
      ["Arial", "Arimo, sans-serif"],
      ["Times New Roman", "Tinos, serif"],
      ["Tahoma", "Roboto, sans-serif"],
      ["", ""],
      ["Comic Sans", "Comic Sans"],
    ];

    test.each(fontCases)("converts font %s to expected font", (startFont, expectedFont) => {
      const displayFont = toDisplayFont(startFont);
      expect(displayFont).toBe(expectedFont);
    });

    test("returns undefined for undefined font", () => {
      const displayFont = toDisplayFont(undefined);
      expect(displayFont).toBeUndefined();
    });
  });

  describe("cytoscapeToDisplayFont", () => {
    test("converts cytoscape font to display font", () => {
      const cytoscapeNode = {
        data: () => "Arial",
      } as unknown as cytoscape.NodeSingular;

      const displayFont = toDisplayFont(cytoscapeNode.data() as string);
      expect(displayFont).toBe("Arimo, sans-serif");
    });

    test("returns undefined for undefined cytoscape font", () => {
      const cytoscapeNode = {
        data: () => undefined,
      } as unknown as cytoscape.NodeSingular;

      const displayFont = toDisplayFont(cytoscapeNode.data() as undefined);
      expect(displayFont).toBeUndefined();
    });

    test("returns LOLSymbol where object font is LOLSymbol", () => {
      const cytoscapeNode = {
        data: () => "LOLSymbol",
      } as unknown as cytoscape.NodeSingular;

      const displayFont = toDisplayFont(cytoscapeNode.data() as string);
      expect(displayFont).toBe("LOLSymbol");
    });
  });
});
