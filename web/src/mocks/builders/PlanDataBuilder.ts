import {
  CartesianCoordsDTO,
  DiagramDTO,
  DisplayStateEnum,
  LabelDTO,
  LabelDTOLabelTypeEnum,
  PageDTO,
  PageDTOPageTypeEnum,
  PlanResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import { last } from "lodash-es";

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
  userEdited?: boolean;
  box?: boolean; // draw a box around
}

interface PageOptions {
  id?: number;
  pageType?: PageDTOPageTypeEnum;
  pageNumber?: number;
  userEdited?: boolean;
}

type IntoWhereForLabels = "labels" | "parcelLabels" | "coordinateLabels" | "lineLabels";

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

  addPage(optionsOrPageNumber: number | PageOptions): PlanDataBuilder {
    const defaults = {
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
        ...(optionsOrPageNumber as PageDTO),
      });
    }
    return this;
  }

  addCooordinate(id: number, position: CartesianCoordsDTO, coordType: string = "node"): PlanDataBuilder {
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

  addSymbolLabel(id: number, displayText: string, position: CartesianCoordsDTO, fontSize: number = 8) {
    return this.addLabel(
      "coordinateLabels",
      id,
      displayText,
      position,
      undefined,
      undefined,
      DisplayStateEnum.display,
      SYMBOLS_FONT,
      fontSize,
    );
  }

  addLabel(
    intoWhere: IntoWhereForLabels,
    idOrOptions: number | LabelDTO,
    displayText: string = "",
    position?: CartesianCoordsDTO,
    featureId?: number,
    featureType?: string,
    labelType: string = "markName",
    font: string = "Tahoma",
    fontSize: number = 10,
    effect: string = "none",
    displayState: DisplayStateEnum = DisplayStateEnum.display,
    symbolType: string | undefined = undefined,
    textAlignment: string | undefined = undefined,
    borderWidth: number | undefined = undefined,
  ) {
    if (this.planData.diagrams.length == 0) {
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
            pointOffset: 0,
            rotationAngle: 0,
            userEdited: false,
            id: idOrOptions,
            displayText,
            position: position!,
            labelType: labelType as LabelDTOLabelTypeEnum,
            font,
            fontSize,
            featureId,
            featureType,
            textAlignment: textAlignment || "centerCenter",
            borderWidth,
          }
        : (idOrOptions as LabelDTO);

    if (intoWhere === "parcelLabels") {
      last(this.planData.diagrams)?.parcelLabelGroups?.push({
        id: label.id,
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
  ) {
    if (this.planData.diagrams.length == 0) {
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
      userEdited: false,
      id,
      displayText,
      position,
      labelType: LabelDTOLabelTypeEnum.markName,
      font,
      fontSize,
      symbolType,
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

  build() {
    return this.planData;
  }
}
