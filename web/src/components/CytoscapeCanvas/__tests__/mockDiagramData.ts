import { IDiagram } from "@linz/survey-plan-generation-api-client";
import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";

export const markNodes: INodeData[] = [
  {
    id: "n-1",
    label: "IS IX DP 7441",
    position: { x: 1102, y: -354 },
    diagramIndex: 0,
    properties: {
      font: "Times New Roman",
      fontSize: 16,
    },
  },
  {
    id: "n-2",
    label: "PEG 1 DP 4061813",
    position: { x: 864, y: -560 },
    diagramIndex: 0,
    properties: {
      fontSize: 8,
    },
  },
  {
    id: "n-3",
    label: "PEG XL DP 7441",
    position: { x: 392, y: -100 },
    diagramIndex: 0,
    properties: {
      fontSize: 12,
    },
  },
  {
    id: "n-4",
    label: "PEG XLI DP 7441",
    position: { x: 200, y: -398.99 },
    diagramIndex: 0,
    properties: {},
  },
  {
    id: "n-5",
    label: "PEG XLV DP 7441",
    position: { x: 719, y: -837 },
    diagramIndex: 0,
    properties: {},
  },
];

export const lineEdges: IEdgeData[] = [
  {
    id: "e-1",
    label: "235°22'57.8\"\n20.379",
    sourceNodeId: "n-1",
    destNodeId: "n-2",
    diagramIndex: 0,
    properties: { pointWidth: 2 },
  },
  {
    id: "e-2",
    label: "308°18'30\"\n42.19",
    sourceNodeId: "n-2",
    destNodeId: "n-3",
    diagramIndex: 0,
    properties: { pointWidth: 1 },
  },
  {
    id: "e-3",
    label: "218°55'\n21.62",
    sourceNodeId: "n-3",
    destNodeId: "n-4",
    diagramIndex: 0,
    properties: { pointWidth: 1 },
  },
  {
    id: "e-4",
    label: "124°21'\n44.12",
    sourceNodeId: "n-4",
    destNodeId: "n-5",
    diagramIndex: 0,
    properties: { pointWidth: 1 },
  },
  {
    id: "e-5",
    label: "44°53'54.4\"\n38.304",
    sourceNodeId: "n-5",
    destNodeId: "n-1",
    diagramIndex: 0,
    properties: { pointWidth: 2 },
  },
  {
    id: "e-6",
    label: "33°24'45\"\n18.64",
    sourceNodeId: "n-5",
    destNodeId: "n-2",
    diagramIndex: 0,
    properties: { pointWidth: 1 },
  },
];

export const diagrams: IDiagram[] = [
  {
    bottomRightPoint: { x: 1500, y: -1000 },
    diagramType: "sysGenPrimaryDiag",
    coordinateLabels: [],
    coordinates: [],
    labels: [],
    lineLabels: [],
    lines: [],
    originPageOffset: { x: 0, y: -0 },
    parcelLabels: [],
  },
];
