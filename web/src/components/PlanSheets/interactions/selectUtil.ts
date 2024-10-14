import { CollectionReturnValue } from "cytoscape";

export function getRelatedLabels(elements: CollectionReturnValue): CollectionReturnValue {
  const related = elements.cy().collection();
  elements.forEach((ele) => {
    if (ele.isEdge() && ele.data("lineId")) {
      related.merge(`[featureId=${ele.data("lineId")}]`);
    }
    if (ele.isNode() && !isNaN(+ele.id())) {
      related.merge(`[featureId=${ele.id()}]`);
    }
  });
  return related;
}
