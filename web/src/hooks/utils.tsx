import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";

export const filterHiddenNodes = (nodes: INodeData[]) =>
  nodes.filter(
    (node) =>
      ![DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(
        node.properties.displayState?.valueOf() ?? "",
      ),
  );

export const filterHiddenEdges = (edges: IEdgeData[]) =>
  edges.filter(
    (edge) =>
      ![DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(
        edge.properties.displayState?.valueOf() ?? "",
      ),
  );
