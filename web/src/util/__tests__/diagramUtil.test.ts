import { DiagramDTO } from "@linz/survey-plan-generation-api-client";

import { mockPlanData } from "@/mocks/data/mockPlanData";
import { findLabelById, mapAllDiagramLabels, mapDiagramLabels } from "@/util/diagramUtil";

describe("diagramUtil", () => {
  test("mapDiagramLabels visits all label fields of a type", () => {
    const mappedLabelsDiagram = mapDiagramLabels(mockPlanData.diagrams[0] as DiagramDTO, "labels", (label) => {
      return { ...label, editedText: `Edited ${label.id}` };
    });

    expect(mappedLabelsDiagram.labels).toHaveLength(1);
    expect(mappedLabelsDiagram.labels[0]?.editedText).toBe("Edited 1");
  });

  test("mapAllDiagramLabels visits all label fields of any  type", () => {
    const mappedLabelsDiagram = mapAllDiagramLabels(mockPlanData.diagrams[0] as DiagramDTO, (label) => {
      return { ...label, editedText: `Edited ${label.id}` };
    });

    expect(mappedLabelsDiagram.labels).toHaveLength(1);
    expect(mappedLabelsDiagram.labels[0]?.editedText).toBe("Edited 1");
    expect(mappedLabelsDiagram.lineLabels).toHaveLength(1);
    expect(mappedLabelsDiagram.lineLabels[0]?.editedText).toBe("Edited 13");
    expect(mappedLabelsDiagram.parcelLabelGroups).toHaveLength(3);
    expect(mappedLabelsDiagram.parcelLabelGroups?.[0]?.labels[0]?.editedText).toBe("Edited 14");
    expect(mappedLabelsDiagram.parcelLabelGroups?.[1]?.labels[0]?.editedText).toBe("Edited 15");
    expect(mappedLabelsDiagram.parcelLabelGroups?.[2]?.labels[0]?.editedText).toBe("Edited 16");
    expect(mappedLabelsDiagram.coordinateLabels).toHaveLength(2);
    expect(mappedLabelsDiagram.coordinateLabels[0]?.editedText).toBe("Edited 11");
    expect(mappedLabelsDiagram.coordinateLabels[1]?.editedText).toBe("Edited 12");
    expect(mappedLabelsDiagram.childDiagrams).toHaveLength(1);
    expect(mappedLabelsDiagram.childDiagrams?.[0]?.labels[0]?.editedText).toBe("Edited 41");
    expect(mappedLabelsDiagram.childDiagrams?.[0]?.labels[1]?.editedText).toBe("Edited 42");
  });

  describe("findLabelById", () => {
    test("Can find a label by cytoscape node id", () => {
      const label = findLabelById(mockPlanData.diagrams[0] as DiagramDTO, "labels", "LAB_1");
      expect(label?.id).toBe(1);
    });
    test("Can find a child diagram label by cytoscape node id", () => {
      const label = findLabelById(mockPlanData.diagrams[0] as DiagramDTO, "childDiagrams", "LAB_41");
      expect(label?.id).toBe(41);
    });
    test("Can find a parcel label by cytoscape node id", () => {
      const label = findLabelById(mockPlanData.diagrams[0] as DiagramDTO, "parcelLabels", "LAB_15");
      expect(label?.id).toBe(15);
    });
  });
});
