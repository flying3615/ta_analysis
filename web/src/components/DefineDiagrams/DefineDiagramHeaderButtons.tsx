import { SurveyFeaturesResponseDTO } from "@linz/survey-plan-generation-api-client";
import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { LuiIcon } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { MenuHeader, MenuItem } from "@szhsin/react-menu";
import { useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "lodash-es";
import { useCallback, useContext, useEffect, useState } from "react";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType.ts";
import { error32026_NonPrimaryCannotBeCreated } from "@/components/DefineDiagrams/prefabErrors.tsx";
import { ActionHeaderMenu } from "@/components/Header/ActionHeaderMenu.tsx";
import { VerticalSpacer } from "@/components/Header/Header";
import { HeaderButton } from "@/components/Header/HeaderButton";
import { HeaderMenu } from "@/components/Header/HeaderMenu";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { useEscapeKey } from "@/hooks/useEscape.ts";
import { useTransactionId } from "@/hooks/useTransactionId.ts";
import { getSurveyFeaturesQueryKey } from "@/queries/surveyFeatures.ts";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";

import { DefineDiagramMenuLabels } from "./defineDiagramsType";

export const DefineDiagramMenuButtons = () => {
  const queryClient = useQueryClient();
  const { showPrefabModal } = useLuiModalPrefab();
  const transactionId = useTransactionId();

  const [selectedButtonLabel, setSelectedButtonLabel] = useState("");

  const map = useContext(LolOpenLayersMapContext);

  // MATT temporary until I have removed selected button label
  const activeAction = useAppSelector(getActiveAction);
  useEffect(() => {
    if (activeAction === "idle") {
      setSelectedButtonLabel("");
    }
  }, [activeAction]);

  const dispatch = useAppDispatch();
  const changeActiveAction = (action: DefineDiagramsActionType) => () => dispatch(setActiveAction(action));

  const handleHeaderButtonClick = (label: string) => {
    setSelectedButtonLabel(label);
  };

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
        isDisabled={true}
        headerMenuLabel={DefineDiagramMenuLabels.Delete}
        iconName="ic_delete_forever"
        onClick={() => {
          handleHeaderButtonClick(DefineDiagramMenuLabels.Delete);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.ZoomIn}
        headerButtonLabel="Zoom in"
        iconName="ic_add"
        onClick={() => map.zoomByDelta(1)}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.ZoomOut}
        headerButtonLabel="Zoom out"
        iconName="ic_zoom_out"
        onClick={() => map.zoomByDelta(-1)}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.ZoomCentre}
        headerButtonLabel="Zoom to fit"
        iconName="ic_zoom_centre"
        onClick={() => {
          handleHeaderButtonClick(DefineDiagramMenuLabels.ZoomCentre);
          map.zoomToFit();
          setSelectedButtonLabel("");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.SelectRTLines}
        iconName="ic_select_rt_lines"
        onClick={() => {
          handleHeaderButtonClick(DefineDiagramMenuLabels.SelectRTLines);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.AddRTLines}
        iconName="ic_add_rt_lines"
        onClick={() => {
          handleHeaderButtonClick(DefineDiagramMenuLabels.AddRTLines);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.DrawRTBoundary}
        iconName="ic_draw_rt_bdry"
        onClick={() => {
          handleHeaderButtonClick(DefineDiagramMenuLabels.DrawRTBoundary);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.DrawAbuttal}
        iconName="ic_draw_abuttal"
        onClick={() => {
          handleHeaderButtonClick(DefineDiagramMenuLabels.DrawAbuttal);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.SelectLine}
        iconName="ic_select_line"
        onClick={() => {
          handleHeaderButtonClick(DefineDiagramMenuLabels.SelectLine);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
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
        iconName="ic_select_diagram"
        onClick={() => {
          handleHeaderButtonClick(DefineDiagramMenuLabels.SelectDiagram);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={DefineDiagramMenuLabels.LabelDiagrams}
        iconName="ic_label_diagrams"
        onClick={() => {
          handleHeaderButtonClick(DefineDiagramMenuLabels.LabelDiagrams);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <VerticalSpacer />
      <HeaderMenu
        primaryButtonLabel={DefineDiagramMenuLabels.EnlargeDiagram}
        primaryButtonIcon="ic_zoomin_snippet_rectangle"
        selectedButtonLabel={selectedButtonLabel}
        setSelectedButtonLabel={setSelectedButtonLabel}
      >
        <MenuHeader>{DefineDiagramMenuLabels.EnlargeDiagram}</MenuHeader>
        <MenuItem onClick={changeActiveAction("enlarge_diagram_rectangle")}>
          <LuiIcon name="ic_zoomin_snippet_rectangle" alt={DefineDiagramMenuLabels.EnlargeByRectangle} size="md" />
          Rectangle
        </MenuItem>
        <MenuItem onClick={changeActiveAction("enlarge_diagram_polygon")}>
          <LuiIcon name="ic_zoomin_snippet_polygon" alt={DefineDiagramMenuLabels.EnlargeByPolygon} size="md" />
          Polygon
        </MenuItem>
      </HeaderMenu>
      <HeaderMenu
        primaryButtonLabel={DefineDiagramMenuLabels.ReduceDiagram}
        primaryButtonIcon="ic_zoomout_snippet_rectangle"
        selectedButtonLabel={selectedButtonLabel}
        setSelectedButtonLabel={setSelectedButtonLabel}
      >
        <MenuHeader>{DefineDiagramMenuLabels.ReduceDiagram}</MenuHeader>
        <MenuItem>
          <LuiIcon name="ic_zoomout_snippet_rectangle" alt={DefineDiagramMenuLabels.ReduceByRectangle} size="md" />
          Rectangle
        </MenuItem>
        <MenuItem>
          <LuiIcon name="ic_zoomout_snippet_polygon" alt={DefineDiagramMenuLabels.ReduceByPolygon} size="md" />
          Polygon
        </MenuItem>
      </HeaderMenu>
      <HeaderMenu
        primaryButtonLabel={DefineDiagramMenuLabels.ManageLabels}
        primaryButtonIcon="ic_manage_labels"
        selectedButtonLabel={selectedButtonLabel}
        setSelectedButtonLabel={setSelectedButtonLabel}
      >
        <MenuHeader>View labels</MenuHeader>
        {/* see https://www.figma.com/design/1BgaquDso4nMqlGAJ2bLdj/Plan-Generation-(Survey-Q)?node-id=0-1&t=w9XoSPwjxgkeJioP-0 */}
        <MenuItem>Dynamically gen list</MenuItem>
      </HeaderMenu>
    </>
  );
};
