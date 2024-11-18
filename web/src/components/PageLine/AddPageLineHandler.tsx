import { CoordinateDTO, CoordinateDTOCoordTypeEnum, LineDTO, PageDTO } from "@linz/survey-plan-generation-api-client";
import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape from "cytoscape";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEscapeKey } from "@/hooks/useEscape";
import { useOnKeyDown } from "@/hooks/useOnKeyDown";
import { getEdgeStyling, LineStyle } from "@/modules/plan/styling";
import { getActivePage, getLastUpdatedLineStyle, replacePage, setPlanMode } from "@/redux/planSheets/planSheetsSlice";
import { cytoscapeUtils } from "@/util/cytoscapeUtil";

export const AddPageLineHandler = () => {
  const { cyto } = useCytoscapeContext();

  const activePage = useAppSelector(getActivePage);
  const lastUpdatedLineStyle = useAppSelector(getLastUpdatedLineStyle);
  const container = cyto?.container();
  const cytoCoordMapper = useMemo(() => (container ? new CytoscapeCoordinateMapper(container, []) : null), [container]);

  const lineSegmentStart = useRef<cytoscape.NodeDefinition | null>(null);
  const lineSegmentEnd = useRef<cytoscape.NodeDefinition | null>(null);
  const lineNodeList = useRef<cytoscape.NodeDefinition[]>([]);
  const lineEdgeList = useRef<cytoscape.ElementDefinition[]>([]);
  const dispatch = useAppDispatch();

  const lastMousePosition = useRef<cytoscape.Position | null>(null);

  const getCyMaxId = useCallback(() => {
    let cyMaxId = 0;
    cyto?.elements().forEach((element) => {
      const id = parseInt(element.id());
      if (id > cyMaxId) {
        cyMaxId = id;
      }
    });
    return cyMaxId + 1;
  }, [cyto]);

  useEscapeKey({
    callback: () => {
      resetInput();
      dispatch(setPlanMode(PlanMode.Cursor));
    },
  });

  const resetInput = () => {
    lineSegmentStart.current = null;
    lineSegmentEnd.current = null;
    lineNodeList.current = [];
  };

  const newLineNode = (nodeId: number, position: cytoscape.Position): cytoscape.NodeDefinition => {
    return {
      group: "nodes",
      data: { id: `${nodeId}` },
      // It's important to clone the position otherwise the first line segment will have the same start and end
      // position object and then that creates a bug because it means the line segment is 0 length and both the start
      // and end of the line are keep moving to the current mouse position.
      position: { x: position.x, y: position.y },
    };
  };

  const newLineEdge = useCallback(
    (edgeId: number, startNodeId: string, endNodeId: string, segmentIndex: number): cytoscape.ElementDefinition => {
      const styles = getEdgeStyling(
        {
          id: edgeId,
          lineType: "userDefined",
          style: lastUpdatedLineStyle ?? LineStyle.SOLID,
          coordRefs: lineNodeList.current.map((node) => (node.data.id ? parseInt(node.data.id) : 0)),
        },
        segmentIndex,
      );
      return {
        group: "edges",
        data: {
          ...styles,
          id: `${edgeId}`,
          source: startNodeId,
          target: endNodeId,
        },
      };
    },
    [lastUpdatedLineStyle],
  );

  const isPositionWithinAreaLimits = useCallback(
    (position: cytoscape.Position): boolean => {
      if (cytoCoordMapper && cyto) {
        const diagramAreasLimits = cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cyto);
        if (diagramAreasLimits?.diagramOuterLimitsPx) {
          const diagramArea = diagramAreasLimits.diagramOuterLimitsPx;
          return cytoscapeUtils.isPositionWithinAreaLimits(position, [diagramArea]);
        }
      }
      return false;
    },
    [cyto, cytoCoordMapper],
  );

  const onMouseClick = useCallback(
    (event: cytoscape.EventObject) => {
      let cyMaxId = getCyMaxId();

      const length = (p1: cytoscape.Position, p2: cytoscape.Position) => {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
      };

      const addNode = (node: cytoscape.NodeDefinition) => {
        if (cyto && node.data.id && cyto.getElementById(node.data.id).length === 0) {
          lineNodeList.current.push(node);
          cyto.add(node);

          // This is needed so that each node does not get "selected" when added to the graph and acquire a pink
          // border circle around it. This is because the user is not selecting the node, they are just adding it to
          // the graph.
          const nodeElement = cyto.getElementById(node.data.id);
          if (nodeElement) {
            nodeElement.unselectify();
            nodeElement.unselect();
          }
        }
      };

      const addEdge = (edge: cytoscape.ElementDefinition) => {
        if (cyto) {
          const previousEdge = [...lineEdgeList.current].pop();
          lineEdgeList.current.push(edge);
          cyto.add(edge);
          //update the style of the previous line segment (for arrow styles)
          if (previousEdge) {
            const updatedEdge = newLineEdge(
              Number(previousEdge.data.id),
              previousEdge.data.source as string,
              previousEdge.data.target as string,
              lineEdgeList.current.length - 2,
            );
            cyto.remove(`edge[id='${previousEdge?.data.id}']`);
            cyto.add(updatedEdge);
          }
        }
      };

      const addLine = (edgeId: number, node1: cytoscape.NodeDefinition, node2: cytoscape.NodeDefinition) => {
        if (cyto && node1.data.id && node2.data.id) {
          addNode(node1);
          addNode(node2);
          addEdge(newLineEdge(edgeId, node1.data.id, node2.data.id, lineEdgeList.current.length));
        }
      };

      const startLine = (eventPosition: cytoscape.Position) => {
        lineSegmentStart.current = newLineNode(cyMaxId++, eventPosition);
        lineSegmentEnd.current = newLineNode(cyMaxId++, eventPosition);
        addLine(cyMaxId++, lineSegmentStart.current, lineSegmentEnd.current);
      };

      const extendLine = (position: cytoscape.Position) => {
        if (
          lineSegmentStart.current &&
          lineSegmentEnd.current &&
          lineSegmentStart.current.position &&
          lineSegmentEnd.current.position
        ) {
          if (length(lineSegmentStart.current.position, lineSegmentEnd.current.position) > 0) {
            lineSegmentStart.current = lineSegmentEnd.current;
            lineSegmentEnd.current = newLineNode(cyMaxId++, position);
            addLine(cyMaxId++, lineSegmentStart.current, lineSegmentEnd.current);
          } else {
            // else zero length line, so just swallow the event and don't do anything
          }
        }
      };

      const handleSingleClick = (position: cytoscape.Position) => {
        if (isPositionWithinAreaLimits(position)) {
          if (lineSegmentStart.current === null && lineSegmentEnd.current === null) {
            startLine(position);
          } else if (lineSegmentStart.current != null && lineSegmentEnd.current != null) {
            extendLine(position);
          } else {
            throw new Error("Unexpected state of lineSegmentStart xor lineSegmentEnd is null");
          }
        }
      };

      handleSingleClick(event.position);
    },
    [cyto, getCyMaxId, isPositionWithinAreaLimits, newLineEdge],
  );

  const onMouseDoubleClick = useCallback(() => {
    if (
      lineSegmentStart.current &&
      lineSegmentEnd.current &&
      activePage &&
      cytoCoordMapper &&
      lastMousePosition.current
    ) {
      if (isPositionWithinAreaLimits(lastMousePosition.current)) {
        let cyMaxId = getCyMaxId();
        dispatch(
          replacePage({
            updatedPage: addPageLineByList(
              activePage,
              lineNodeList.current,
              cytoCoordMapper,
              cyMaxId++,
              lastUpdatedLineStyle ?? LineStyle.SOLID,
            ),
          }),
        );
        resetInput();
        dispatch(setPlanMode(PlanMode.View));
      }
    }
  }, [activePage, cytoCoordMapper, lastUpdatedLineStyle, dispatch, getCyMaxId, isPositionWithinAreaLimits]);

  const onMouseMove = useCallback(
    (event: cytoscape.EventObject) => {
      lastMousePosition.current = event.position;

      if (cyto && lineSegmentEnd.current?.data?.id && isPositionWithinAreaLimits(lastMousePosition.current)) {
        cyto.getElementById(lineSegmentEnd.current.data.id).position(event.position);
      }
    },
    [cyto, isPositionWithinAreaLimits],
  );

  useOnKeyDown("Enter", onMouseDoubleClick);

  useEffect(() => {
    cyto?.addListener("click", onMouseClick);
    cyto?.addListener("dblclick", onMouseDoubleClick);
    cyto?.addListener("mousemove", onMouseMove);

    return () => {
      cyto?.removeListener("click", onMouseClick);
      cyto?.removeListener("dblclick", onMouseDoubleClick);
      cyto?.removeListener("mousemove", onMouseMove);
    };
  }, [cyto, onMouseClick, onMouseDoubleClick, onMouseMove]);

  // No elements to render, only have event listeners that modify the cytoscape graph
  return <></>;
};

const addPageLineByList = (
  page: PageDTO,
  nodeList: cytoscape.NodeDefinition[],
  cytoCoordMapper: CytoscapeCoordinateMapper,
  edgeId: number,
  lineStyle: string,
): PageDTO => {
  const coordList: CoordinateDTO[] = [];
  nodeList.forEach((node) => {
    if (node.data.id && node.position) {
      coordList.push({
        id: parseInt(node.data.id),
        coordType: CoordinateDTOCoordTypeEnum.userDefined,
        position: cytoCoordMapper.cytoscapeToPlanCoord(node.position),
      });
    }
  });

  const line: LineDTO = {
    id: edgeId,
    lineType: "userDefined",
    style: lineStyle,
    pointWidth: 1,
    coordRefs: nodeList.map((node) => (node.data.id ? parseInt(node.data.id) : 0)),
    displayState: DisplayStateEnum.display,
  };

  return {
    ...page,
    coordinates: [...(page.coordinates ?? []), ...coordList],
    lines: [...(page.lines ?? []), line],
  };
};
