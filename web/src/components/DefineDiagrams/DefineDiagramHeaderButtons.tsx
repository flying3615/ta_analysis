import "./DefineDiagramsHeaderButtons.scss";

import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { PanelsContext } from "@linzjs/windows";
import { useContext } from "react";

import { CommonButtons } from "@/components/CommonButtons";
import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType";
import { useInsertDiagram } from "@/components/DefineDiagrams/useInsertDiagram";
import { ActionHeaderButton } from "@/components/Header/ActionHeaderButton";
import { VerticalSpacer } from "@/components/Header/Header";
import { LabelPreferencesPanel } from "@/components/LabelPreferencesPanel/LabelPreferencesPanel";
import { MaintainDiagramsPanel } from "@/components/MaintainDiagramsPanel/MaintainDiagramsPanel";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useConvertToRTLine } from "@/hooks/useConvertToRTLine";
import { useDefineDiagram } from "@/hooks/useDefineDiagram";
import { useEscapeKey } from "@/hooks/useEscape";
import { useRemoveDiagram } from "@/hooks/useRemoveDiagram";
import { useRemoveRtLine } from "@/hooks/useRemoveRTLine";
import { useResizeDiagram } from "@/hooks/useResizeDiagram";
import { useSelectDiagram } from "@/hooks/useSelectDiagram";
import { useTransactionId } from "@/hooks/useTransactionId";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";

const enlargeReduceDiagramActions: DefineDiagramsActionType[] = [
  "enlarge_diagram_rectangle",
  "enlarge_diagram_polygon",
  "reduce_diagram_rectangle",
  "reduce_diagram_polygon",
];

export const DefineDiagramMenuButtons = () => {
  const transactionId = useTransactionId();

  const { zoomByDelta, zoomToFit } = useContext(LolOpenLayersMapContext);

  const dispatch = useAppDispatch();
  const activeAction = useAppSelector(getActiveAction);

  const { openPanel } = useContext(PanelsContext);

  const { result: labelPreferencesAllowed, loading: splitLoading } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_LABEL_PREFERENCES,
  );
  const { result: maintainDiagramsAllowed, loading: maintainSplitLoading } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_MAINTAIN_DIAGRAM_LAYERS,
  );

  const labelPreferencesEnabled = labelPreferencesAllowed && !splitLoading;

  const { loading: insertDiagramLoading } = useInsertDiagram();

  const {
    loading: convertRtLinesLoading,
    canCovertRtLine,
    convertRtLines,
  } = useConvertToRTLine({ transactionId, enabled: activeAction === "select_rt_line" });

  const {
    loading: loadingRemoveLines,
    canRemoveRtLine,
    removeRtLines,
  } = useRemoveRtLine({ transactionId, enabled: activeAction === "select_line" });

  const { selectedDiagramIds } = useSelectDiagram({
    transactionId,
    enabled: enlargeReduceDiagramActions.includes(activeAction) || activeAction === "select_diagram",
    locked: enlargeReduceDiagramActions.includes(activeAction),
  });

  const {
    loading: removeDiagramLoading,
    canRemoveDiagram,
    removeDiagrams,
  } = useRemoveDiagram({ transactionId, selectedDiagramIds });

  const { loading: resizeDiagramLoading } = useResizeDiagram({
    transactionId,
    selectedDiagramIds,
    enabled: enlargeReduceDiagramActions.includes(activeAction),
  });

  const { disabledDiagramIds } = useDefineDiagram({
    transactionId,
  });

  const primaryDiagramTitle =
    disabledDiagramIds.includes("define_primary_diagram_rectangle") ||
    disabledDiagramIds.includes("define_primary_diagram_polygon")
      ? "Primary user defined diagrams cannot be created, as there is no boundary information included in this survey"
      : "Define primary diagram";
  const nonPrimaryDiagramTitle =
    disabledDiagramIds.includes("define_nonprimary_diagram_rectangle") ||
    disabledDiagramIds.includes("define_nonprimary_diagram_polygon")
      ? "Non Primary user defined diagrams cannot be created, as there is no boundary information included in this survey"
      : "Define non-primary diagram";
  const surveyDiagramTitle =
    disabledDiagramIds.includes("define_survey_diagram_rectangle") ||
    disabledDiagramIds.includes("define_survey_diagram_polygon")
      ? "User defined survey diagrams cannot be created, as there is no non boundary information included in this survey"
      : "Define survey diagram";
  const primaryDiagramDisabled =
    disabledDiagramIds.includes("define_primary_diagram_rectangle") ||
    disabledDiagramIds.includes("define_primary_diagram_polygon");
  const nonPrimaryDisabled =
    disabledDiagramIds.includes("define_nonprimary_diagram_rectangle") ||
    disabledDiagramIds.includes("define_nonprimary_diagram_polygon");
  const surveyDiagramDisabled =
    disabledDiagramIds.includes("define_survey_diagram_rectangle") ||
    disabledDiagramIds.includes("define_survey_diagram_polygon");

  useEscapeKey({ callback: () => dispatch(setActiveAction("idle")) });

  return (
    <>
      <ActionHeaderButton
        disabled={!canRemoveRtLine && !canRemoveDiagram}
        title="Delete selected feature(s)"
        icon="ic_delete_forever"
        onClick={() => {
          Promise.resolve()
            .then(() => {
              if (canRemoveDiagram) {
                return removeDiagrams();
              } else {
                return removeRtLines();
              }
            })
            .catch((error) => {
              console.error("An error occurred:", error);
            });
        }}
        loading={canRemoveDiagram ? removeDiagramLoading : loadingRemoveLines}
      />
      <VerticalSpacer />
      <ActionHeaderButton title="Zoom in" icon="ic_add" onClick={() => zoomByDelta(1)} />
      <ActionHeaderButton title="Zoom out" icon="ic_zoom_out" onClick={() => zoomByDelta(-1)} />
      <ActionHeaderButton title="Zoom to fit" icon="ic_zoom_centre" onClick={zoomToFit} />
      <VerticalSpacer />
      <ActionHeaderButton title="Select RT lines" action="select_rt_line" icon="ic_select_rt_lines" />
      <ActionHeaderButton
        disabled={!canCovertRtLine}
        loading={convertRtLinesLoading}
        title="Add RT lines"
        icon="ic_add_rt_lines"
        onClick={() => void convertRtLines()}
      />
      <ActionHeaderButton title="Select line" icon="ic_select_line" action="select_line" />
      <VerticalSpacer />
      <ActionHeaderButton
        title={primaryDiagramDisabled ? primaryDiagramTitle : `${primaryDiagramTitle} (Rectangle)`}
        icon="ic_define_primary_diagram_rectangle"
        action="define_primary_diagram_rectangle"
        className="DefineDiagram__Icon--primary"
        testid="tid_define_primary_diagram_rectangle"
        loading={insertDiagramLoading && activeAction.includes("define_primary_diagram_rectangle")}
        disabled={insertDiagramLoading || primaryDiagramDisabled}
      />
      <ActionHeaderButton
        title={primaryDiagramDisabled ? primaryDiagramTitle : `${primaryDiagramTitle} (Polygon)`}
        icon="ic_define_primary_diagram_polygon"
        action="define_primary_diagram_polygon"
        className="DefineDiagram__Icon--primary"
        testid="tid_define_primary_diagram_polygon"
        loading={insertDiagramLoading && activeAction.includes("define_primary_diagram_polygon")}
        disabled={insertDiagramLoading || primaryDiagramDisabled}
      />
      <ActionHeaderButton
        title={nonPrimaryDisabled ? nonPrimaryDiagramTitle : `${nonPrimaryDiagramTitle} (Rectangle)`}
        icon="ic_define_nonprimary_diagram_rectangle"
        action="define_nonprimary_diagram_rectangle"
        className="DefineDiagram__Icon--non-primary"
        testid="tid_define_nonprimary_diagram_rectangle"
        loading={insertDiagramLoading && activeAction.includes("define_nonprimary_diagram_rectangle")}
        disabled={insertDiagramLoading || nonPrimaryDisabled}
      />
      <ActionHeaderButton
        title={nonPrimaryDisabled ? nonPrimaryDiagramTitle : `${nonPrimaryDiagramTitle} (Polygon)`}
        icon="ic_define_nonprimary_diagram_polygon"
        action="define_nonprimary_diagram_polygon"
        className="DefineDiagram__Icon--non-primary"
        testid="tid_define_nonprimary_diagram_polygon"
        loading={insertDiagramLoading && activeAction.includes("define_nonprimary_diagram_polygon")}
        disabled={insertDiagramLoading || nonPrimaryDisabled}
      />
      <ActionHeaderButton
        title={surveyDiagramDisabled ? surveyDiagramTitle : `${surveyDiagramTitle} (Rectangle)`}
        icon="ic_define_survey_diagram_rectangle"
        action="define_survey_diagram_rectangle"
        className="DefineDiagram__Icon--survey"
        testid="tid_define_survey_diagram_rectangle"
        loading={insertDiagramLoading && activeAction.includes("define_survey_diagram_rectangle")}
        disabled={insertDiagramLoading || surveyDiagramDisabled}
      />
      <ActionHeaderButton
        title={surveyDiagramDisabled ? surveyDiagramTitle : `${surveyDiagramTitle} (Polygon)`}
        icon="ic_define_survey_diagram_polygon"
        action="define_survey_diagram_polygon"
        className="DefineDiagram__Icon--survey"
        testid="tid_define_survey_diagram_polygon"
        loading={insertDiagramLoading && activeAction.includes("define_survey_diagram_polygon")}
        disabled={insertDiagramLoading || surveyDiagramDisabled}
      />
      <ActionHeaderButton
        title="Select Diagrams"
        icon="ic_select_diagram"
        action="select_diagram"
        disabled={insertDiagramLoading || resizeDiagramLoading || removeDiagramLoading}
      />
      <VerticalSpacer />
      <ActionHeaderButton
        title={
          selectedDiagramIds.length <= 1
            ? "Enlarge diagram (Rectangle)"
            : "To enlarge a diagram, select only one diagram"
        }
        icon="ic_zoomin_snippet_rectangle"
        action="enlarge_diagram_rectangle"
        loading={resizeDiagramLoading}
        disabled={selectedDiagramIds.length !== 1 || resizeDiagramLoading}
      />
      <ActionHeaderButton
        title={
          selectedDiagramIds.length <= 1 ? "Enlarge diagram (Polygon)" : "To enlarge a diagram, select only one diagram"
        }
        icon="ic_zoomin_snippet_polygon"
        action="enlarge_diagram_polygon"
        loading={resizeDiagramLoading}
        disabled={selectedDiagramIds.length !== 1 || resizeDiagramLoading}
      />
      <ActionHeaderButton
        title={
          selectedDiagramIds.length <= 1 ? "Reduce diagram (Rectangle)" : "To reduce a diagram, select only one diagram"
        }
        icon="ic_zoomout_snippet_rectangle"
        action="reduce_diagram_rectangle"
        loading={resizeDiagramLoading}
        disabled={selectedDiagramIds.length !== 1 || resizeDiagramLoading}
      />
      <ActionHeaderButton
        title={
          selectedDiagramIds.length <= 1 ? "Reduce diagram (Polygon)" : "To reduce a diagram, select only one diagram"
        }
        icon="ic_zoomout_snippet_polygon"
        action="reduce_diagram_polygon"
        loading={resizeDiagramLoading}
        disabled={selectedDiagramIds.length !== 1 || resizeDiagramLoading}
      />
      <div className="CommonButtons__fill" />
      <ActionHeaderButton
        title="Maintain diagram layers"
        icon="ic_layers"
        onClick={() => {
          if (maintainSplitLoading) return;
          if (!maintainDiagramsAllowed) {
            alert("Coming soon!");
            return;
          }
          openPanel("Maintain diagram layers", () => (
            <MaintainDiagramsPanel transactionId={transactionId} selectedDiagramIds={selectedDiagramIds} />
          ));
        }}
      />
      <ActionHeaderButton
        title="Label preferences"
        icon="ic_label_settings"
        onClick={() => {
          if (!labelPreferencesEnabled) {
            alert("Coming soon!");
            return;
          }
          openPanel("Label preferences", () => <LabelPreferencesPanel transactionId={transactionId} />);
          return false;
        }}
      />
      <CommonButtons />
    </>
  );
};
