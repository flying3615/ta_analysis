import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";
import { Feature } from "ol";
import { Geometry } from "ol/geom";

import { diagramStyles } from "@/components/DefineDiagrams/diagramStyles";

describe("diagramStyles", () => {
  test.each([
    [CpgDiagramType.SYSN, { color: "#FF8000", lineDash: [7, 10] }],
    [CpgDiagramType.SYSP, { color: "#009F00", lineDash: [7, 10] }],
    [CpgDiagramType.SYST, { color: "#3F3FAA", lineDash: [7, 10] }],
    [CpgDiagramType.UDFN, { color: "#FF8000", lineDash: null }],
    [CpgDiagramType.UDFP, { color: "#009F00", lineDash: null }],
    [CpgDiagramType.UDFT, { color: "#3F3FAA", lineDash: null }],
  ])("styles %p correctly", (diagramType, expected) => {
    const diagramBoundary = new Feature<Geometry>({
      diagramType,
    });
    const style = diagramStyles(diagramBoundary);
    const stroke = style.getStroke();
    expect(stroke.getColor()).toEqual(expected.color);
    expect(stroke.getWidth()).toBe(2);
    expect(stroke.getLineDash()).toEqual(expected.lineDash);
  });
});
