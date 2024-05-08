import "./CytoscapeCanvas.scss";
import { useEffect, useRef } from "react";
import cytoscape, { Css } from "cytoscape";

// Temporary placeholder data
const marks: cytoscape.NodeDefinition[] = [
  { data: { id: "root", label: "" } },
  {
    data: { id: "n-1", label: "IS IX DP 7441", position: { x: 1102, y: 354 }, parent: "root" },
    selectable: true,
  },
  {
    data: { id: "n-2", label: "PEG 1 DP 4061813", position: { x: 864, y: 560 }, parent: "root" },
    selectable: true,
  },
  {
    data: { id: "n-3", label: "PEG XL DP 7441", position: { x: 392, y: 100 }, parent: "root" },
    selectable: true,
  },
  {
    data: { id: "n-4", label: "PEG XLI DP 7441", position: { x: 200, y: 398.99 }, parent: "root" },
    selectable: true,
  },
  {
    data: { id: "n-5", label: "PEG XLV DP 7441", position: { x: 719, y: 837 }, parent: "root" },
    selectable: true,
  },
];

// Temporary placeholder data
const lines: cytoscape.EdgeDefinition[] = [
  { data: { id: "e-1", label: "235°22'57.8\"\n20.379", source: "n-1", target: "n-2", textRotation: "autorotate" } },
  { data: { id: "e-2", label: "308°18'30\"\n42.19", source: "n-2", target: "n-3", textRotation: "autorotate" } },
  { data: { id: "e-3", label: "218°55'\n21.62", source: "n-3", target: "n-4", textRotation: "autorotate" } },
  { data: { id: "e-4", label: "124°21'\n44.12", source: "n-4", target: "n-5", textRotation: "autorotate" } },
  { data: { id: "e-5", label: "44°53'54.4\"\n38.304", source: "n-5", target: "n-1", textRotation: "autorotate" } },
  { data: { id: "e-6", label: "33°24'45\"\n18.64", source: "n-5", target: "n-2", textRotation: "autorotate" } },
];

const PADDING = 24;

const CytoscapeCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const cy = cytoscape({
      container: canvasRef.current,
      elements: {
        nodes: marks,
        edges: lines,
      },
      layout: {
        name: "preset",
        positions: marks.reduce(
          (acc, mark) => ({
            ...acc,
            [`${mark.data.id}`]: {
              x: mark.data?.position?.x,
              y: mark.data?.position?.y,
            },
          }),
          {},
        ),
      },
      // the stylesheet for the graph
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#666",
            label: "data(label)",
            height: 5,
            width: 5,
          },
        },
        {
          selector: "edge",
          style: {
            label: "data(label)",
            "text-wrap": "wrap",
            "text-rotation": "data(textRotation)" as Css.PropertyValueEdge<number | "autorotate">,
          },
        },
        {
          selector: "#root",
          style: {
            "background-color": "white",
            "border-color": "black",
          },
        },
      ],
    });

    // Zoom to fit when the viewport changes
    const resizeObserver = new ResizeObserver(() => {
      cy.resize();
      cy.fit(undefined, PADDING);
    });
    resizeObserver.observe(canvasRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return <section className="CytoscapeCanvas" data-testid="CytoscapeCanvas" ref={canvasRef} />;
};

export default CytoscapeCanvas;
