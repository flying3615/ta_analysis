import { Stylesheet } from "cytoscape";

const cytoscapeStylesheet = [
  {
    selector: "node[label][font][fontSize]",
    style: {
      "background-color": "#000000",
      label: "data(label)",
      "font-family": "data(font)",
      "font-size": "data(fontSize)",
      height: 5,
      width: 5,
    },
  },
  {
    selector: "node[label]",
    style: {
      height: 1,
      width: 1,
    },
  },
  {
    selector: "node[^label]",
    style: {
      visibility: "hidden",
      height: 1,
      width: 1,
    },
  },
  {
    selector: "edge",
    style: {
      "line-color": "#000000",
      "line-cap": "round",
      width: "data(pointWidth)",
    },
  },
  {
    selector: "edge[dashStyle]",
    style: {
      "line-style": "data(dashStyle)",
    },
  },
  {
    selector: "edge[dashPattern]",
    style: {
      "line-dash-pattern": "data(dashPattern)",
      "line-cap": "butt",
    },
  },
  {
    selector: "edge[targetArrowShape]",
    style: {
      "curve-style": "straight", // needed to render arrows
      "target-arrow-shape": "data(targetArrowShape)",
      "target-arrow-color": "#000",
    },
  },
  {
    selector: "edge[sourceArrowShape]",
    style: {
      "source-arrow-shape": "data(sourceArrowShape)",
      "source-arrow-color": "#000",
    },
  },
  {
    selector: "#root",
    style: {
      "background-color": "white",
      "border-color": "black",
    },
  },
] as Stylesheet[];

export default cytoscapeStylesheet;
