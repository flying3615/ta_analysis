import {
  CartesianCoordsDTO,
  CoordinateDTO,
  CoordinateDTOCoordTypeEnum,
  DiagramDTO,
  DisplayStateEnum,
  LabelDTO,
  LabelDTOLabelTypeEnum,
  LineDTO,
  PageConfigDTO,
  PageDTO,
  PageDTOPageTypeEnum,
  PlanResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import type { ConfigDataDTO } from "@linz/survey-plan-generation-api-client/src/models/ConfigDataDTO";
import { last } from "lodash-es";

import { INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { SYMBOLS_FONT } from "@/constants";

interface DiagramOptions {
  id?: number;
  originPageOffset?: CartesianCoordsDTO;
  bottomRightPoint?: CartesianCoordsDTO;
  diagramType?: string;
  zoomScale?: number;
  pageRef?: number;
  displayState?: DisplayStateEnum;
  listOrder?: number;
  listParentRef?: number;
  box?: boolean; // draw a box around
}

type IntoWhereForLabels = "labels" | "parcelLabels" | "coordinateLabels" | "lineLabels" | "childDiagramLabels";

export class PlanDataBuilder {
  planData: PlanResponseDTO = {
    diagrams: [],
    pages: [],
    configs: [],
  };

  addDiagram(
    optionsOrBottomRightPoint: CartesianCoordsDTO | DiagramOptions,
    originPageOffset: CartesianCoordsDTO = {
      x: 0,
      y: 0,
    },
    diagramType:
      | "sysGenPrimaryDiag"
      | "sysGenNonPrimaryDiag"
      | "sysGenTraverseDiag"
      | "userDefnPrimaryDiag"
      | "userDefnNonPrimaryDiag"
      | "userDefnTraverseDiag" = "userDefnPrimaryDiag",
    id?: number,
    listOrder?: number,
    listParentRef?: number,
    zoomScale?: number,
    pageRef?: number,
  ): PlanDataBuilder {
    let newDiagram;
    if (Object.prototype.hasOwnProperty.call(optionsOrBottomRightPoint, "x")) {
      const newId = id ?? this.planData.diagrams.length + 1;
      newDiagram = {
        id: newId,
        bottomRightPoint: optionsOrBottomRightPoint as CartesianCoordsDTO,
        originPageOffset,
        coordinates: [],
        labels: [],
        lines: [],
        parcelLabels: [],
        parcelLabelGroups: [],
        coordinateLabels: [],
        lineLabels: [],
        diagramType,
        childDiagrams: [],
        listOrder: listOrder ?? newId,
        listParentRef,
        zoomScale: zoomScale ?? 300,
        pageRef: pageRef,
        displayState: DisplayStateEnum.display,
      };
    } else {
      const defaultId = this.planData.diagrams.length + 1;
      const defaults = {
        id: defaultId,
        originPageOffset: { x: 0, y: 0 },
        coordinates: [],
        labels: [],
        lines: [],
        parcelLabels: [],
        parcelLabelGroups: [],
        coordinateLabels: [],
        lineLabels: [],
        diagramType: "sysGenPrimaryDiag",
        childDiagrams: [],
        listOrder: defaultId,
        zoomScale: 300,
        pageRef: pageRef,
        displayState: DisplayStateEnum.display,
      };

      newDiagram = {
        ...defaults,
        ...(optionsOrBottomRightPoint as DiagramDTO),
      };
    }
    this.planData.diagrams.push(newDiagram);

    if ((newDiagram as { box?: boolean })?.box) {
      this.addCooordinate(80000 * newDiagram.id, { x: 0, y: 0 });
      this.addCooordinate(80000 * newDiagram.id + 1, { x: 0, y: newDiagram.bottomRightPoint.y });
      this.addCooordinate(80000 * newDiagram.id + 2, newDiagram.bottomRightPoint);
      this.addCooordinate(80000 * newDiagram.id + 3, { x: newDiagram.bottomRightPoint.x, y: 0 });
      this.addLine(
        80000 * newDiagram.id + 10,
        [80000 * newDiagram.id, 80000 * newDiagram.id + 1],
        0.7,
        undefined,
        "dot1",
      );
      this.addLine(
        80000 * newDiagram.id + 11,
        [80000 * newDiagram.id + 1, 80000 * newDiagram.id + 2],
        0.7,
        undefined,
        "dot1",
      );
      this.addLine(
        80000 * newDiagram.id + 12,
        [80000 * newDiagram.id + 2, 80000 * newDiagram.id + 3],
        0.7,
        undefined,
        "dot1",
      );
      this.addLine(
        80000 * newDiagram.id + 13,
        [80000 * newDiagram.id + 3, 80000 * newDiagram.id],
        0.7,
        undefined,
        "dot1",
      );
    }

    return this;
  }

  addPage(optionsOrPageNumber: number | PageDTO): PlanDataBuilder {
    const defaults: PageDTO = {
      id: this.planData.pages.length + 1,
      pageNumber: this.planData.pages.length + 1,
      pageType: PageDTOPageTypeEnum.title,
    };
    if (typeof optionsOrPageNumber === "number") {
      this.planData.pages.push({
        ...defaults,
        pageNumber: optionsOrPageNumber,
      });
    } else {
      this.planData.pages.push({
        ...defaults,
        ...optionsOrPageNumber,
      });
    }
    return this;
  }

  addCooordinate(
    id: number,
    position: CartesianCoordsDTO,
    coordType: CoordinateDTOCoordTypeEnum = CoordinateDTOCoordTypeEnum.node,
    originalCoord?: CartesianCoordsDTO,
  ): PlanDataBuilder {
    if (this.planData.diagrams.length === 0) {
      throw new Error(
        "Must add at least one Diagram via PlanDataBuilder.addDiagram() before calling PlanDataBuilder.addCoordinate()",
      );
    }

    const coordinate: CoordinateDTO = {
      id,
      position,
      coordType,
    };

    if (originalCoord !== undefined) {
      coordinate.originalCoord = originalCoord;
    }

    last(this.planData.diagrams)?.coordinates?.push(coordinate);
    return this;
  }

  addLine(
    id: number,
    coordRefs: number[],
    pointWidth: number = 1.0,
    lineType: string = "observation",
    style: string = "solid",
  ): PlanDataBuilder {
    if (this.planData.diagrams.length === 0) {
      throw new Error(
        "Must add at least one Diagram via PlanDataBuilder.addDiagram() before calling PlanDataBuilder.addLine()",
      );
    }

    last(this.planData.diagrams)?.lines?.push({
      id,
      coordRefs,
      lineType,
      pointWidth,
      style,
    });
    return this;
  }

  addSymbolLabel(
    id: number,
    displayText: string,
    position: CartesianCoordsDTO,
    fontSize: number = 8,
    featureId: number | undefined = undefined,
  ) {
    return this.addLabel(
      "coordinateLabels",
      id,
      displayText,
      position,
      featureId,
      featureId ? "coordinate" : undefined,
      "nodeSymbol1",
      SYMBOLS_FONT,
      fontSize,
      undefined,
      DisplayStateEnum.display,
    );
  }

  addLabel(
    intoWhere: IntoWhereForLabels,
    idOrOptions: number | LabelDTO,
    displayText: string = "",
    position?: CartesianCoordsDTO,
    featureId?: INodeDataProperties["featureId"],
    featureType?: INodeDataProperties["featureType"],
    labelType: INodeDataProperties["labelType"] = "markName",
    font: string = "Tahoma",
    fontSize: number = 10,
    effect: string = "none",
    displayState: DisplayStateEnum = DisplayStateEnum.display,
    symbolType: string | undefined = undefined,
    textAlignment: string | undefined = "centerCenter",
    borderWidth: number | undefined = undefined,
    pointOffset: number = 0,
  ) {
    if (this.planData.diagrams.length === 0) {
      throw new Error(
        "Must add at least one Diagram via PlanDataBuilder.addDiagram() before calling PlanDataBuilder.addLabel()",
      );
    }

    const label =
      typeof idOrOptions === "number"
        ? {
            anchorAngle: 0,
            displayState: displayState,
            effect,
            symbolType,
            pointOffset,
            rotationAngle: 0,
            id: idOrOptions,
            displayText,
            position: position!,
            labelType: labelType,
            font,
            fontSize,
            featureId,
            featureType,
            textAlignment: textAlignment || "centerCenter",
            borderWidth,
          }
        : idOrOptions;

    if (intoWhere === "parcelLabels") {
      last(this.planData.diagrams)?.parcelLabelGroups?.push({
        id: label.id,
        labels: [label],
      });
      return this;
    }

    if (intoWhere === "childDiagramLabels") {
      label.labelType = !label.displayText.match(/See.+/)
        ? LabelDTOLabelTypeEnum.childDiagram
        : LabelDTOLabelTypeEnum.childDiagramPage;
      last(last(this.planData.diagrams)?.childDiagrams)?.labels?.push(label);
      return this;
    }

    const into = last(this.planData.diagrams)?.[intoWhere];
    if (!into) {
      throw new Error(`${intoWhere} is not a label array`);
    }

    into.push(label);
    return this;
  }

  /**
   * Adds a user defined label (aka annotation), which relates to the page. All labels like this must
   * have a type of "userAnnotation".
   */
  addUserAnnotation(label: LabelDTO) {
    if (label.labelType !== LabelDTOLabelTypeEnum.userAnnotation) {
      throw new Error(`Only labelType=${LabelDTOLabelTypeEnum.userAnnotation.valueOf()} supported`);
    }
    const targetPage = last(this.planData.pages);
    if (targetPage && targetPage.labels === undefined) {
      targetPage.labels = [];
    }
    targetPage?.labels?.push(label);
    return this;
  }

  addUserCoordinate(coordinate: CoordinateDTO) {
    if (coordinate.coordType !== CoordinateDTOCoordTypeEnum.userDefined) {
      throw new Error(
        `Only ${CoordinateDTOCoordTypeEnum.userDefined.valueOf()} coordinate types supported as a child of page`,
      );
    }
    const targetPage = last(this.planData.pages);
    if (targetPage && targetPage.coordinates === undefined) {
      targetPage.coordinates = [];
    }
    targetPage?.coordinates?.push(coordinate);
    return this;
  }

  addUserLine(line: LineDTO) {
    if (line.lineType !== CoordinateDTOCoordTypeEnum.userDefined) {
      throw new Error(`Only userDefined line types supported as a child of page`);
      // TODO: this is unlikely - CoordinateDTO?
    }
    const targetPage = last(this.planData.pages);
    if (targetPage && targetPage.lines === undefined) {
      targetPage.lines = [];
    }
    targetPage?.lines?.push(line);
    return this;
  }

  addRotatedLabel(
    intoWhere: "labels" | "parcelLabels" | "coordinateLabels" | "lineLabels",
    id: number,
    displayText: string = "",
    position?: CartesianCoordsDTO,
    font: string = "Tahoma",
    fontSize: number = 10,
    rotationAngle: number = 0,
    anchorAngle: number = 0,
    pointOffset: number = 0,
    symbolType: string | undefined = undefined,
    featureId?: number,
    featureType?: string,
  ) {
    if (this.planData.diagrams.length === 0) {
      throw new Error(
        "Must add at least one Diagram via PlanDataBuilder.addDiagram() before calling PlanDataBuilder.addRotatedLabel()",
      );
    }

    const label = {
      anchorAngle,
      displayState: DisplayStateEnum.display,
      effect: "none",
      pointOffset,
      rotationAngle,
      textAlignment: "centerCenter",
      id,
      displayText,
      position,
      labelType: LabelDTOLabelTypeEnum.markName,
      font,
      fontSize,
      symbolType,
      featureId,
      featureType,
    } as LabelDTO;

    if (intoWhere === "parcelLabels") {
      last(this.planData.diagrams)?.parcelLabelGroups?.push({
        id,
        labels: [label],
      });
      return this;
    }

    const into = last(this.planData.diagrams)?.[intoWhere];
    if (!into) {
      throw new Error(`${intoWhere} is not a label array`);
    }

    into.push(label);
    return this;
  }

  addChildDiagram({ diagramRef }: { diagramRef: number }) {
    const lasDiagram = last(this.planData.diagrams);
    lasDiagram?.childDiagrams?.push({
      diagramRef,
      labels: [],
    });
    return this;
  }

  addConfigs() {
    const pageConfigDTO: PageConfigDTO = {
      pageScale: 100,
      unprintableMargin: 1.5,
      diagramLimitOrigin: { x: 1.5, y: -1.5 },
      diagramLimitBottomRight: { x: 40.5, y: -26.2 },
      coordinates: [
        {
          id: 1001,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 1.5, y: -1.5 },
        },
        {
          id: 1002,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 40.5, y: -1.5 },
        },
        {
          id: 1003,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 1.5, y: -26.2 },
        },
        {
          id: 1004,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 8.5, y: -26.2 },
        },
        {
          id: 1005,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 26.5, y: -26.2 },
        },
        {
          id: 1006,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 33.5, y: -26.2 },
        },
        {
          id: 1007,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 40.5, y: -26.2 },
        },
        {
          id: 1008,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 1.5, y: -28.2 },
        },
        {
          id: 1009,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 8.5, y: -28.2 },
        },
        {
          id: 1010,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 26.5, y: -28.2 },
        },
        {
          id: 1011,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 33.5, y: -28.2 },
        },
        {
          id: 1012,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 40.5, y: -28.2 },
        },
        {
          id: 1013,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 38.55, y: -1.6 },
        },
        {
          id: 1014,
          coordType: CoordinateDTOCoordTypeEnum.userDefined,
          position: { x: 40.45, y: -3.5 },
        },
      ],
      lines: [
        {
          id: 101,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1001, 1002],
          pointWidth: 1,
        },
        {
          id: 102,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1001, 1003],
          pointWidth: 1,
        },
        {
          id: 103,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1002, 1007],
          pointWidth: 1,
        },
        {
          id: 104,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1003, 1004],
          pointWidth: 1,
        },
        {
          id: 105,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1003, 1008],
          pointWidth: 1,
        },
        {
          id: 106,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1004, 1005],
          pointWidth: 1,
        },
        {
          id: 107,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1004, 1009],
          pointWidth: 1,
        },
        {
          id: 108,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1005, 1006],
          pointWidth: 1,
        },
        {
          id: 109,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1005, 1010],
          pointWidth: 1,
        },
        {
          id: 110,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1006, 1007],
          pointWidth: 1,
        },
        {
          id: 111,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1006, 1011],
          pointWidth: 1,
        },
        {
          id: 112,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1007, 1012],
          pointWidth: 1,
        },
        {
          id: 113,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1008, 1009],
          pointWidth: 1,
        },
        {
          id: 114,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1009, 1010],
          pointWidth: 1,
        },
        {
          id: 115,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1010, 1011],
          pointWidth: 1,
        },
        {
          id: 116,
          lineType: CoordinateDTOCoordTypeEnum.userDefined,
          style: "solid",
          coordRefs: [1011, 1012],
          pointWidth: 1,
        },
      ],
      coordLimitOrigin: {
        x: 1.65,
        y: -1.65,
      },
      coordLimitBottomRight: {
        x: 40.35,
        y: -26.05,
      },
      images: [
        {
          imageFilePath:
            "C:\\Program Files (x86)\\Land Information New Zealand\\Landonline Workspace\\Data\\NorthArrow.bmp",
          imageOrigin: 1013,
          imageBottomRight: 1014,
        },
      ],
    };
    const pageMaxId = Math.max(...this.planData.pages.map((page) => page.id));
    const lineMaxId = Math.max(...this.planData.diagrams.flatMap((diagram) => diagram.lines.map((line) => line.id)));
    const coordinateMaxId = Math.max(
      ...this.planData.diagrams.flatMap((diagram) => diagram.coordinates.map((c) => c.id)),
    );
    const labelMaxId = Math.max(...this.planData.diagrams.flatMap((diagram) => diagram.labels.map((l) => l.id)));
    const configDataArray = [] as ConfigDataDTO[];

    const configData = {
      pageConfigs: [pageConfigDTO],
      maxElemIds: [
        {
          element: "Coordinate",
          maxId: coordinateMaxId,
        },
        {
          element: "Page",
          maxId: pageMaxId,
        },
        {
          element: "Line",
          maxId: lineMaxId,
        },
        {
          element: "Label",
          maxId: labelMaxId,
        },
      ],
    } as ConfigDataDTO;

    configDataArray.push(configData);
    this.planData.configs = configDataArray;
    return this;
  }

  build() {
    return this.planData;
  }
}
