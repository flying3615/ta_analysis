import { DisplayState, IDiagram } from "@linz/survey-plan-generation-api-client";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";

const diagramId = 1;

export const markNodes: INodeData[] = [
  {
    id: "n-1",
    label: "IS IX DP 7441",
    position: { x: 1102, y: -354 },
    properties: {
      diagramId,
      font: "Times New Roman",
      fontSize: 16,
    },
  },
  {
    id: "n-2",
    label: "PEG 1 DP 4061813",
    position: { x: 864, y: -560 },
    properties: {
      diagramId,
      fontSize: 8,
    },
  },
  {
    id: "n-3",
    label: "PEG XL DP 7441",
    position: { x: 392, y: -100 },
    properties: {
      diagramId,
      fontSize: 12,
    },
  },
  {
    id: "n-4",
    label: "PEG XLI DP 7441",
    position: { x: 200, y: -398.99 },
    properties: {
      diagramId,
    },
  },
  {
    id: "n-5",
    label: "PEG XLV DP 7441",
    position: { x: 719, y: -837 },
    properties: {
      diagramId,
    },
  },
];

export const lineEdges: IEdgeData[] = [
  {
    id: "e-1",
    label: "235°22'57.8\"\n20.379",
    sourceNodeId: "n-1",
    destNodeId: "n-2",
    properties: {
      diagramId,
      pointWidth: 2,
    },
  },
  {
    id: "e-2",
    label: "308°18'30\"\n42.19",
    sourceNodeId: "n-2",
    destNodeId: "n-3",
    properties: {
      diagramId,
      pointWidth: 1,
    },
  },
  {
    id: "e-3",
    label: "218°55'\n21.62",
    sourceNodeId: "n-3",
    destNodeId: "n-4",
    properties: {
      diagramId,
      pointWidth: 1,
    },
  },
  {
    id: "e-4",
    label: "124°21'\n44.12",
    sourceNodeId: "n-4",
    destNodeId: "n-5",
    properties: {
      diagramId,
      pointWidth: 1,
    },
  },
  {
    id: "e-5",
    label: "44°53'54.4\"\n38.304",
    sourceNodeId: "n-5",
    destNodeId: "n-1",
    properties: {
      diagramId,
      pointWidth: 2,
    },
  },
  {
    id: "e-6",
    label: "33°24'45\"\n18.64",
    sourceNodeId: "n-5",
    destNodeId: "n-2",
    properties: {
      diagramId,
      pointWidth: 1,
    },
  },
];

export const diagrams: IDiagram[] = [
  {
    id: diagramId,
    bottomRightPoint: { x: 1500, y: -1000 },
    diagramType: "sysGenPrimaryDiag",
    coordinateLabels: [],
    coordinates: [],
    labels: [],
    lineLabels: [],
    lines: [],
    originPageOffset: { x: 0, y: -0 },
    parcelLabels: [],
    listOrder: 1,
    zoomScale: 100,
    displayState: DisplayState.display,
    pageRef: 1,
  },
];

export const pageBorderNodes: INodeData[] = [
  {
    id: "border_1001",
    position: { x: 1.5, y: -1.5 },
    label: "",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1002",
    position: { x: 40.5, y: -1.5 },
    label: "",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1003",
    position: { x: 1.5, y: -26.2 },
    label: "",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1004",
    position: { x: 8.5, y: -26.2 },
    label: "",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1005",
    position: { x: 26.5, y: -26.2 },
    label: "",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1006",
    position: { x: 33.5, y: -26.2 },
    label: "",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1007",
    position: { x: 40.5, y: -26.2 },
    label: "",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1008",
    position: { x: 1.5, y: -28.2 },
    label: "8",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1009",
    position: { x: 8.5, y: -28.2 },
    label: "9",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1010",
    position: { x: 26.5, y: -28.2 },
    label: "10",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1011",
    position: { x: 33.5, y: -28.2 },
    label: "11",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_1012",
    position: { x: 40.5, y: -28.2 },
    label: "12",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },

  {
    id: "border_1013",
    position: { x: 39.55, y: -2.55 },
    label: "13",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_page_no0",
    position: { x: 37.5, y: -26.2 },
    label: "14",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_page_no1",
    position: { x: 37.5, y: -25.2 },
    label: "15",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_page_no2",
    position: { x: 40.5, y: -25.2 },
    label: "16",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10%",
      labelType: "",
    },
  },
  {
    id: "border_page_no",
    position: { x: 39.0, y: -25.7 },
    label: "T/1",
    properties: {
      coordType: "userDefined",
      featureId: 1,
      featureType: "",
      font: "Arial",
      fontSize: "10px",
      labelType: "",
    },
  },
];

export const pageBorderEdges: IEdgeData[] = [
  {
    id: "border_101",
    sourceNodeId: "border_1001",
    destNodeId: "border_1002",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_102",
    sourceNodeId: "border_1001",
    destNodeId: "border_1003",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_103",
    sourceNodeId: "border_1002",
    destNodeId: "border_1007",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_104",
    sourceNodeId: "border_1003",
    destNodeId: "border_1004",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_105",
    sourceNodeId: "border_1003",
    destNodeId: "border_1008",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_106",
    sourceNodeId: "border_1004",
    destNodeId: "border_1005",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_107",
    sourceNodeId: "border_1004",
    destNodeId: "border_1009",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_108",
    sourceNodeId: "border_1005",
    destNodeId: "border_1006",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_109",
    sourceNodeId: "border_1005",
    destNodeId: "border_1010",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_110",
    sourceNodeId: "border_1006",
    destNodeId: "border_1007",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_111",
    sourceNodeId: "border_1006",
    destNodeId: "border_1011",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_112",
    sourceNodeId: "border_1007",
    destNodeId: "border_1012",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_113",
    sourceNodeId: "border_1008",
    destNodeId: "border_1009",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_114",
    sourceNodeId: "border_1009",
    destNodeId: "border_1010",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_115",
    sourceNodeId: "border_1010",
    destNodeId: "border_1011",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_116",
    sourceNodeId: "border_1011",
    destNodeId: "border_1012",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_9999",
    sourceNodeId: "border_page_no0",
    destNodeId: "border_page_no1",
    properties: {
      pointWidth: 1,
    },
  },
  {
    id: "border_99999",
    sourceNodeId: "border_page_no1",
    destNodeId: "border_page_no2",
    properties: {
      pointWidth: 1,
    },
  },
];
