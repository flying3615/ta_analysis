import { Meta, StoryObj } from "@storybook/react";

import { fromBuilder } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData";
import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas";
import { useMeasureText } from "@/hooks/useMeasureText";
import { extractDiagramEdges, extractDiagramNodes } from "@/modules/plan/extractGraphData";
import { getMockedStore } from "@/test-utils/store-mock";
import { withProviderDecorator } from "@/test-utils/storybook-utils";

export default {
  title: "CytoscapeCanvas/MeasureText",
  component: CytoscapeCanvas,
  decorators: [withProviderDecorator(getMockedStore("V1"))],
} as Meta<typeof useMeasureText>;

const CanvasWithMeasure = () => {
  const measureText = useMeasureText();

  const testText = "User Text";
  const textDims = measureText(testText, "Tahoma", 14);

  const xp = 23.24;
  const yp = -14.45;
  const builder = fromBuilder()
    .addCooordinate(1, { x: xp, y: yp })
    .addCooordinate(2, { x: xp, y: textDims.dy + yp })
    .addCooordinate(3, { x: xp + textDims.dx, y: textDims.dy + yp })
    .addCooordinate(4, { x: xp + textDims.dx, y: yp })

    .addLine(10, [1, 2])
    .addLine(11, [2, 3])
    .addLine(12, [3, 4])
    .addLine(13, [4, 1])

    .addLabel(
      "labels",
      100,
      testText,
      { x: xp + textDims.dx / 2, y: yp + textDims.dy / 2 },
      undefined,
      undefined,
      undefined,
      "Tahoma",
      14,
      undefined,
      undefined,
      undefined,
      "centerCenter",
    );

  const data = builder.build();

  const nodeData = extractDiagramNodes(data.diagrams);
  const edgeData = extractDiagramEdges(data.diagrams);

  return (
    <div style={{ height: "100vh" }}>
      <CytoscapeCanvas nodeData={nodeData} edgeData={edgeData} diagrams={data.diagrams} />
    </div>
  );
};

export const RendersLabelsAtMeasuredSizeInLandscape: StoryObj<typeof CytoscapeCanvas> = {
  render: () => <CanvasWithMeasure />,
  parameters: {
    viewport: {
      type: "tablet",
      defaultOrientation: "landscape",
    },
  },
};

export const RendersLabelsAtMeasuredSizeInLandscapeSliceV2: StoryObj<typeof CytoscapeCanvas> = {
  ...RendersLabelsAtMeasuredSizeInLandscape,
  name: "Renders Labels At Measured Size In Landscape SliceV2",
  decorators: [withProviderDecorator(getMockedStore("V2"))],
};

export const RendersLabelsAtMeasuredSizeInPortrait: StoryObj<typeof CytoscapeCanvas> = {
  render: () => <CanvasWithMeasure />,
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "portrait",
    },
  },
};

export const RendersLabelsAtMeasuredSizeInPortraitSliceV2: StoryObj<typeof CytoscapeCanvas> = {
  ...RendersLabelsAtMeasuredSizeInPortrait,
  name: "Renders Labels At Measured Size In Portrait SliceV2",
  decorators: [withProviderDecorator(getMockedStore("V2"))],
};
