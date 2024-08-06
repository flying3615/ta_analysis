import { SurveyFeaturesResponseDTO } from "@linz/survey-plan-generation-api-client";
import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "lodash-es";
import { useCallback, useContext } from "react";

import { error32026_NonPrimaryCannotBeCreated } from "@/components/DefineDiagrams/prefabErrors";
import { ActionHeaderButton } from "@/components/Header/ActionHeaderButton.tsx";
import { ActionHeaderMenu } from "@/components/Header/ActionHeaderMenu";
import { VerticalSpacer } from "@/components/Header/Header";
import { HeaderButton } from "@/components/Header/HeaderButton";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useConvertToRTLine } from "@/hooks/useConvertToRTLine";
import { useEscapeKey } from "@/hooks/useEscape";
import { useSelectExtinguishedLines } from "@/hooks/useSelectExtinguishedLines.ts";
import { useTransactionId } from "@/hooks/useTransactionId";
import { getSurveyFeaturesQueryKey } from "@/queries/surveyFeatures";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";

import { DefineDiagramMenuLabels } from "./defineDiagramsType";

export const DefineDiagramMenuButtons = () => {
  const queryClient = useQueryClient();
  const { showPrefabModal } = useLuiModalPrefab();
  const transactionId = useTransactionId();

  const { zoomByDelta, zoomToFit } = useContext(LolOpenLayersMapContext);

  const dispatch = useAppDispatch();
  const action = useAppSelector(getActiveAction);

  const { selectedExtinguishedLineIds } = useSelectExtinguishedLines({ action });
  const { convertRtLines, loading: convertRtLinesLoading } = useConvertToRTLine({
    transactionId,
    selectedExtinguishedLineIds,
  });
  // MATT const { deleteRtLines, deleteRtLinesLoading } = useDeleteRtLine({transactionId, selectedExtinguishedLines});

  useEscapeKey({ callback: () => dispatch(setActiveAction("idle")) });

  const precheckAddNonPrimaryDiagram = useCallback(() => {
    const data = queryClient.getQueryData<SurveyFeaturesResponseDTO>(getSurveyFeaturesQueryKey(transactionId));
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
      <HeaderButton
        disabled={!selectedExtinguishedLineIds}
        headerMenuLabel={DefineDiagramMenuLabels.Delete}
        headerButtonLabel="Delete selected"
        iconName="ic_delete_forever"
        onClick={() => alert("Not Yet Implemented")}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.ZoomIn}
        headerButtonLabel="Zoom in"
        iconName="ic_add"
        onClick={() => zoomByDelta(1)}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.ZoomOut}
        headerButtonLabel="Zoom out"
        iconName="ic_zoom_out"
        onClick={() => zoomByDelta(-1)}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.ZoomCentre}
        headerButtonLabel="Zoom to fit"
        iconName="ic_zoom_centre"
        onClick={() => zoomToFit()}
      />
      <VerticalSpacer />
      <ActionHeaderButton title="Select RT lines" action="select_rt_line" icon="ic_select_rt_lines" />
      <HeaderButton
        disabled={!selectedExtinguishedLineIds}
        isLoading={convertRtLinesLoading}
        headerMenuLabel={DefineDiagramMenuLabels.AddRTLines}
        headerButtonLabel="Add RT lines"
        iconName="ic_add_rt_lines"
        onClick={convertRtLines}
      />
      <HeaderButton
        disabled={true}
        headerMenuLabel={DefineDiagramMenuLabels.DrawRTBoundary}
        headerButtonLabel={DefineDiagramMenuLabels.DrawRTBoundary}
        iconName="ic_draw_rt_bdry"
        onClick={() => alert("Not Yet Implemented")}
      />
      <HeaderButton
        disabled={true}
        headerMenuLabel={DefineDiagramMenuLabels.DrawAbuttal}
        headerButtonLabel={DefineDiagramMenuLabels.DrawAbuttal}
        iconName="ic_draw_abuttal"
        onClick={() => alert("Not Yet Implemented")}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.SelectLine}
        headerButtonLabel={DefineDiagramMenuLabels.SelectLine}
        iconName="ic_select_line"
        onClick={() => alert("Not Yet Implemented")}
      />
      <VerticalSpacer />
      <ActionHeaderMenu
        title="Define primary diagram"
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
        allowOpen={precheckAddNonPrimaryDiagram}
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
        allowOpen={precheckAddNonPrimaryDiagram}
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
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.SelectDiagram}
        headerButtonLabel={DefineDiagramMenuLabels.SelectDiagram}
        iconName="ic_select_diagram"
        onClick={() => alert("Not Yet Implemented")}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.LabelDiagrams}
        headerButtonLabel={DefineDiagramMenuLabels.LabelDiagrams}
        iconName="ic_label_diagrams"
        onClick={() => alert("Not Yet Implemented")}
      />
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
