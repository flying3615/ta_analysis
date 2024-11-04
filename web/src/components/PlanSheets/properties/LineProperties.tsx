import { DisplayStateEnum, LineDTO } from "@linz/survey-plan-generation-api-client";
import { LuiCheckboxInput, LuiRadioInput, LuiTextInput } from "@linzjs/lui";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import lineSymbolSvgs from "@/components/PlanSheets/properties/lineSymbolSvgs";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { LineStyle } from "@/modules/plan/styling";
import { updateDiagramLines, updatePageLines } from "@/modules/plan/updatePlanData";
import {
  getActivePage,
  getActiveSheet,
  getDiagrams,
  replaceDiagrams,
  replacePage,
} from "@/redux/planSheets/planSheetsSlice";

import { borderWidthOptions } from "./LabelPropertiesUtils";

interface LinePropertiesProps {
  data: LinePropertiesData[];
  setSaveFunction: React.Dispatch<React.SetStateAction<(() => void) | undefined>>;
  setSaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface LinePropertiesData {
  lineId: number;
  displayState: DisplayStateEnum;
  lineType: string;
  pointWidth: number;
  originalStyle: string;
}

type ValuesToUpdate = {
  displayState?: DisplayStateEnum;
  pointWidth?: number;
  style?: string;
};

export type LinePropsToUpdate = Pick<LineDTO, "id"> & Partial<LineDTO>;

const LineProperties = (props: LinePropertiesProps) => {
  const selectedLine = useMemo(() => props.data[0] ?? ({} as LinePropertiesData), [props.data]);

  const dispatch = useAppDispatch();
  const activeSheet = useAppSelector(getActiveSheet);
  const activePage = useAppSelector(getActivePage);
  const diagrams = useAppSelector(getDiagrams);

  const isUserDefinedLine = selectedLine.lineType === "userDefined";
  const [displayState, setDisplayState] = useState<DisplayStateEnum>(
    selectedLine.displayState || DisplayStateEnum.display,
  );
  const [lineStyle, setLineStyle] = useState(selectedLine.originalStyle);
  const [pointWidth, setPointWidth] = useState(selectedLine.pointWidth);

  const [valuesToUpdate, setValuesToUpdate] = useState<ValuesToUpdate>();

  const lineStyles = [
    LineStyle.PECK_DOT1,
    LineStyle.DOUBLE_ARROW_1,
    LineStyle.ARROW1,
    LineStyle.PECK1,
    LineStyle.SOLID,
  ];

  const onVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDisplayState = e.target.checked ? DisplayStateEnum.hide : DisplayStateEnum.display;
    setDisplayState(newDisplayState);
    setValuesToUpdate({ ...valuesToUpdate, displayState: newDisplayState });
  };

  const onLineStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLineStyle = e.target.value;
    setLineStyle(newLineStyle);
    setValuesToUpdate({ ...valuesToUpdate, style: newLineStyle });
  };

  const onPointWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPointWidth = Number(e.target.value);
    setPointWidth(newPointWidth);
    setValuesToUpdate({ ...valuesToUpdate, pointWidth: newPointWidth });
  };

  // Save function
  const save = useCallback(() => {
    if (!activePage || !valuesToUpdate) return;

    const updateLineProps = {
      ...valuesToUpdate,
      id: Number(selectedLine.lineId),
    } as LinePropsToUpdate;

    if (isUserDefinedLine) {
      dispatch(replacePage({ updatedPage: updatePageLines(activePage, [updateLineProps]) }));
    } else {
      dispatch(replaceDiagrams(updateDiagramLines(diagrams, [updateLineProps])));
    }
  }, [valuesToUpdate, activePage, diagrams, isUserDefinedLine, selectedLine, dispatch]);

  useEffect(() => {
    props.setSaveFunction(() => save);
  }, [props, save]);

  useEffect(() => {
    valuesToUpdate && props.setSaveEnabled(true);
  }, [valuesToUpdate, props]);

  // render an SVG for a specific line type
  function renderLabelFor(lineStyle: string) {
    const svgContent = lineSymbolSvgs[lineStyle] || lineSymbolSvgs[LineStyle.SOLID] || "";
    const svg = "data:image/svg+xml;utf8," + encodeURIComponent(svgContent);

    return (
      <div className="svg-container">
        <img src={svg} alt={lineStyle} className="svg-image" />
      </div>
    );
  }

  // get the display name for the line type
  function getLineTypeDisplayName(type: string) {
    switch (type) {
      case "observation":
        return "Observation from the survey";
      case "parcelBoundary":
        return "Parcel boundary not observed as part of this survey";
      case "ctAbuttal":
        return "CT boundary or abuttal";
      case "userDefined":
        return "User";
      default:
        return "Unknown line type";
    }
  }

  return (
    <div className="plan-element-properties">
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Visibility</span>
        <LuiCheckboxInput
          value="false"
          label="Hide"
          onChange={onVisibilityChange}
          isDisabled={
            !isUserDefinedLine &&
            (activeSheet === PlanSheetType.TITLE ||
              displayState === DisplayStateEnum.systemHide ||
              displayState === DisplayStateEnum.systemDisplay)
          }
          isChecked={displayState !== DisplayStateEnum.display && displayState !== DisplayStateEnum.systemDisplay}
        />
      </div>
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Type</span>
        <div title={getLineTypeDisplayName(selectedLine.lineType)}>
          <LuiTextInput
            label=""
            value={getLineTypeDisplayName(selectedLine.lineType)}
            inputProps={{ disabled: true }}
            onChange={() => false}
          />
        </div>
      </div>
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Line style</span>
        <LuiRadioInput
          options={isUserDefinedLine ? lineStyles : [lineStyle]}
          onChange={onLineStyleChange}
          isOptionDisabled={() => !isUserDefinedLine}
          selectedValue={lineStyle}
          renderLabelFor={renderLabelFor}
        />
      </div>
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Width (pts)</span>
        <LuiRadioInput
          options={isUserDefinedLine ? borderWidthOptions.map((o) => o.value) : [pointWidth.toFixed(1).toString()]}
          onChange={onPointWidthChange}
          isOptionDisabled={() => !isUserDefinedLine}
          selectedValue={pointWidth.toFixed(1).toString()}
        />
      </div>
    </div>
  );
};

export default LineProperties;
