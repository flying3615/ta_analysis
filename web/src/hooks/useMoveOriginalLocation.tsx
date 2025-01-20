import { CartesianCoordsDTO, CoordinateDTOCoordTypeEnum } from "@linz/survey-plan-generation-api-client";
import { radiansToDegrees } from "@turf/helpers";
import cytoscape, { BoundingBox12, EdgeSingular, NodeSingular, Position as CytoscapePosition } from "cytoscape";
import _ from "lodash";
import { round } from "lodash-es";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import {
  getCytoscapeDataToNodeAndEdgeData,
  GroundMetresPosition,
  IEdgeDataProperties,
  INodeAndEdgeData,
  INodeData,
  INodeDataProperties,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { moveExtent } from "@/components/PlanSheets/interactions/moveAndResizeUtil";
import { getRelatedLabels } from "@/components/PlanSheets/interactions/selectUtil";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { LabelPropsToUpdate } from "@/components/PlanSheets/properties/LabelProperties";
import { cytoscapeLabelIdToPlanData } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useLineLabelAdjust } from "@/hooks/useLineLabelAdjust";
import { ElementLookupData, extractPositions, findElementsPosition } from "@/modules/plan/LookupOriginalCoord";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { updateDiagramsWithNode } from "@/modules/plan/updatePlanData";
import {
  getElementTypeConfigs,
  getOriginalPositions,
  replaceDiagramsAndPage,
} from "@/redux/planSheets/planSheetsSlice";
import { atanDegrees360, clampAngleDegrees360, midPoint, subtractIntoDelta } from "@/util/positionUtil";

export const useMoveOriginalLocation = () => {
  const activeDiagrams = useAppSelector(selectActiveDiagrams);
  const originalPositions = useAppSelector(getOriginalPositions);
  const dispatch = useAppDispatch();
  const adjustLabels = useLineLabelAdjust();
  const elemTypeConfigs = useAppSelector(getElementTypeConfigs);
  const movingDatas: INodeAndEdgeData = { edges: [], nodes: [] };
  const nodeIds = new Set();
  const edgeIds = new Set();
  const adjustedLabels: INodeData[] = [];
  const labelIds = new Set();

  let moveStartPositions: Record<string, cytoscape.Position> | undefined;

  const getLabelOriginalLocation = (
    labelData: INodeDataProperties,
    startPos: CartesianCoordsDTO,
    endPos: CartesianCoordsDTO,
  ) => {
    const labelProps: LabelPropsToUpdate = { id: cytoscapeLabelIdToPlanData(labelData.id) };

    if (!labelData.labelType || !labelData.elementType) {
      throw new Error(`Element type or label type not found for label with id ${labelData.id}`);
    }

    const defaultConfig = elemTypeConfigs.find(
      (config) => config.element === "Label" && config.elementType === labelData.labelType,
    )?.attribDefaults;

    if (!defaultConfig) return;

    const pointOffset = defaultConfig.find((attr) => attr.attribute.includes("originalPointOffset"))?.defaultValue;
    const anchorAngle = defaultConfig.find((attr) => attr.attribute.includes("originalAnchorAngle"))?.defaultValue;

    if (labelData.elementType === PlanElementType.LINE_LABELS) {
      const lineAngle = round(atanDegrees360(subtractIntoDelta(endPos, startPos)), 1);
      labelProps.position = midPoint(startPos, endPos);
      labelProps.rotationAngle = lineAngle;
      labelProps.anchorAngle = clampAngleDegrees360(lineAngle + Number(anchorAngle));
      labelProps.pointOffset = Number(pointOffset);
    }
    return labelProps;
  };

  const adjustLabelCoordinates = (selectedElements: cytoscape.CollectionReturnValue) => {
    const cyto = selectedElements.cy();
    const container = cyto?.container();
    if (!container || !originalPositions) return;

    const relatedLabels = getRelatedLabels(selectedElements);
    if (!relatedLabels.length) return;

    const cytoCoordMapper = new CytoscapeCoordinateMapper(container, activeDiagrams);
    const labelsOriginalLocation: LabelPropsToUpdate[] = [];

    relatedLabels.forEach((relatedLabel) => {
      const selectedLabelData = relatedLabel.data() as INodeDataProperties;
      const activeLines = _.flatMap(activeDiagrams, (diagram) => diagram?.lines);
      const line = activeLines.find((line) => line?.id === selectedLabelData.featureId);
      const diagram = activeDiagrams.find((diagram) => diagram.id === selectedLabelData.diagramId);
      const lineStartCoord = diagram?.coordinates.find((coord) => coord.id === (line?.coordRefs?.[0] as number));
      const lineEndCoord = diagram?.coordinates.find((coord) => coord.id === (_.last(line?.coordRefs) as number));
      if (lineStartCoord && lineEndCoord && diagram) {
        const labelLocation = getLabelOriginalLocation(
          selectedLabelData,
          cytoCoordMapper.cytoscapeToGroundCoord(
            cyto.getElementById(lineStartCoord.id.toString()).position(),
            diagram.id,
          ),
          cytoCoordMapper.cytoscapeToGroundCoord(
            cyto.getElementById(lineEndCoord.id.toString()).position(),
            diagram.id,
          ),
        );
        if (labelLocation) {
          labelsOriginalLocation.push(labelLocation);
        }
      }
      adjustedLabels.forEach((label) => {
        const original = labelsOriginalLocation.find((loc) => `LAB_${loc.id}` === label.id);
        if (original) {
          label.position = original.position as GroundMetresPosition;
          label.properties.textRotation = original.rotationAngle;
          label.properties.anchorAngle = original.anchorAngle;
          label.properties.pointOffset = original.pointOffset;
        }
      });
    });
  };

  const updateMove = (
    moveStartPositions: Record<string, CytoscapePosition> | undefined,
    movingElements: cytoscape.CollectionReturnValue,
    moveElementsExtent: BoundingBox12 | undefined,
    moveStart: CytoscapePosition | undefined,
    moveEnd: CytoscapePosition | undefined,
  ): CytoscapePosition | undefined => {
    if (!moveElementsExtent || !moveStart || !moveEnd || !moveStartPositions) {
      return;
    }

    const newExtent = moveExtent(moveElementsExtent, moveEnd.x - moveStart.x, moveEnd.y - moveStart.y);
    const dx = newExtent.x1 - moveElementsExtent.x1;
    const dy = newExtent.y1 - moveElementsExtent.y1;

    movingElements.positions((ele) => {
      const position = moveStartPositions[ele.id()];
      if (!position) {
        throw `missing position for element ${ele.id()}`;
      }
      return {
        x: position.x + dx,
        y: position.y + dy,
      };
    });

    if (dx === 0 && dy === 0) {
      return;
    }
    return { x: dx, y: dy };
  };

  const updateActiveDiagrams = (elements: Partial<INodeAndEdgeData>) => {
    let updatedDiagrams = activeDiagrams;
    elements.nodes?.forEach((node) => {
      if (node.properties.diagramId) {
        updatedDiagrams = updateDiagramsWithNode(updatedDiagrams, node);
      }
    });

    return updatedDiagrams;
  };

  function findMoveEnd(
    target: NodeSingular | EdgeSingular,
    coordinates: ElementLookupData[],
  ): { x: number; y: number } {
    const data = target.data() as IEdgeDataProperties;

    if ("source" in data) {
      const srcId = data.source?.toString();
      const srcElement = coordinates.find((e) => e.id.toString() === srcId);
      if (srcElement) {
        return srcElement.position;
      }
    }

    if ("target" in data) {
      const targetId = data.target?.toString();
      const targetElement = coordinates.find((e) => e.id.toString() === targetId);
      if (targetElement) {
        return targetElement.position;
      }
    }

    const element = coordinates.find((e) => e.id.toString() === data.id);
    return element ? element.position : { x: 0, y: 0 };
  }

  const getMovedDataLabels = (
    target: NodeSingular | EdgeSingular,
    selectedNodes: cytoscape.CollectionReturnValue,
  ): [INodeAndEdgeData, INodeData[]] | null => {
    const cyto = target.cy();
    const container = cyto?.container();
    if (!container || !originalPositions) return null;

    const cytoCoordMapper = new CytoscapeCoordinateMapper(container, activeDiagrams);
    const originalCoordinates: ElementLookupData[] = [];

    const connectedElements = selectedNodes.union(selectedNodes.connectedNodes());
    connectedElements.merge(getRelatedLabels(connectedElements));
    const adjacentEdges = connectedElements.connectedEdges().difference(connectedElements);
    const adjacentEdgeLabels = getRelatedLabels(adjacentEdges);
    const allElements = connectedElements.union(adjacentEdges).union(adjacentEdgeLabels);
    moveStartPositions = extractPositions(allElements);

    allElements.forEach((ele) => {
      const data = ele.data() as INodeDataProperties;
      const coordinates = findElementsPosition(data, allElements, originalPositions);

      if (coordinates?.position) {
        coordinates.position = cytoCoordMapper.groundCoordToCytoscape(coordinates.position, coordinates.diagramId);
        originalCoordinates.push(coordinates);
      }
    });

    const moveStart = selectedNodes.position();
    const moveEnd = findMoveEnd(target, originalCoordinates);
    if (moveEnd.x === 0 && moveEnd.y === 0) return null;

    updateMove(moveStartPositions, connectedElements, selectedNodes.boundingBox(), moveStart, moveEnd);

    const movingData = getCytoscapeDataToNodeAndEdgeData(cytoCoordMapper, connectedElements);
    const movedNodes = movingData.nodes.filter(
      (node) =>
        node.properties.coordType === CoordinateDTOCoordTypeEnum.node ||
        node.properties.coordType === CoordinateDTOCoordTypeEnum.calculated,
    );
    const movedNodesById = Object.fromEntries(movedNodes.map((node) => [node.id, node]));
    const adjustedLabelData = adjustLabels(movedNodesById);

    if (cyto.elements(":selected").isEdge()) {
      const selectedLine = cyto.elements(":selected");
      const lineMidPoint = midPoint(selectedLine.target().position(), selectedLine.source().position());
      const labelIds = getRelatedLabels(selectedLine.union(selectedLine.connectedNodes()))
        .filter((ele) => (ele.data() as INodeDataProperties).elementType === PlanElementType.LINE_LABELS)
        .map((ele) => ele.id());

      adjustedLabels?.forEach((node) => {
        if (node.properties.diagramId && labelIds.includes(node.id)) {
          node.position = cytoCoordMapper.cytoscapeToGroundCoord(lineMidPoint, node.properties.diagramId);
          // Update properties
          const { x: startX, y: startY } = selectedLine.source().position();
          const { x: endX, y: endY } = selectedLine.target().position();

          let lineAngle = radiansToDegrees(-Math.atan2(endY - startY, endX - startX));
          lineAngle = lineAngle > 90 ? lineAngle - 180 : lineAngle < -90 ? lineAngle + 180 : lineAngle;
          node.properties.textRotation = clampAngleDegrees360(lineAngle);
        }
      });
    }

    movingData.nodes.forEach((node) => {
      if (!nodeIds.has(node.id)) {
        nodeIds.add(node.id);
        movingDatas.nodes.push(node);
      }
    });
    movingData.edges.forEach((edge) => {
      if (!edgeIds.has(edge.id)) {
        edgeIds.add(edge.id);
        movingDatas.edges.push(edge);
      }
    });
    adjustedLabelData?.forEach((node) => {
      if (!labelIds.has(node.id)) {
        labelIds.add(node.id);
        adjustedLabels.push(node);
      }
    });

    return [movingDatas, adjustedLabels];
  };

  /**
   * Resets the positions of edges and their related elements to their original locations.
   */
  const resetEdgePositions = (
    target: NodeSingular | EdgeSingular,
    selectedElements: cytoscape.CollectionReturnValue,
  ) => {
    const cyto = target.cy();
    const container = cyto?.container();
    if (!container || !originalPositions) return;

    const cytoCoordMapper = new CytoscapeCoordinateMapper(container, activeDiagrams);
    const originalCoordinates: ElementLookupData[] = [];

    if (selectedElements.length > 1) {
      const processElements = (selectedNodes: cytoscape.CollectionReturnValue, dataSource: string) => {
        const connectElem = selectedNodes.union(selectedNodes.connectedNodes());
        connectElem.merge(getRelatedLabels(connectElem));
        const adjacentEdges = connectElem.connectedEdges().difference(connectElem);
        const adjacentEdgeLabels = getRelatedLabels(adjacentEdges);
        const allElements = connectElem.union(adjacentEdges).union(adjacentEdgeLabels);
        moveStartPositions = extractPositions(allElements);

        allElements.forEach((ele) => {
          const data = ele.data() as INodeDataProperties;
          const coordinates = findElementsPosition(data, allElements, originalPositions);

          if (coordinates?.position) {
            coordinates.position = cytoCoordMapper.groundCoordToCytoscape(coordinates.position, coordinates.diagramId);
            originalCoordinates.push(coordinates);
          }
        });

        const filteredElements = allElements.filter(
          (ele) => (ele.data() as INodeDataProperties)["featureId"]?.toString() === dataSource,
        );
        const newTarget = filteredElements.length > 0 ? filteredElements : selectedNodes;
        const moveStart = selectedNodes.position();
        const moveEnd = findMoveEnd(newTarget, originalCoordinates);
        if (moveEnd.x === 0 && moveEnd.y === 0) return;

        updateMove(moveStartPositions, connectElem, selectedNodes.boundingBox(), moveStart, moveEnd);
        const movingData = getCytoscapeDataToNodeAndEdgeData(cytoCoordMapper, connectElem);
        const movedNodes = movingData.nodes.filter(
          (node) =>
            node.properties.coordType === CoordinateDTOCoordTypeEnum.node ||
            node.properties.coordType === CoordinateDTOCoordTypeEnum.calculated,
        );
        const movedNodesById = Object.fromEntries(movedNodes.map((node) => [node.id, node]));
        const adjustedLabelData = adjustLabels(movedNodesById);

        movingData.nodes.forEach((node) => {
          if (nodeIds.add(node.id)) movingDatas.nodes.push(node);
        });
        movingData.edges.forEach((edge) => {
          if (edgeIds.add(edge.id)) movingDatas.edges.push(edge);
        });
        adjustedLabelData?.forEach((node) => {
          if (labelIds.add(node.id)) adjustedLabels.push(node);
        });
      };
      selectedElements.forEach((ele, i) => {
        if (!ele) return;
        const data = ele.data() as INodeDataProperties;
        processElements(cyto.getElementById(data["source"] as string), data["source"] as string);

        // Check if it's the last node
        if (i === selectedElements.length - 1) {
          processElements(cyto.getElementById(data["target"] as string), data["target"] as string);
        }
      });

      adjustLabelCoordinates(selectedElements);

      const updatedDiagrams = updateActiveDiagrams({
        nodes: [...movingDatas.nodes, ...adjustedLabels],
      });
      dispatch(replaceDiagramsAndPage({ diagrams: updatedDiagrams }));
    } else {
      const data = target.data() as INodeDataProperties;
      getMovedDataLabels(target, cyto.$id(data["source"] as string));
      getMovedDataLabels(target, cyto.$id(data["target"] as string));
      const updatedDiagrams = updateActiveDiagrams({
        nodes: [...movingDatas.nodes, ...adjustedLabels],
        edges: [...movingDatas.edges],
      });
      dispatch(replaceDiagramsAndPage({ diagrams: updatedDiagrams }));
    }
    // TODO: Handle multiple edges at once
  };

  /**
   * Resets the positions of nodes and their related elements to their original locations.
   */
  const restoreNodePositions = (
    target: NodeSingular | EdgeSingular,
    selectedElements: cytoscape.CollectionReturnValue,
  ) => {
    const nodes = selectedElements
      .map((ele) => ele.data() as INodeDataProperties)
      .filter((data) => data.elementType === PlanElementType.COORDINATES);
    nodes.forEach((node) => {
      if (node && node.id != null) {
        const selectedNode = target.cy().getElementById(node.id);
        const selectedElems = selectedNode.merge(getRelatedLabels(selectedNode));
        getMovedDataLabels(selectedNode, selectedElems);
      }
    });
    const movingElements = selectedElements.union(selectedElements.connectedNodes());
    movingElements.merge(getRelatedLabels(movingElements));
    const adjacentEdges = movingElements.connectedEdges().difference(movingElements);
    adjustLabelCoordinates(adjacentEdges);

    const updatedDiagrams = updateActiveDiagrams({
      nodes: [...movingDatas.nodes, ...adjustedLabels],
      edges: [...movingDatas.edges],
    });
    dispatch(replaceDiagramsAndPage({ diagrams: updatedDiagrams }));
  };

  const restoreOriginalPosition = (target: NodeSingular | EdgeSingular | null) => {
    if (!target) return;

    const cyto = target.cy();
    const selectedElements = cyto.elements(":selected");
    const isEdgeSelected = selectedElements.isEdge();

    if (isEdgeSelected) {
      resetEdgePositions(target, selectedElements);
    } else {
      restoreNodePositions(target, selectedElements);
    }
  };

  return {
    restoreOriginalPosition,
  };
};
