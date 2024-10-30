import { DiagramDTO, DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { PanelsContext } from "@linzjs/windows";
import cytoscape, { CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";
import { useContext } from "react";

import { LabelRotationMenuItem } from "@/components/CytoscapeCanvas/ContextMenuItems/LabelRotationMenuItem";
import { IGraphDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu";
import PlanElementProperty, { PlanPropertyPayload } from "@/components/PlanSheets/PlanElementProperty";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { LabelPropertiesData } from "@/components/PlanSheets/properties/LabelProperties";
import { LinePropertiesProps } from "@/components/PlanSheets/properties/LineProperties";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useChangeLine } from "@/hooks/useChangeLine";
import { useChangeNode } from "@/hooks/useChangeNode";
import {
  getUpdatedDiagrams,
  restoreOriginalPosition,
  TargetPositionLookup,
} from "@/modules/plan/LookupOriginalPosition";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";
import { selectActiveDiagrams, selectLookupGraphData } from "@/modules/plan/selectGraphData";
import {
  getOriginalPositions,
  getPlanMode,
  getPreviousAttributesForDiagram,
  replaceDiagrams,
  setAlignedLabelNodeId,
  setDiagramIdToMove,
  setPlanMode,
} from "@/redux/planSheets/planSheetsSlice";

import { useDeleteLabels } from "./useDeleteLabels";
import { useDeleteLines } from "./useDeleteLines";

export const usePlanSheetsContextMenu = () => {
  const dispatch = useAppDispatch();
  const findPreviousAttributesForDiagram = useAppSelector(getPreviousAttributesForDiagram);
  const lookupGraphData = useAppSelector(selectLookupGraphData);
  const planMode = useAppSelector(getPlanMode);
  const originalPositions = useAppSelector(getOriginalPositions);
  const activeDiagrams = useAppSelector(selectActiveDiagrams);
  const { openPanel } = useContext(PanelsContext);
  const setNodeHidden = useChangeNode();
  const setLineHidden = useChangeLine();
  const deletePageLines = useDeleteLines();
  const deletePageLabels = useDeleteLabels();

  const buildDiagramMenu = (previousDiagramAttributes?: PreviousDiagramAttributes): MenuItem[] => {
    const baseDiagramMenu: MenuItem[] = [{ title: "Move to page", callback: movetoPage }];
    if (!previousDiagramAttributes) {
      return baseDiagramMenu;
    }
    if (previousDiagramAttributes?.linesAffectedByLastMove?.length > 0) {
      baseDiagramMenu.push({ title: "Select lines affected by last diagram shift", disabled: true });
    }
    if (previousDiagramAttributes?.labelsAffectedByLastMove?.length > 0) {
      baseDiagramMenu.push({ title: "Select text affected by last diagram shift", disabled: true });
    }
    return baseDiagramMenu;
  };

  const getProperties = (event: {
    target: NodeSingular | EdgeSingular | null;
    cy: cytoscape.Core | undefined;
    position?: cytoscape.Position;
  }) => {
    const { target, position, cy } = event;
    if (!cy) return;
    const elementTypes = [
      PlanElementType.LINES,
      PlanElementType.LINE_LABELS,
      PlanElementType.LABELS,
      PlanElementType.COORDINATE_LABELS,
      PlanElementType.CHILD_DIAGRAM_LABELS,
      PlanElementType.PARCEL_LABELS,
    ];
    const data = target?.data() as IGraphDataProperties;
    if (data.elementType && position && elementTypes.includes(data.elementType)) {
      const planProperty: PlanPropertyPayload =
        planMode === PlanMode.SelectLine
          ? {
              mode: PlanMode.SelectLine,
              data: cy.$("edge:selected").map((edge) => edge.data() as LinePropertiesProps),
              position: { ...position },
            }
          : {
              mode: PlanMode.SelectLabel,
              data: cy.$("node:selected").map((node) => node.data() as LabelPropertiesData),
              position: { ...position },
            };
      openPanel("Plan element property", () => <PlanElementProperty property={planProperty} />);
    }
  };

  const getAllMenuItemsForElement = (
    element: cytoscape.NodeSingular | cytoscape.EdgeSingular | cytoscape.Core,
    planElementType: PlanElementType,
    selectedCollection?: CollectionReturnValue,
  ) => {
    const lookupElementSource = (element: NodeSingular | EdgeSingular) => {
      return lookupGraphData.lookupSource(element.data("elementType") as PlanElementType, element.data("id") as string);
    };

    const lineShouldBeDisplayed = (element: NodeSingular | EdgeSingular | cytoscape.Core) => {
      return (
        !element.data("displayState") ||
        element.data("displayState") === DisplayStateEnum.display ||
        element?.data("displayState") === DisplayStateEnum.systemDisplay
      );
    };

    const originalLocation = (event: {
      target: NodeSingular | EdgeSingular | null;
      cy: cytoscape.Core | undefined;
      position?: cytoscape.Position;
    }) => {
      const { target, cy } = event;
      if (!cy || !target || !activeDiagrams || !originalPositions) return;

      const data = target.data() as Record<string, string | number | boolean | undefined>;

      const updateDiagrams = (positions: cytoscape.Position[], elementType: keyof DiagramDTO, ids: number[]) => {
        const updatedDiagrams = getUpdatedDiagrams(activeDiagrams, data, elementType, positions, ids);
        dispatch(replaceDiagrams(updatedDiagrams));
      };

      if (target.isNode?.()) {
        const position = restoreOriginalPosition(originalPositions, target.data() as TargetPositionLookup);
        if (position) updateDiagrams([position], data["elementType"] as keyof DiagramDTO, [Number(data["id"])]);
      } else if (target.isEdge?.()) {
        const coordRefs = [Number(data["source"]), Number(data["target"])];
        const positions = coordRefs
          .map((id) => {
            const newData = {
              id: id,
              elementType: PlanElementType.COORDINATES,
              diagramId: data["diagramId"],
            } as unknown as TargetPositionLookup;
            return restoreOriginalPosition(originalPositions, newData);
          })
          .filter((pos): pos is cytoscape.Position => pos !== null);
        updateDiagrams(positions, PlanElementType.COORDINATES as keyof DiagramDTO, coordRefs);
      }
    };

    const buildLineMenus = (targetLine: EdgeSingular, selectedCollection?: CollectionReturnValue): MenuItem[] => {
      return [
        { title: "Original location", callback: originalLocation },
        {
          title: "Show",
          disableWhen: (element: NodeSingular | EdgeSingular | cytoscape.Core) =>
            element.data("displayState") === DisplayStateEnum.systemHide,
          hideWhen: lineShouldBeDisplayed,
          callback: (event: { target: NodeSingular | EdgeSingular | null }) => {
            setLineHidden(event.target as EdgeSingular, false);
          },
        },
        {
          title: "Hide",
          disableWhen: (element: NodeSingular | EdgeSingular | cytoscape.Core) =>
            element.data("displayState") === DisplayStateEnum.systemDisplay,
          hideWhen: (element: NodeSingular | EdgeSingular | cytoscape.Core) => !lineShouldBeDisplayed(element),
          callback: (event: { target: NodeSingular | EdgeSingular | null }) => {
            setLineHidden(event.target as EdgeSingular, true);
          },
        },
        {
          title: "Properties",
          callback: (event) => {
            if (!event.target && selectedCollection && selectedCollection[0]) {
              getProperties({
                target: selectedCollection[0],
                cy: selectedCollection[0].cy(),
                position: event.position,
              });
            } else {
              getProperties(event);
            }
          },
        },
        {
          title: "Delete",
          className: "delete-item",
          disableWhen: () => selectedCollection?.edges().some((ele) => ele.data("lineType") !== "userDefined") ?? true,
          callback: () => {
            deletePageLines([...(selectedCollection?.edges() ?? [])]);
          },
        },
        // { title: "Cut", disabled: true },
        // { title: "Copy", disabled: true },
        // { title: "Paste", disabled: true },
        // {
        //   title: "Select",
        //   submenu: [
        //     { title: "Observation Distance", callback: getProperties },
        //     { title: "All", callback: getProperties },
        //   ],
        // },
      ];
    };

    // Which menu option to display for Show / Hide
    // inverse of the state of the actual object
    enum ShowHideMenuOptionState {
      SHOW,
      HIDE,
      SHOW_DISABLED,
      HIDE_DISABLED,
    }

    const getNodeShowState = (element: NodeSingular | EdgeSingular | cytoscape.Core): ShowHideMenuOptionState => {
      const markSymbol = lookupGraphData.findMarkSymbol(lookupElementSource(element as NodeSingular | EdgeSingular));

      // This covers the user defined line end node
      if (!markSymbol) return ShowHideMenuOptionState.SHOW_DISABLED;

      if (
        markSymbol?.displayState === DisplayStateEnum.display ||
        markSymbol?.displayState === DisplayStateEnum.systemDisplay
      ) {
        return ShowHideMenuOptionState.HIDE;
      }

      return ShowHideMenuOptionState.SHOW;
    };

    const buildLabelMenus = (targetLabel: NodeSingular, selectedCollection?: CollectionReturnValue): MenuItem[] => {
      const singleSelected = selectedCollection && selectedCollection?.size() === 1;
      return [
        { title: "Original location", callback: originalLocation },
        { title: "Show", hideWhen: (e) => getNodeShowState(e) === ShowHideMenuOptionState.HIDE },
        { title: "Properties", callback: getProperties },
        ...(singleSelected ? [{ title: "Align label to line", divider: true, callback: alignLabelToLine }] : []),
        { title: "Move to page", callback: movetoPage },
        ...(singleSelected
          ? [{ title: "Rotate label", submenu: [{ title: <LabelRotationMenuItem targetLabel={targetLabel} /> }] }]
          : []),
        { title: "Cut", divider: true, disabled: true },
        { title: "Copy", disabled: true },
        { title: "Paste", disabled: true },
        {
          title: "Delete",
          className: "delete-item",
          disableWhen: () =>
            selectedCollection?.nodes().some((ele) => ele.data("labelType") !== LabelDTOLabelTypeEnum.userAnnotation) ??
            true,
          callback: () => {
            deletePageLabels([...(selectedCollection?.nodes() ?? [])]);
          },
        },
      ];
    };

    const nodeMenus: MenuItem[] = [
      { title: "Original location", callback: originalLocation },
      {
        title: "Show",
        hideWhen: (e) =>
          [ShowHideMenuOptionState.HIDE, ShowHideMenuOptionState.HIDE_DISABLED].includes(getNodeShowState(e)),
        disableWhen: (e) => getNodeShowState(e) === ShowHideMenuOptionState.SHOW_DISABLED,
        callback: (event: { target: NodeSingular | EdgeSingular | null }) => {
          setNodeHidden(event.target, false);
        },
      },
      {
        title: "Hide",
        hideWhen: (e) =>
          [ShowHideMenuOptionState.SHOW, ShowHideMenuOptionState.SHOW_DISABLED].includes(getNodeShowState(e)),
        disableWhen: (e) => getNodeShowState(e) === ShowHideMenuOptionState.HIDE_DISABLED,
        callback: (event: { target: NodeSingular | EdgeSingular | null }) => {
          setNodeHidden(event.target, true);
        },
      },
      // { title: "Properties", callback: getProperties },
      // { title: "Cut", disabled: true },
      // { title: "Copy", disabled: true },
      // { title: "Paste", disabled: true },
    ];

    switch (planMode) {
      case PlanMode.SelectDiagram:
        if (element.data("id") == null) return undefined;
        return buildDiagramMenu(findPreviousAttributesForDiagram(element.data("diagramId") as number));
      case PlanMode.SelectLine:
        if (planElementType !== PlanElementType.LINES) return undefined;
        return buildLineMenus(element as EdgeSingular, selectedCollection);
      case PlanMode.SelectCoordinates:
        if (planElementType === PlanElementType.COORDINATES || planElementType === PlanElementType.COORDINATE_LABELS)
          return nodeMenus;
        return undefined;
      case PlanMode.SelectLabel:
        if (
          ![
            PlanElementType.LABELS,
            PlanElementType.PARCEL_LABELS,
            PlanElementType.LINE_LABELS,
            PlanElementType.COORDINATE_LABELS,
            PlanElementType.CHILD_DIAGRAM_LABELS,
          ].includes(planElementType)
        )
          return undefined;
        return buildLabelMenus(element as NodeSingular, selectedCollection);
      default:
        return undefined;
    }
  };

  const movetoPage = (event: { target: NodeSingular | EdgeSingular | null; cy: cytoscape.Core | undefined }) => {
    const diagramId = event.target?.data("diagramId") as number;
    if (!diagramId) {
      return;
    }
    dispatch(setDiagramIdToMove(diagramId));
  };

  const alignLabelToLine = (event: { target: NodeSingular | EdgeSingular | null; cy: cytoscape.Core | undefined }) => {
    if (event.target) {
      const labelNodeId = event.target.data("id") as string;
      if (!labelNodeId) return;
      dispatch(setPlanMode(PlanMode.SelectTargetLine));
      dispatch(setAlignedLabelNodeId({ nodeId: labelNodeId }));
    }
  };

  return (
    clickedElement: cytoscape.NodeSingular | cytoscape.EdgeSingular | cytoscape.Core | undefined,
    selectedCollection?: CollectionReturnValue,
  ): MenuItem[] => {
    const element = clickedElement ?? selectedCollection?.nodes()[0] ?? selectedCollection?.edges()[0] ?? undefined;
    if (!element) return [];
    const planElementType = element.data("elementType") as PlanElementType;
    return (
      getAllMenuItemsForElement(element, planElementType, selectedCollection)
        ?.map((menuItem) => ({
          ...menuItem,
          disabled: menuItem.disabled || menuItem.disableWhen?.(element),
        }))
        .filter((menuItem) => {
          return !menuItem.hideWhen?.(element);
        }) ?? []
    );
  };
};
