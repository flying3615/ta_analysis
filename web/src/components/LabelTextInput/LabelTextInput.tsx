import "./LabelTextInput.scss";

import { LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import clsx from "clsx";
import cytoscape from "cytoscape";
import { useCallback, useMemo, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { toDisplayFont } from "@/components/CytoscapeCanvas/fontDisplayFunctions";
import { LabelTextErrorMessage } from "@/components/LabelTextInput/LabelTextErrorMessage";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import {
  cytoscapeLabelIdToPlanData,
  getCorrectedLabelPosition,
  getTextLengthErrorMessage,
  isLineBreakRestrictedEditType,
  lineBreakRestrictedInfoMessages,
  specialCharsRegex,
  textLengthLimit,
} from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useLabelTextValidation } from "@/hooks/useLabelTextValidation";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { addPageLabels, updateDiagramLabels, updatePageLabels } from "@/modules/plan/updatePlanData";
import {
  getActivePage,
  getLastUpdatedLabelStyle,
  getMaxElemIds,
  getPlanMode,
  replaceDiagrams,
  replacePage,
  updateMaxElemIds,
} from "@/redux/planSheets/planSheetsSlice";

import { LabelTextInfoMessage } from "./LabelTextInfoMessage";

export const LabelTextInput = ({
  inputPosition,
  setInputPosition,
  labelPosition,
  labelData,
}: {
  inputPosition: cytoscape.Position;
  setInputPosition: React.Dispatch<React.SetStateAction<cytoscape.Position | undefined>>;
  labelPosition?: cytoscape.Position;
  labelData?: {
    id: string;
    label: string;
    labelType: string;
    elementType?: PlanElementType;
    diagramId?: number;
  };
}) => {
  const activePage = useAppSelector(getActivePage);
  const activeDiagrams = useAppSelector(selectActiveDiagrams);
  const planMode = useAppSelector(getPlanMode);
  const lastUpdatedLabelStyle = useAppSelector(getLastUpdatedLabelStyle);
  const maxElemIds = useAppSelector(getMaxElemIds);

  const { cyto } = useCytoscapeContext();
  const container = cyto?.container();
  const cytoCoordMapper = useMemo(
    () => (container ? new CytoscapeCoordinateMapper(container, activeDiagrams) : null),
    [container, activeDiagrams],
  );

  const [labelText, setLabelText] = useState(labelData?.label ?? "");

  const { fixLabelTextWhitespace, isLabelTextValid } = useLabelTextValidation({
    originalLabelText: labelData?.label,
    labelType: labelData?.labelType,
  });

  const inputWidth = 250;

  const dispatch = useAppDispatch();

  const textLengthErrorMessage = getTextLengthErrorMessage(labelText.length - textLengthLimit);
  const [infoMessage, setInfoMessage] = useState<string>();
  const hasError = labelText.length > textLengthLimit || specialCharsRegex.test(labelText);

  const saveLabel = useCallback(() => {
    if (hasError || !activePage || !cytoCoordMapper) return;

    if (planMode === PlanMode.SelectLabel && labelData) {
      const label = cyto?.$id(labelData.id);
      if (labelText !== labelData.label) {
        if (labelData.labelType === LabelDTOLabelTypeEnum.userAnnotation) {
          const positionCoord = getCorrectedLabelPosition(cyto, cytoCoordMapper, labelData.id, "textInput", {
            displayText: labelText,
            font: toDisplayFont((label?.data("font") as string) ?? lastUpdatedLabelStyle?.font),
            fontSize: (label?.data("fontSize") as number) ?? lastUpdatedLabelStyle?.fontSize,
            id: Number(labelData.id.replace("LAB_", "")),
          });

          // User-added labels (page labels) updated text gets stored in the display_text field
          dispatch(
            replacePage({
              updatedPage: updatePageLabels(activePage, [
                positionCoord
                  ? { id: cytoscapeLabelIdToPlanData(labelData.id), displayText: labelText, position: positionCoord }
                  : { id: cytoscapeLabelIdToPlanData(labelData.id), displayText: labelText },
              ]),
            }),
          );
        } else if (isLineBreakRestrictedEditType(labelData.labelType) && labelData.diagramId) {
          const positionCoord = getCorrectedLabelPosition(cyto, cytoCoordMapper, labelData.id, "textInput", {
            editedText: labelText,
            font: toDisplayFont((label?.data("font") as string) ?? lastUpdatedLabelStyle?.font),
            fontSize: (label?.data("fontSize") as number) ?? lastUpdatedLabelStyle?.fontSize,
            id: Number(labelData.id.replace("LAB_", "")),
          });

          // Diagram labels updated text gets stored in the edited_text field
          dispatch(
            replaceDiagrams(
              updateDiagramLabels(activeDiagrams, [
                {
                  data: positionCoord
                    ? { id: cytoscapeLabelIdToPlanData(labelData.id), editedText: labelText, position: positionCoord }
                    : { id: cytoscapeLabelIdToPlanData(labelData.id), editedText: labelText },
                  type: {
                    diagramId: labelData.diagramId.toString(),
                    elementType: labelData.elementType,
                  },
                },
              ]),
            ),
          );
        }
      }
    } else if (planMode === PlanMode.AddLabel) {
      if (labelText && labelPosition) {
        const maxId = maxElemIds.find((elem) => elem.element === "Label")?.maxId;
        if (!maxId) throw Error("No maxId found");
        const newMaxId = maxId + 1;

        const positionCoord =
          getCorrectedLabelPosition(cyto, cytoCoordMapper, newMaxId.toString(), "textInput", {
            displayText: labelText,
            font: toDisplayFont(lastUpdatedLabelStyle?.font),
            fontSize: lastUpdatedLabelStyle?.fontSize,
            id: newMaxId,
            position: labelPosition,
          }) ?? cytoCoordMapper.pageLabelCytoscapeToCoord(labelPosition);

        dispatch(
          replacePage({
            updatedPage: addPageLabels(activePage, [
              {
                id: newMaxId,
                displayText: labelText,
                position: positionCoord,
                font: lastUpdatedLabelStyle?.font ?? "Tahoma",
                fontSize: lastUpdatedLabelStyle?.fontSize ?? 14,
              },
            ]),
          }),
        );
        dispatch(updateMaxElemIds({ element: "Label", maxId: newMaxId }));
      }
    }
    setLabelText("");
    setInputPosition(undefined);
  }, [
    activePage,
    activeDiagrams,
    cyto,
    cytoCoordMapper,
    dispatch,
    hasError,
    labelText,
    labelPosition,
    labelData,
    planMode,
    lastUpdatedLabelStyle,
    maxElemIds,
    setInputPosition,
  ]);

  return (
    <div
      className="LabelTextInput-container"
      style={{
        top: inputPosition.y,
        left: inputPosition.x,
      }}
    >
      <textarea
        /* eslint-disable jsx-a11y/no-autofocus */
        autoFocus
        data-testid="LabelTextInput-textarea"
        value={labelText}
        onChange={(e) => {
          const newValue = fixLabelTextWhitespace(e.target.value);
          if (isLabelTextValid(newValue)) {
            setLabelText(newValue);
            setInfoMessage(undefined);
          } else {
            labelData?.labelType && setInfoMessage(lineBreakRestrictedInfoMessages[labelData.labelType]);
          }
        }}
        placeholder="Enter some text"
        className={clsx("LabelTextInput", { error: hasError })}
        style={{
          width: inputWidth,
        }}
        onBlur={saveLabel}
      />
      {hasError && <LabelTextErrorMessage labelText={labelText} textLengthErrorMessage={textLengthErrorMessage} />}
      {infoMessage && <LabelTextInfoMessage infoMessage={infoMessage} />}
    </div>
  );
};
