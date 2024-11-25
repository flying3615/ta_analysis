import {
  CoordinateDTO,
  DiagramDTO,
  LabelDTO,
  LabelDTOLabelTypeEnum,
  LineDTO,
  PageConfigDTO,
  PageDTO,
} from "@linz/survey-plan-generation-api-client";
import { chunk, flatten, negate, zip } from "lodash-es";

import {
  IDiagramNodeData,
  IEdgeData,
  IGraphData,
  INodeData,
  INodeDataProperties,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { LABEL_PADDING_PX } from "@/components/CytoscapeCanvas/styleNodeMethods";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { planDataLabelIdToCytoscape } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { SYMBOLS_FONT } from "@/constants";
import { createNewNode } from "@/util/mapUtil";

import { getEdgeStyling, getFontColor, getIsCircled, getTextBackgroundOpacity, getZIndex, LineStyle } from "./styling";

const isSymbol = (label: LabelDTO) => label.font === SYMBOLS_FONT;
const notSymbol = negate(isSymbol);
const isUserAnnotation = (label: LabelDTO) => label.labelType === LabelDTOLabelTypeEnum.userAnnotation;
const setElementType =
  (elementType: PlanElementType): (<T extends IGraphData>(node: T) => T) =>
  (node) => {
    node.properties.elementType = elementType;
    return node;
  };

export const labelToNode = (label: LabelDTO): INodeData => {
  return {
    id: planDataLabelIdToCytoscape(label.id),
    position: label.position,
    label: label.editedText ?? label.displayText,
    properties: {
      elementType: PlanElementType.LABELS,
      labelType: label.labelType,
      font: label.font,
      fontSize: label.fontSize ?? 10,
      fontStyle: label.fontStyle,
      fontColor: getFontColor(label),
      zIndex: getZIndex(label),
      circled: getIsCircled(label),
      textBackgroundOpacity: getTextBackgroundOpacity(label),
      textBorderOpacity: label.borderWidth ? 1 : 0,
      textBorderWidth: label.borderWidth ?? 0,
      textBackgroundPadding: label.borderWidth ? 3 : LABEL_PADDING_PX,
      textRotation: label.rotationAngle,
      anchorAngle: label.anchorAngle,
      pointOffset: label.pointOffset,
      textAlignment: label.textAlignment,
      borderWidth: label.borderWidth,
      displayState: label.displayState,
      displayFormat: label.displayFormat,
      featureId: label.featureId,
      featureType: label.featureType,
      ...(isSymbol(label) && { symbolId: label.displayText }),
    } satisfies INodeDataProperties,
  };
};

export const coordinateToNode = (coordinate: CoordinateDTO): INodeData => {
  return {
    id: coordinate.id.toString(),
    position: coordinate.position,
    properties: {
      coordType: coordinate.coordType,
      elementType: PlanElementType.COORDINATES,
    } satisfies INodeDataProperties,
  };
};

export const extractPageNodes = (pages: PageDTO[]): INodeData[] => {
  return pages.flatMap((page) => {
    const labels =
      page.labels
        ?.filter(isUserAnnotation)
        .filter(notSymbol)
        .map(labelToNode)
        .map(setElementType(PlanElementType.LABELS)) ?? [];

    const coordinates = page.coordinates?.map(coordinateToNode) ?? [];
    return [...labels, ...coordinates] as INodeData[];
  });
};

export const extractPageEdges = (pages: PageDTO[]): IEdgeData[] => {
  return pages.flatMap((page) => {
    return (
      (page.lines
        ?.filter((line) => line.coordRefs?.[0] && line.coordRefs?.[1])
        .flatMap(baseLineToEdges) as IEdgeData[]) ?? []
    );
  });
};

export const extractPageConfigNodes = (pageConfigs: PageConfigDTO[]): INodeData[] => {
  return pageConfigs.flatMap((pageConfig) => {
    const nodes: INodeData[] = pageConfig.coordinates.map((coordinate) => ({
      id: `border_${coordinate.id.toString()}`,
      position: coordinate.position,
      label: "",
      properties: {
        coordType: coordinate.coordType,
        featureId: 1,
        font: "Arial",
      } satisfies INodeDataProperties,
    }));

    // Sort nodes by x (right-most) and y (bottom-most)
    nodes.sort((a, b) => {
      if (a.position.x === b.position.x) {
        return a.position.y - b.position.y;
      }
      return b.position.x - a.position.x;
    });

    const updatedNodes = nodes.map(
      (node) => (node.id === "border_1013" ? { ...node, position: { y: -2.3, x: 39.7 } } : node), // compass
    );

    // If bottomRightNode found, add a new node there for page number overlay
    const bottomRightNode = nodes[1];
    if (bottomRightNode) {
      updatedNodes.push(createNewNode(bottomRightNode, "border_page_no0", 0, 1));
      updatedNodes.push(createNewNode(bottomRightNode, "border_page_no1", -2, 1));
      updatedNodes.push(createNewNode(bottomRightNode, "border_page_no2", -2, 0));
      updatedNodes.push(createNewNode(bottomRightNode, "border_page_no", -1, 0.5, "T/1"));
    }

    return updatedNodes;
  });
};

export const extractPageConfigEdges = (pageConfigs: PageConfigDTO[]): IEdgeData[] => {
  return pageConfigs.flatMap((pageConfig) => {
    const pageLines = pageConfig.lines
      .filter((line) => line.coordRefs?.[0] && line.coordRefs?.[1])
      .map(
        (line): IEdgeData => ({
          id: `border_${line.id.toString()}`,
          sourceNodeId: `border_${line.coordRefs?.[0]?.toString()}`,
          destNodeId: `border_${line.coordRefs?.[1]?.toString()}`,
          properties: {
            locked: true,
            pointWidth: line.pointWidth ?? 1,
          },
        }),
      );

    const createNewLine = (id: string, sourceNodeId: string, destNodeId: string): IEdgeData => ({
      id,
      sourceNodeId,
      destNodeId,
      properties: {
        locked: true,
        pointWidth: 1,
      },
    });

    pageLines.push(
      createNewLine("border_9999", "border_page_no0", "border_page_no1"),
      createNewLine("border_99999", "border_page_no1", "border_page_no2"),
    );

    return pageLines;
  });
};

export interface IDiagramToPage {
  [key: number]: {
    pageRef: number | undefined;
    page: PageDTO;
  };
}

export const extractDiagramNodes = (
  diagrams: DiagramDTO[],
  lookupTbl?: IDiagramToPage | undefined,
  forPreview?: true | undefined,
): INodeData[] => {
  return diagrams.flatMap((diagram) => {
    const diagramLabelToNode = (label: LabelDTO): INodeData => {
      const baseLabelToNode = labelToNode(label);
      // Add diagram id
      return {
        ...baseLabelToNode,
        properties: {
          ...baseLabelToNode.properties,
          diagramId: diagram.id,
          parent: forPreview && `D${diagram.id}`,
        },
      };
    };

    const childDiagramLabelToNode = (label: LabelDTO, pageNumber?: string | undefined): INodeData => {
      const baseLabelToNode = labelToNode(label);
      // we replace "?" with pageNumber in label.displayText if labelType is "childDiagramPage"
      baseLabelToNode.label =
        label.labelType === "childDiagramPage" && pageNumber !== undefined
          ? label.displayText.replace("?", pageNumber.toString())
          : label.displayText;
      // Add diagram id
      return {
        ...baseLabelToNode,
        properties: {
          ...baseLabelToNode.properties,
          diagramId: diagram.id,
        },
      };
    };

    // check if diagramType starts with "userDefn"
    // system generated and user defined diagram labels are processed differently
    const isUserDefnDiagram = (diagramType: string): boolean => {
      return diagramType.startsWith("userDefn");
    };
    const diagramEntityLabels = isUserDefnDiagram(diagram.diagramType)
      ? diagram.labels.filter(notSymbol).map(diagramLabelToNode).map(setElementType(PlanElementType.LABELS))
      : diagram.labels.filter((l) => l.labelType === "diagramType").map(diagramLabelToNode);
    const childDiagLabels: INodeData[] =
      diagram.childDiagrams?.flatMap((childDiagram) => {
        const pageDetails = lookupTbl ? lookupTbl[childDiagram.diagramRef] : null;
        const pageNumber = pageDetails ? pageDetails.page.pageNumber.toString() : "?";
        return (
          childDiagram?.labels
            ?.map((label) => childDiagramLabelToNode(label, pageNumber))
            ?.map(setElementType(PlanElementType.CHILD_DIAGRAM_LABELS)) ?? []
        );
      }) ?? [];

    const coordinates = diagram.coordinates.map((coordinate): INodeData => {
      const baseCoordinate = coordinateToNode(coordinate);
      return {
        ...baseCoordinate,
        properties: {
          ...baseCoordinate.properties,
          diagramId: diagram.id,
        },
      };
    });
    const brokenLineNodes = diagram.lines
      .filter(isBrokenLine)
      .flatMap((line) => breakLineNodes(line, diagram.coordinates, diagram.id));

    const parcelLabelNodes =
      diagram.parcelLabelGroups?.flatMap((parcelLabelGroup) =>
        (parcelLabelGroup.labels ?? [])
          .filter(notSymbol)
          .map(diagramLabelToNode)
          .map(setElementType(PlanElementType.PARCEL_LABELS)),
      ) ?? [];

    const parentNode: IDiagramNodeData = {
      id: `D${diagram.id}`,
      // dummy position, actual is computed in `nodeDefinitionsFromData`
      // using the diagram parameters
      position: { x: 1, y: 1 },
      properties: {
        diagramId: diagram.id,
        elementType: PlanElementType.DIAGRAM,
        // these data define relative coordinate system (even if user has edited diagram)
        // because the user edits the scaling, not the underlying geography
        bottomRightX: diagram.bottomRightPoint.x,
        bottomRightY: diagram.bottomRightPoint.y,
        originPageX: diagram.originPageOffset.x,
        originPageY: diagram.originPageOffset.y,
        zoomScale: diagram.zoomScale,
      },
    };

    return [
      parentNode,
      ...coordinates,
      ...diagramEntityLabels,
      ...childDiagLabels,
      ...diagram.coordinateLabels.map(diagramLabelToNode).map(setElementType(PlanElementType.COORDINATE_LABELS)),
      ...diagram.lineLabels.filter(notSymbol).map(diagramLabelToNode).map(setElementType(PlanElementType.LINE_LABELS)),
      ...brokenLineNodes,
      ...parcelLabelNodes,
    ];
  });
};

export const extractDiagramEdges = (diagrams: DiagramDTO[]): IEdgeData[] => {
  return diagrams.flatMap((diagram) => {
    return diagram.lines
      .filter((line) => line.coordRefs?.[0] && line.coordRefs?.[1])
      .flatMap((line) => {
        if (isBrokenLine(line)) {
          return breakLine(line, diagram);
        } else {
          return lineToEdges(line, diagram.id);
        }
      });
  });
};

export const lineToEdges = (line: LineDTO, diagramId: number): IEdgeData[] => {
  return baseLineToEdges(line).flatMap((line) => ({
    ...line,
    properties: {
      ...line.properties,
      diagramId,
    },
  }));
};

const baseLineToEdges = (line: LineDTO): IEdgeData[] => {
  const coords = line.coordRefs;
  // zip the coordinate arrays together to create  duplicate pairs of coordinates
  // remove the first and last elements that terminate edges
  // turn the array into chunks of two
  return chunk(flatten(zip(coords, coords)).slice(1, -1), 2).map(
    // map the generated pairs of coordinates to edges
    ([sourceNodeId, destNodeId], index): IEdgeData =>
      ({
        id: `${line.id}_${index}`,
        sourceNodeId: sourceNodeId?.toString(),
        destNodeId: destNodeId?.toString(),
        properties: {
          ...getEdgeStyling(line, index),
          elementType: "lines",
          lineId: `${line.id}`,
          lineType: line.lineType,
          displayState: line.displayState,
          coordRefs: JSON.stringify(line.coordRefs),
        },
      }) as IEdgeData,
  );
};

export const BROKEN_LINE_COORD = "brokenLineCoord";

/**
 * Break a line into two parts with a gap in the middle, requires synthetic coordinates
 * ${line.id}_M1 and ${line.id}_M2 provided by breakLineNodes when building nodes to point to
 * the start and end of the gap.
 * @param line the line to break
 * @param diagram the diagram the line belongs to
 */
const breakLine = (line: LineDTO, diagram: DiagramDTO): IEdgeData[] => {
  const sourceNodeId = line.coordRefs[0]?.toString();
  const destNodeId = line.coordRefs[1]?.toString();
  if (!sourceNodeId || !destNodeId) {
    return [];
  }
  const brokenLine: IEdgeData = {
    id: `${line.id}_S`,
    sourceNodeId,
    destNodeId: `${line.id}_M1`,
    properties: {
      ...getEdgeStyling(line, 0),
      diagramId: diagram.id,
      elementType: PlanElementType.LINES,
      [BROKEN_LINE_COORD]: destNodeId,
      lineId: `${line.id}`,
      lineType: line.lineType,
      coordRefs: JSON.stringify(line.coordRefs),
    },
  };

  const brokenLine2 = {
    id: `${line.id}_E`,
    sourceNodeId: `${line.id}_M2`,
    destNodeId,
    properties: {
      ...getEdgeStyling(line, 0),
      diagramId: diagram.id,
      elementType: "lines",
      [BROKEN_LINE_COORD]: sourceNodeId,
      lineId: `${line.id}`,
      lineType: line.lineType,
      coordRefs: JSON.stringify(line.coordRefs),
    },
  } as IEdgeData;

  return [brokenLine, brokenLine2];
};

/**
 * Create two new nodes to break a line into two parts
 * @param line the line to break
 * @param coordinates the coordinates of the diagram
 * @param diagramId the id of the diagram
 */
const breakLineNodes = (line: LineDTO, coordinates: CoordinateDTO[], diagramId: number): INodeData[] => {
  const startPoint = coordinates.find((coordinate) => coordinate.id === line.coordRefs?.[0]);
  const endPoint = coordinates.find((coordinate) => coordinate.id === line.coordRefs?.[1]);

  if (!startPoint || !endPoint) {
    return [];
  }

  const startX = startPoint.position.x;
  const dx = endPoint.position.x - startX;
  const startY = startPoint.position.y;
  const dy = endPoint.position.y - startY;
  const segmentLength = Math.sqrt(dx * dx + dy * dy);
  const breakStart = segmentLength / 3.0;
  const breakEnd = (segmentLength * 2.0) / 3.0;

  const theta = Math.atan2(dy, dx);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const breakStartPosition = {
    x: startX + breakStart * cosTheta,
    y: startY + breakStart * sinTheta,
  };
  const breakEndPosition = {
    x: startX + breakEnd * cosTheta,
    y: startY + breakEnd * sinTheta,
  };
  return [
    {
      id: `${line.id}_M1`,
      position: breakStartPosition,
      label: "",
      properties: {
        diagramId: diagramId,
        elementType: PlanElementType.COORDINATES,
        invisible: true,
        lineId: `${line.id}`,
      },
    },
    {
      id: `${line.id}_M2`,
      position: breakEndPosition,
      label: "",
      properties: {
        diagramId: diagramId,
        elementType: PlanElementType.COORDINATES,
        invisible: true,
        lineId: `${line.id}`,
      },
    },
  ];
};

const isBrokenLine = (line: LineDTO): boolean =>
  line.style === LineStyle.BROKEN_SOLID1 ||
  line.style === LineStyle.BROKEN_PECK1 ||
  line.style === LineStyle.BROKEN_DOT1 ||
  line.style === LineStyle.BROKEN_DOT2;
