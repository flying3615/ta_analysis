import {
  DisplayState,
  ICartesianCoords,
  IDiagram,
  IPage,
  IPagePageTypeEnum,
  PlanResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import { last } from "lodash-es";

import { SYMBOLS_FONT } from "@/constants";

interface DiagramOptions {
  id?: number;
  originPageOffset?: ICartesianCoords;
  bottomRightPoint?: ICartesianCoords;
  diagramType?: string;
  zoomScale?: number;
  pageRef?: number;
  displayState?: DisplayState;
  listOrder?: number;
  listParentRef?: number;
  userEdited?: boolean;
  box?: boolean; // draw a box around
}

interface PageOptions {
  id?: number;
  pageType?: IPagePageTypeEnum;
  pageNumber?: number;
  userEdited?: boolean;
}

export class PlanDataBuilder {
  planData: PlanResponseDTO = {
    diagrams: [],
    pages: [],
    configs: [],
  };

  addDiagram(
    optionsOrBottomRightPoint: ICartesianCoords | DiagramOptions,
    originPageOffset: ICartesianCoords = {
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
        bottomRightPoint: optionsOrBottomRightPoint as ICartesianCoords,
        originPageOffset,
        coordinates: [],
        labels: [],
        lines: [],
        parcelLabels: [],
        coordinateLabels: [],
        lineLabels: [],
        diagramType,
        childDiagrams: [],
        listOrder: listOrder ?? newId,
        listParentRef,
        zoomScale: zoomScale ?? 300,
        pageRef: pageRef,
        displayState: DisplayState.display,
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
        coordinateLabels: [],
        lineLabels: [],
        diagramType: "sysGenPrimaryDiag",
        childDiagrams: [],
        listOrder: defaultId,
        zoomScale: 300,
        pageRef: pageRef,
        displayState: DisplayState.display,
      };

      newDiagram = {
        ...defaults,
        ...(optionsOrBottomRightPoint as IDiagram),
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

  addPage(optionsOrPageNumber: number | PageOptions): PlanDataBuilder {
    const defaults = {
      id: this.planData.pages.length + 1,
      pageNumber: this.planData.pages.length + 1,
      pageType: IPagePageTypeEnum.title,
    };
    if (typeof optionsOrPageNumber === "number") {
      this.planData.pages.push({
        ...defaults,
        pageNumber: optionsOrPageNumber,
      });
    } else {
      this.planData.pages.push({
        ...defaults,
        ...(optionsOrPageNumber as IPage),
      });
    }
    return this;
  }

  addCooordinate(id: number, position: ICartesianCoords, coordType: string = "node"): PlanDataBuilder {
    if (this.planData.diagrams.length == 0) {
      throw new Error(
        "Must add at least one Diagram via PlanDataBuilder.addDiagram() before calling PlanDataBuilder.addCoordinate()",
      );
    }

    last(this.planData.diagrams)?.coordinates?.push({
      id,
      position,
      coordType,
    });
    return this;
  }

  addLine(
    id: number,
    coordRefs: number[],
    pointWidth: number = 1.0,
    lineType: string = "observation",
    style: string = "solid",
  ): PlanDataBuilder {
    if (this.planData.diagrams.length == 0) {
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

  addSymbolLabel(id: number, displayText: string, position: ICartesianCoords, fontSize: number = 8) {
    return this.addLabel(
      "coordinateLabels",
      id,
      displayText,
      position,
      undefined,
      undefined,
      DisplayState.display,
      SYMBOLS_FONT,
      fontSize,
    );
  }

  addLabel(
    intoWhere: "labels" | "parcelLabels" | "coordinateLabels" | "lineLabels",
    id: number,
    displayText: string,
    position: ICartesianCoords,
    featureId?: number,
    featureType?: string,
    labelType: string = "markName",
    font: string = "Tahoma",
    fontSize: number = 10,
    effect: string = "none",
    displayState: DisplayState = DisplayState.display,
    symbolType: string | undefined = undefined,
    textAlignment: string | undefined = undefined,
    borderWidth: number | undefined = undefined,
  ) {
    if (this.planData.diagrams.length == 0) {
      throw new Error(
        "Must add at least one Diagram via PlanDataBuilder.addDiagram() before calling PlanDataBuilder.addLabel()",
      );
    }

    const into = last(this.planData.diagrams)?.[intoWhere];
    if (!into) {
      throw new Error(`${intoWhere} is not a label array`);
    }

    into.push({
      anchorAngle: 0,
      displayState: displayState,
      effect,
      symbolType,
      pointOffset: 0,
      rotationAngle: 0,
      userEdited: false,
      id,
      displayText,
      position,
      labelType,
      font,
      fontSize,
      featureId,
      featureType,
      textAlignment: textAlignment || "centerCenter",
      borderWidth,
    });
    return this;
  }

  addRotatedLabel(
    intoWhere: "labels" | "parcelLabels" | "coordinateLabels" | "lineLabels",
    id: number,
    displayText: string,
    position: ICartesianCoords,
    font: string = "Tahoma",
    fontSize: number = 10,
    rotationAngle: number,
    anchorAngle: number,
    pointOffset: number,
    symbolType: string | undefined = undefined,
  ) {
    if (this.planData.diagrams.length == 0) {
      throw new Error(
        "Must add at least one Diagram via PlanDataBuilder.addDiagram() before calling PlanDataBuilder.addRotatedLabel()",
      );
    }

    const into = last(this.planData.diagrams)?.[intoWhere];
    if (!into) {
      throw new Error(`${intoWhere} is not a label array`);
    }

    into.push({
      anchorAngle,
      displayState: DisplayState.display,
      effect: "none",
      pointOffset,
      rotationAngle,
      textAlignment: "centerCenter",
      userEdited: false,
      id,
      displayText,
      position,
      labelType: "markName",
      font,
      fontSize,
      symbolType,
    });
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

  build() {
    return this.planData;
  }
}
