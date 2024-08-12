import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "lodash-es";
import { useCallback, useContext } from "react";

import { error32026_NonPrimaryCannotBeCreated } from "@/components/DefineDiagrams/prefabErrors";
import { ActionHeaderButton } from "@/components/Header/ActionHeaderButton.tsx";
import { ActionHeaderMenu } from "@/components/Header/ActionHeaderMenu";
import { VerticalSpacer } from "@/components/Header/Header";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useConvertToRTLine } from "@/hooks/useConvertToRTLine";
import { useEscapeKey } from "@/hooks/useEscape";
import { useRemoveRtLine } from "@/hooks/useRemoveRTLine.ts";
import { useTransactionId } from "@/hooks/useTransactionId";
import { getSurveyFeaturesQueryData } from "@/queries/surveyFeatures";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";

export const DefineDiagramMenuButtons = () => {
  const queryClient = useQueryClient();
  const { showPrefabModal } = useLuiModalPrefab();
  const transactionId = useTransactionId();

  const { zoomByDelta, zoomToFit } = useContext(LolOpenLayersMapContext);

  const dispatch = useAppDispatch();
  const activeAction = useAppSelector(getActiveAction);

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

  useEscapeKey({ callback: () => dispatch(setActiveAction("idle")) });

  const checkAddNonPrimaryDiagram = useCallback(() => {
    const data = getSurveyFeaturesQueryData(queryClient, transactionId);
    if (!data) return false;

    const hasNonPrimaryParcel = !isEmpty(data.nonPrimaryParcels);
    if (!hasNonPrimaryParcel) {
      showPrefabModal(error32026_NonPrimaryCannotBeCreated);
      return false;
    }
    return true;
  }, [queryClient, showPrefabModal, transactionId]);

  return (
    <>
      <ActionHeaderButton
        disabled={!canRemoveRtLine}
        title="Delete selected"
        icon="ic_delete_forever"
        onClick={removeRtLines}
        loading={loadingRemoveLines}
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
      <ActionHeaderButton title="Draw RT boundary" icon="ic_draw_rt_bdry" disabled={true} />
      <ActionHeaderButton title="Draw abuttal" icon="ic_draw_abuttal" disabled={true} />
      <ActionHeaderButton title="Select line" icon="ic_select_line" action="select_line" />
      <VerticalSpacer />
      <ActionHeaderMenu
        title="Define primary diagram"
        defaultAction="define_primary_diagram_rectangle"
        options={[
          {
            label: "Rectangle",
            title: "Define primary diagram by rectangle",
            action: "define_primary_diagram_rectangle",
          },
          {
            label: "Polygon",
            title: "Define primary diagram by polygon",
            action: "define_primary_diagram_polygon",
          },
        ]}
      />
      <ActionHeaderMenu
        title="Define non-primary diagram"
        allowOpen={checkAddNonPrimaryDiagram}
        defaultAction="define_nonprimary_diagram_rectangle"
        options={[
          {
            label: "Rectangle",
            title: "Define non-primary diagram by rectangle",
            action: "define_nonprimary_diagram_rectangle",
          },
          {
            label: "Polygon",
            title: "Define non-primary diagram by polygon",
            action: "define_nonprimary_diagram_polygon",
          },
        ]}
      />
      <ActionHeaderMenu
        title="Define survey diagram"
        allowOpen={checkAddNonPrimaryDiagram}
        defaultAction="define_survey_diagram_rectangle"
        options={[
          {
            label: "Rectangle",
            title: "Define survey diagram by rectangle",
            action: "define_survey_diagram_rectangle",
          },
          {
            label: "Polygon",
            title: "Define survey diagram by polygon",
            action: "define_survey_diagram_polygon",
          },
        ]}
      />
      <ActionHeaderButton title="Select diagram" icon="ic_select_diagram" />
      <ActionHeaderButton title="Label diagrams" icon="ic_label_diagrams" />
      <VerticalSpacer />
      <ActionHeaderMenu
        title="Enlarge diagram"
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
        title="Reduce diagram"
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
      <ActionHeaderMenu
        title="Manage labels"
        icon="ic_manage_labels"
        options={[
          {
            label: "View labels",
            title: "View labels",
            action: "manage_labels_view_labels",
          },
          {
            label: "Polygon",
            // see https://www.figma.com/design/1BgaquDso4nMqlGAJ2bLdj/Plan-Generation-(Survey-Q)?node-id=0-1&t=w9XoSPwjxgkeJioP-0
            title: "Dynamically gen list",
            action: "manage_labels_dynamically_generate_list",
          },
        ]}
      />
    </>
  );
};
