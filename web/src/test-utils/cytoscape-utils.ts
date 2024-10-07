type Data = Record<string, number | string | boolean>;

export const nodeSingular = (
  elementData: Record<string, number | string | boolean | Data>,
  position: { x: number; y: number } = { x: 0, y: 0 },
  style?: Record<string, string>,
  classes?: string | string[],
): cytoscape.NodeSingular => {
  return {
    group: () => "nodes",
    isNode: () => true,
    isEdge: () => false,
    data: (dataAttribute?: string) => (dataAttribute ? elementData[dataAttribute] : elementData),
    position: () => position,
    style: () => style,
    classes: () => classes,
  } as cytoscape.NodeSingular;
};

export const edgeSingular = (
  elementData: Record<string, number | string | boolean | Data>,
  classes?: string | string[],
): cytoscape.EdgeSingular => {
  return {
    group: () => "edges",
    isNode: () => false,
    isEdge: () => true,
    data: (dataAttribute?: string) => (dataAttribute ? elementData[dataAttribute] : elementData),
    classes: () => classes,
  } as cytoscape.EdgeSingular;
};
