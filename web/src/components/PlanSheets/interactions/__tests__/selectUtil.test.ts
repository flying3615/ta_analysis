import cytoscape, { CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";

import {
  findStartEndNodesForLine,
  getRelatedElements,
  getRelatedLabels,
} from "@/components/PlanSheets/interactions/selectUtil";

describe("selectUtil", () => {
  let cy: cytoscape.Core;
  let elements: CollectionReturnValue;
  let edge: EdgeSingular;
  let node: NodeSingular;

  beforeEach(() => {
    cy = {
      collection: jest.fn().mockReturnValue({
        merge: jest.fn().mockReturnThis(),
      }),
      $: jest.fn().mockReturnThis(),
      $id: jest.fn().mockReturnThis(),
    } as unknown as cytoscape.Core;

    elements = {
      cy: jest.fn().mockReturnValue(cy),
      forEach: jest.fn(
        (callback: (ele: NodeSingular | EdgeSingular, i: number, eles: CollectionReturnValue) => void) => {
          callback(edge, 0, elements);
          callback(node, 1, elements);
        },
      ),
    } as unknown as CollectionReturnValue;

    edge = {
      isEdge: jest.fn().mockReturnValue(true),
      isNode: jest.fn().mockReturnValue(false),
      data: jest.fn().mockReturnValueOnce("lineIdValue").mockReturnValueOnce("lineIdValue"),
      source: jest.fn(),
      target: jest.fn(),
      cy: jest.fn().mockReturnValue(cy),
    } as unknown as EdgeSingular;

    node = {
      isNode: jest.fn().mockReturnValue(true),
      isEdge: jest.fn().mockReturnValue(false),
      data: jest.fn().mockReturnValueOnce("featureIdValue").mockReturnValueOnce("symbolIdValue"),
      id: jest.fn().mockReturnValue("1"),
      cy: jest.fn().mockReturnValue(cy),
    } as unknown as NodeSingular;
  });

  describe("getRelatedLabels", () => {
    it("should merge related elements based on lineId and featureId", () => {
      const result = getRelatedLabels(elements);

      expect(result.merge).toHaveBeenCalledWith("[featureId=lineIdValue]");
      expect(result.merge).toHaveBeenCalledWith("[featureId=1]");
    });
  });

  describe("getRelatedElements", () => {
    it("should return related edges based on lineId", () => {
      const result = getRelatedElements(edge);

      expect(result).toBe(cy);
      expect(cy.$).toHaveBeenCalledWith("edge[lineId='lineIdValue']");
    });

    it("should return related nodes based on featureId and symbolId", () => {
      const result = getRelatedElements(node);

      expect(result).toBe(cy);
      expect(cy.$id).toHaveBeenCalledWith("featureIdValue");
    });

    it("should return undefined for unrelated elements", () => {
      node.data = jest.fn().mockReturnValueOnce(null).mockReturnValueOnce(null);

      const result = getRelatedElements(node);

      expect(result).toBeUndefined();
    });
  });

  describe("findStartEndNodesForLine", () => {
    it("should find start and end nodes of a line", () => {
      const relatedElements = {
        forEach: jest.fn((callback: (ele: EdgeSingular, i: number, eles: CollectionReturnValue) => void) => {
          callback(edge, 0, relatedElements);
        }),
      } as unknown as CollectionReturnValue;

      (edge.source as jest.Mock).mockReturnValue({ id: jest.fn().mockReturnValue("sourceNodeId") });
      (edge.target as jest.Mock).mockReturnValue({ id: jest.fn().mockReturnValue("targetNodeId") });

      (cy.$ as jest.Mock).mockReturnValue(relatedElements);

      const result = findStartEndNodesForLine(edge);

      expect(result.startNode).toBeDefined();
      expect(result.endNode).toBeDefined();
    });

    it("should return null for start and end nodes if no related elements", () => {
      (cy.$ as jest.Mock).mockReturnValue(undefined);

      const result = findStartEndNodesForLine(edge);

      expect(result.startNode).toBeNull();
      expect(result.endNode).toBeNull();
    });
  });
});
