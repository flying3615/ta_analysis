import "./DefineDiagramsHeaderButtons.scss";

import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { useContext } from "react";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType.ts";
import { useInsertDiagram } from "@/components/DefineDiagrams/useInsertDiagram.ts";
import { ActionHeaderButton } from "@/components/Header/ActionHeaderButton.tsx";
import { ActionHeaderMenu } from "@/components/Header/ActionHeaderMenu";
import { VerticalSpacer } from "@/components/Header/Header";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useConvertToRTLine } from "@/hooks/useConvertToRTLine";
import { useDefineDiagram } from "@/hooks/useDefineDiagram";
import { useEscapeKey } from "@/hooks/useEscape";
import { useRemoveDiagram } from "@/hooks/useRemoveDiagram.ts";
import { useRemoveRtLine } from "@/hooks/useRemoveRTLine.ts";
import { useResizeDiagram } from "@/hooks/useResizeDiagram.ts";
import { useSelectDiagram } from "@/hooks/useSelectDiagram.ts";
import { useTransactionId } from "@/hooks/useTransactionId";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";

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

  useEscapeKey({ callback: () => dispatch(setActiveAction("idle")) });

  return (
    <>
      <ActionHeaderButton
        disabled={!canRemoveRtLine && !canRemoveDiagram}
        title="Delete selected feature(s)"
        icon="ic_delete_forever"
        onClick={async () => {
          try {
            if (canRemoveDiagram) {
              await removeDiagrams();
            } else {
              await removeRtLines();
            }
          } catch (error) {
            console.error("An error occurred:", error);
          }
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
        onClick={convertRtLines}
      />
      <ActionHeaderButton title="Draw RT line" icon="ic_draw_rt_bdry" disabled={true} />
      <ActionHeaderButton title="Draw abuttal" icon="ic_draw_abuttal" disabled={true} />
      <ActionHeaderButton title="Select line" icon="ic_select_line" action="select_line" />
      <VerticalSpacer />
      <ActionHeaderMenu
        title={
          disabledDiagramIds.includes("define_primary_diagram_rectangle" || "define_primary_diagram_polygon")
            ? "Primary user defined diagrams cannot be created, as there is no boundary information included in this survey"
            : "Define primary diagram"
        }
        className="DefineDiagram__Icon--primary"
        defaultAction="define_primary_diagram_rectangle"
        loading={insertDiagramLoading}
        disabled={
          insertDiagramLoading ||
          disabledDiagramIds.includes("define_primary_diagram_rectangle" || "define_primary_diagram_polygon")
        }
        options={[
          {
            label: "Rectangle",
            title: "Define primary diagram by rectangle",
            action: "define_primary_diagram_rectangle",
            iconClassName: "DefineDiagram__Icon--primary",
          },
          {
            label: "Polygon",
            title: "Define primary diagram by polygon",
            action: "define_primary_diagram_polygon",
            iconClassName: "DefineDiagram__Icon--primary",
          },
        ]}
      />
      <ActionHeaderMenu
        title={
          disabledDiagramIds.includes("define_nonprimary_diagram_rectangle" || "define_nonprimary_diagram_polygon")
            ? "Non Primary user defined diagrams cannot be created, as there is no boundary information included in this survey"
            : "Define non-primary diagram"
        }
        defaultAction="define_nonprimary_diagram_rectangle"
        loading={insertDiagramLoading}
        className="DefineDiagram__Icon--non-primary"
        disabled={
          insertDiagramLoading ||
          disabledDiagramIds.includes("define_nonprimary_diagram_rectangle" || "define_nonprimary_diagram_polygon")
        }
        options={[
          {
            label: "Rectangle",
            title: "Define non-primary diagram by rectangle",
            action: "define_nonprimary_diagram_rectangle",
            iconClassName: "DefineDiagram__Icon--non-primary",
          },
          {
            label: "Polygon",
            title: "Define non-primary diagram by polygon",
            action: "define_nonprimary_diagram_polygon",
            iconClassName: "DefineDiagram__Icon--non-primary",
          },
        ]}
      />
      <ActionHeaderMenu
        title={
          disabledDiagramIds.includes("define_survey_diagram_rectangle" || "define_survey_diagram_polygon")
            ? "User defined survey diagrams cannot be created, as there is no non boundary information included in this survey"
            : "Define survey diagram"
        }
        defaultAction="define_survey_diagram_rectangle"
        loading={insertDiagramLoading}
        className="DefineDiagram__Icon--survey"
        disabled={
          insertDiagramLoading ||
          disabledDiagramIds.includes("define_survey_diagram_rectangle" || "define_survey_diagram_polygon")
        }
        options={[
          {
            label: "Rectangle",
            title: "Define survey diagram by rectangle",
            action: "define_survey_diagram_rectangle",
            iconClassName: "DefineDiagram__Icon--survey",
          },
          {
            label: "Polygon",
            title: "Define survey diagram by polygon",
            action: "define_survey_diagram_polygon",
            iconClassName: "DefineDiagram__Icon--survey",
          },
        ]}
      />
      <ActionHeaderButton
        title="Select Diagrams"
        icon="ic_select_diagram"
        action="select_diagram"
        disabled={insertDiagramLoading || resizeDiagramLoading || removeDiagramLoading}
      />
      <VerticalSpacer />
      <ActionHeaderMenu
        title={selectedDiagramIds.length <= 1 ? "Enlarge diagram" : "To enlarge a diagram, select only one diagram"}
        disabled={selectedDiagramIds.length !== 1 || resizeDiagramLoading}
        defaultAction="enlarge_diagram_rectangle"
        loading={resizeDiagramLoading}
        options={[
          {
            label: "Rectangle",
            icon: "ic_zoomin_snippet_rectangle",
            title: "Enlarge by rectangle",
            action: "enlarge_diagram_rectangle",
          },
          {
            label: "Polygon",
            icon: "ic_zoomin_snippet_polygon",
            title: "Enlarge by polygon",
            action: "enlarge_diagram_polygon",
          },
        ]}
      />
      <ActionHeaderMenu
        title={selectedDiagramIds.length <= 1 ? "Reduce diagram" : "To reduce a diagram, select only one diagram"}
        disabled={selectedDiagramIds.length !== 1 || resizeDiagramLoading}
        defaultAction="reduce_diagram_rectangle"
        loading={resizeDiagramLoading}
        options={[
          {
            label: "Rectangle",
            icon: "ic_zoomout_snippet_rectangle",
            title: "Reduce by rectangle",
            action: "reduce_diagram_rectangle",
          },
          {
            label: "Polygon",
            icon: "ic_zoomout_snippet_polygon",
            title: "Reduce by polygon",
            action: "reduce_diagram_polygon",
          },
        ]}
      />
    </>
  );
};
