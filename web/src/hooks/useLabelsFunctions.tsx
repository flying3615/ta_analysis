import { isNil, last, round } from "lodash-es";

import { INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { LabelPropertiesData, LabelPropsToUpdate } from "@/components/PlanSheets/properties/LabelProperties";
import {
  cytoscapeLabelIdToPlanData,
  planDataLabelIdToCytoscape,
} from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { updateDiagramLabels, updatePageLabels } from "@/modules/plan/updatePlanData";
import { getActivePage, getElementTypeConfigs, replaceDiagrams, replacePage } from "@/redux/planSheets/planSheetsSlice";
import { atanDegrees360, subtractIntoDelta } from "@/util/positionUtil";

import { useAppDispatch, useAppSelector } from "./reduxHooks";

export const useLabelsFunctions = () => {
  const activeDiagrams = useAppSelector(selectActiveDiagrams);
  const activePage = useAppSelector(getActivePage);
  const elemTypeConfigs = useAppSelector(getElementTypeConfigs);
  const dispatch = useAppDispatch();

  const getDefaultElementConfig = (labelType: string) => {
    const defaultElemConfigs = elemTypeConfigs.find(
      (config) => config.element === "Label" && config.elementType === labelType,
    )?.attribDefaults;

    return {
      defaultRotationAngle: defaultElemConfigs?.find((config) => config.attribute.includes("originalRotationAngle"))
        ?.defaultValue,
      defaultPointOffset: defaultElemConfigs?.find((config) => config.attribute.includes("originalPointOffset"))
        ?.defaultValue,
      defaultAnchorAngle: defaultElemConfigs?.find((config) => config.attribute.includes("originalAnchorAngle"))
        ?.defaultValue,
    };
  };

  const getLabelOriginalLocation = (labelData: INodeDataProperties) => {
    const newObj: LabelPropsToUpdate = { id: cytoscapeLabelIdToPlanData(labelData.id) };

    const defaultElemConfig = labelData.labelType ? getDefaultElementConfig(labelData.labelType) : undefined;
    if (!defaultElemConfig) return;

    if (labelData.elementType === PlanElementType.LINE_LABELS) {
      const activeLines = activeDiagrams.flatMap((diagram) => diagram?.lines);
      const line = activeLines.find((line) => line?.id === labelData.featureId);
      const diagram = activeDiagrams.find((diagram) => diagram.id === labelData.diagramId);
      const lineStartId = line?.coordRefs?.[0] as number;
      const lineEndId = last(line?.coordRefs) as number;
      const lineStartCoord = diagram?.coordinates.find((coord) => coord.id === lineStartId);
      const lineEndCoord = diagram?.coordinates.find((coord) => coord.id === lineEndId);
      if (!lineStartCoord || !lineEndCoord) return;
      const lineAngle = round(atanDegrees360(subtractIntoDelta(lineEndCoord.position, lineStartCoord.position)), 1);
      newObj.rotationAngle = lineAngle;
      newObj.anchorAngle = lineAngle + Number(defaultElemConfig.defaultAnchorAngle);
      newObj.pointOffset = Number(defaultElemConfig.defaultPointOffset);
    } else {
      newObj.rotationAngle = Number(defaultElemConfig.defaultRotationAngle);
      newObj.anchorAngle = Number(defaultElemConfig.defaultAnchorAngle);
      newObj.pointOffset = Number(defaultElemConfig.defaultPointOffset);
    }
    return newObj;
  };

  const updateLabels = (
    labelsPropsToUpdate: LabelPropsToUpdate[],
    selectedLabelsData: INodeDataProperties[] | LabelPropertiesData[],
  ) => {
    // Update diagram labels
    const diagramLabelsToUpdate = labelsPropsToUpdate
      .filter((label) =>
        selectedLabelsData.some(
          (selectedLabel) =>
            selectedLabel.id === planDataLabelIdToCytoscape(label.id) && !isNil(selectedLabel.diagramId),
        ),
      )
      .map((label) => {
        const selectedLabel = selectedLabelsData.find(
          (selectedLabel) => selectedLabel.id === planDataLabelIdToCytoscape(label.id),
        );
        return {
          data: label,
          type: {
            elementType: selectedLabel?.elementType,
            diagramId: selectedLabel?.diagramId?.toString(),
          },
        };
      });
    diagramLabelsToUpdate.length > 0 &&
      dispatch(replaceDiagrams(updateDiagramLabels(activeDiagrams, diagramLabelsToUpdate)));

    // Update page labels (do not apply onDataChanging as it is already done in replaceDiagrams, so the undo works correctly)
    if (!activePage) return;
    const pageLabelsToUpdate = labelsPropsToUpdate.filter((label) =>
      selectedLabelsData.some(
        (selectedLabel) => selectedLabel.id === planDataLabelIdToCytoscape(label.id) && isNil(selectedLabel.diagramId),
      ),
    );
    pageLabelsToUpdate.length > 0 &&
      dispatch(
        replacePage({ updatedPage: updatePageLabels(activePage, pageLabelsToUpdate), applyOnDataChanging: false }),
      );
  };

  const setOriginalLocation = (selectedLabels: cytoscape.NodeCollection) => {
    const selectedLabelsData = selectedLabels.map((label) => label.data() as INodeDataProperties);
    const labelsOriginalLocation: LabelPropsToUpdate[] = selectedLabelsData
      .map((label) => getLabelOriginalLocation(label))
      .filter((elem) => !isNil(elem));

    updateLabels(labelsOriginalLocation, selectedLabelsData);
  };

  return {
    setOriginalLocation,
    updateLabels,
  };
};
