import { LuiButton } from "@linzjs/lui";
import { Panel, PanelContent, PanelHeader, PanelsContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { within } from "@storybook/test";

import PlanElementProperty from "@/components/PlanSheets/PlanElementProperty";
import { PanelInstanceContextMock } from "@/test-utils/storybook-utils";

import LabelProperties, { LabelPropertiesProps } from "../LabelProperties";

export default {
  title: "PlanSheets/Properties/LabelPropertiesPanel/LabelPropertiesValidation",
  component: PlanElementProperty,
} as Meta<typeof PlanElementProperty>;

const PanelTemplate = ({ data }: { data: LabelPropertiesProps[] }) => {
  return (
    <PanelsContextProvider>
      <PanelInstanceContextMock>
        <Panel
          title="Label properties"
          size={{ width: 320, height: 705 }}
          position={{ x: 0, y: 0 }}
          maxWidth={320}
          minWidth={320}
          className="PlanElement-container"
          modal={true}
        >
          <PanelHeader icon="ic_format_lines_text" disablePopout={true} />
          <PanelContent>
            <LabelProperties data={data} />
            <div className="footer">
              <LuiButton onClick={() => {}} size="lg" level="tertiary">
                Cancel
              </LuiButton>
              <LuiButton disabled={true} size="lg" level="primary">
                OK
              </LuiButton>
            </div>
          </PanelContent>
        </Panel>
      </PanelInstanceContextMock>
    </PanelsContextProvider>
  );
};

type Story = StoryObj<typeof PanelTemplate>;

export const Default: Story = {
  render: PanelTemplate,
  args: { data: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Label properties")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Cancel" })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: "OK" })).toBeDisabled();
  },
};

const pageLabelBold: LabelPropertiesProps[] = [
  {
    displayState: "display",
    labelType: "userAnnotation",
    fontStyle: "boldItalic",
    label: "My label blabla",
    font: "Arial",
    fontSize: "12",
    textRotation: "0",
    borderWidth: undefined,
    textAlignment: "centerCenter",
    diagramId: undefined,
  },
];

export const PageLabelBold: Story = {
  render: PanelTemplate,
  args: { data: pageLabelBold },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText("Hide")).not.toBeChecked();
    await expect(await canvas.findByLabelText("Bold")).toBeChecked();
    await expect(await canvas.findByDisplayValue("User annotation")).toBeDisabled();
    await expect(await canvas.findByTestId("label-textarea")).toBeEnabled();
    await expect(await canvas.findByTestId("label-textarea")).toHaveValue("My label blabla");
    await expect(canvas.queryByLabelText("Hide 00")).not.toBeInTheDocument();
    await expect(await canvas.findByDisplayValue("Arial")).toBeEnabled();
    await expect(await canvas.findByDisplayValue("12")).toBeEnabled();
    canvas
      .getByTestId("button-group")
      .querySelectorAll("button")
      .forEach((button) => {
        void expect(button).toBeEnabled();
      });
    await expect(await canvas.findByLabelText("Border")).not.toBeChecked();
  },
};

const diagramLabelWithBorder: LabelPropertiesProps[] = [
  {
    displayState: "display",
    labelType: "parcelAppellation",
    fontStyle: "regular",
    label: "Lot 1",
    font: "Tahoma",
    fontSize: "14",
    textRotation: "0",
    borderWidth: "1.4",
    textAlignment: "centerCenter",
    diagramId: "1",
  },
];

export const DiagramLabelWithBorder: Story = {
  render: PanelTemplate,
  args: { data: diagramLabelWithBorder },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText("Hide")).not.toBeChecked();
    await expect(await canvas.findByLabelText("Bold")).not.toBeChecked();
    await expect(await canvas.findByDisplayValue("Parcel appellation")).toBeDisabled();
    await expect(await canvas.findByTestId("label-textarea")).toBeDisabled();
    await expect(await canvas.findByTestId("label-textarea")).toHaveValue("Lot 1");
    await expect(canvas.queryByLabelText("Hide 00")).not.toBeInTheDocument();
    await expect(await canvas.findByDisplayValue("Tahoma")).toBeEnabled();
    await expect(await canvas.findByDisplayValue("14")).toBeEnabled();
    canvas
      .getByTestId("button-group")
      .querySelectorAll("button")
      .forEach((button) => {
        void expect(button).toBeDisabled();
      });
    await expect(await canvas.findByLabelText("Border")).toBeChecked();
    await expect(await canvas.findByDisplayValue("1.4")).toBeEnabled();
  },
};

const observationBearingDiagramLabelWith00Precision: LabelPropertiesProps[] = [
  {
    displayState: "display",
    labelType: "obsBearing",
    fontStyle: "regular",
    label: "327°12'00\"",
    font: "Times New Roman",
    fontSize: "12",
    textRotation: "0",
    borderWidth: "1.4",
    textAlignment: "centerCenter",
    diagramId: "1",
  },
];

export const ObservationBearingDiagramLabelWith00Precision: Story = {
  render: PanelTemplate,
  args: { data: observationBearingDiagramLabelWith00Precision },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText("Hide")).not.toBeChecked();
    await expect(await canvas.findByLabelText("Bold")).not.toBeChecked();
    await expect(await canvas.findByDisplayValue("Observation bearing")).toBeDisabled();
    await expect(within(await canvas.findByTestId("label-text-input")).getByRole("textbox")).toBeDisabled();
    await expect(within(await canvas.findByTestId("label-text-input")).getByRole("textbox")).toHaveValue("327°12'00\"");
    await expect(await canvas.findByLabelText("Hide 00")).toBeEnabled();
    await expect(await canvas.findByDisplayValue("Times New Roman")).toBeEnabled();
    await expect(await canvas.findByDisplayValue("12")).toBeEnabled();
    canvas
      .getByTestId("button-group")
      .querySelectorAll("button")
      .forEach((button) => {
        void expect(button).toBeDisabled();
      });
    await expect(await canvas.findByLabelText("Border")).toBeChecked();
    await expect(await canvas.findByDisplayValue("1.4")).toBeEnabled();
  },
};

const observationBearingDiagramLabelWithout00Precision: LabelPropertiesProps[] = [
  {
    displayState: "display",
    labelType: "obsBearing",
    fontStyle: "regular",
    label: "327°12'59\"",
    font: "Tahoma",
    fontSize: "14",
    textRotation: "0",
    borderWidth: "1.4",
    textAlignment: "centerCenter",
    diagramId: "1",
  },
];

export const ObservationBearingDiagramLabelWithout00Precision: Story = {
  render: PanelTemplate,
  args: { data: observationBearingDiagramLabelWithout00Precision },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText("Hide")).not.toBeChecked();
    await expect(await canvas.findByLabelText("Bold")).not.toBeChecked();
    await expect(await canvas.findByDisplayValue("Observation bearing")).toBeDisabled();
    await expect(within(await canvas.findByTestId("label-text-input")).getByRole("textbox")).toBeDisabled();
    await expect(within(await canvas.findByTestId("label-text-input")).getByRole("textbox")).toHaveValue("327°12'59\"");
    await expect(await canvas.findByLabelText("Hide 00")).toBeDisabled();
    await expect(await canvas.findByDisplayValue("Tahoma")).toBeEnabled();
    await expect(await canvas.findByDisplayValue("14")).toBeEnabled();
    canvas
      .getByTestId("button-group")
      .querySelectorAll("button")
      .forEach((button) => {
        void expect(button).toBeDisabled();
      });
    await expect(await canvas.findByLabelText("Border")).toBeChecked();
    await expect(await canvas.findByDisplayValue("1.4")).toBeEnabled();
  },
};

const pageAndDiagramLabelWithPartialCheckbox: LabelPropertiesProps[] = [
  {
    displayState: "display",
    labelType: "userAnnotation",
    fontStyle: "bold",
    label: "Lot 1",
    font: "Tahoma",
    fontSize: "14",
    textRotation: "0",
    borderWidth: undefined,
    textAlignment: "centerCenter",
    diagramId: undefined,
  },
  {
    displayState: "display",
    labelType: "parcelAppellation",
    fontStyle: "regular",
    label: "Lot 1",
    font: "Tahoma",
    fontSize: "14",
    textRotation: "0",
    borderWidth: "1.4",
    textAlignment: "centerCenter",
    diagramId: "1",
  },
];

export const PageAndDiagramLabelWithPartialCheckbox: Story = {
  render: PanelTemplate,
  args: { data: pageAndDiagramLabelWithPartialCheckbox },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText("Bold")).toBeChecked();
    await expect(await canvas.findByLabelText("Border")).toBeChecked();
    await expect(await canvas.findAllByLabelText("Indeterminate Check")).toHaveLength(2);
    await expect(canvas.queryByLabelText("Hide 00")).not.toBeInTheDocument();
    await expect(await canvas.findByDisplayValue("Tahoma")).toBeEnabled();
    await expect(await canvas.findByDisplayValue("14")).toBeEnabled();
    await expect(await canvas.findByDisplayValue("0")).toBeEnabled();
    canvas
      .getByTestId("button-group")
      .querySelectorAll("button")
      .forEach((button) => {
        void expect(button).toBeDisabled();
      });
  },
};

const multiplePageLabelsWithDifferentFieldValues: LabelPropertiesProps[] = [
  {
    displayState: "display",
    labelType: "userAnnotation",
    fontStyle: "boldItalic",
    label: "My Page label 1",
    font: "Tahoma",
    fontSize: "14",
    textRotation: "1",
    borderWidth: undefined,
    textAlignment: "centerCenter",
    diagramId: undefined,
  },
  {
    displayState: "display",
    labelType: "userAnnotation",
    fontStyle: "boldItalic",
    label: "My Page label 2",
    font: "Arial",
    fontSize: "12",
    textRotation: "0",
    borderWidth: undefined,
    textAlignment: "centerCenter",
    diagramId: undefined,
  },
];

export const MultiplePageLabelsWithDifferentFieldValues: Story = {
  render: PanelTemplate,
  args: { data: multiplePageLabelsWithDifferentFieldValues },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText("Bold")).toBeChecked();
    await expect(await canvas.findByDisplayValue("User annotation")).toBeDisabled();
    await expect(await canvas.findByTestId("label-textarea")).toBeDisabled();
    await expect(await canvas.findByTestId("label-textarea")).toBeEmpty();
    await expect(canvas.queryByLabelText("Hide 00")).not.toBeInTheDocument();
    canvas
      .getByTestId("button-group")
      .querySelectorAll("button")
      .forEach((button) => {
        void expect(button).toBeEnabled();
      });
    await expect(await canvas.findByLabelText("Border")).not.toBeChecked();
  },
};

const multipleObservationBearingDiagramLabelWith00Precision: LabelPropertiesProps[] = [
  {
    displayState: "display",
    labelType: "obsBearing",
    fontStyle: "regular",
    label: "327°12'00\"",
    font: "Times New Roman",
    fontSize: "12",
    textRotation: "0",
    borderWidth: "1.4",
    textAlignment: "centerCenter",
    diagramId: "1",
  },
  {
    displayState: "display",
    labelType: "obsBearing",
    fontStyle: "regular",
    label: "57°29'00\"",
    font: "Times New Roman",
    fontSize: "12",
    textRotation: "0",
    borderWidth: "1.4",
    textAlignment: "centerCenter",
    diagramId: "1",
  },
];

export const MultipleObservationBearingDiagramLabelWith00Precision: Story = {
  render: PanelTemplate,
  args: { data: multipleObservationBearingDiagramLabelWith00Precision },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByDisplayValue("Observation bearing")).toBeDisabled();
    await expect(within(await canvas.findByTestId("label-text-input")).getByRole("textbox")).toBeDisabled();
    await expect(within(await canvas.findByTestId("label-text-input")).getByRole("textbox")).toHaveValue("");
    await expect(await canvas.findByLabelText("Hide 00")).toBeEnabled();
    canvas
      .getByTestId("button-group")
      .querySelectorAll("button")
      .forEach((button) => {
        void expect(button).toBeDisabled();
      });
  },
};

const multipleObservationBearingDiagramLabelWithAndWithout00Precision: LabelPropertiesProps[] = [
  {
    displayState: "display",
    labelType: "obsBearing",
    fontStyle: "regular",
    label: "327°12'00\"",
    font: "Times New Roman",
    fontSize: "12",
    textRotation: "0",
    borderWidth: "1.4",
    textAlignment: "centerCenter",
    diagramId: "1",
  },
  {
    displayState: "display",
    labelType: "obsBearing",
    fontStyle: "regular",
    label: "57°29'01\"",
    font: "Times New Roman",
    fontSize: "12",
    textRotation: "0",
    borderWidth: "1.4",
    textAlignment: "centerCenter",
    diagramId: "1",
  },
];

export const MultipleObservationBearingDiagramLabelWithAndWithout00Precision: Story = {
  render: PanelTemplate,
  args: { data: multipleObservationBearingDiagramLabelWithAndWithout00Precision },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByDisplayValue("Observation bearing")).toBeDisabled();
    await expect(within(await canvas.findByTestId("label-text-input")).getByRole("textbox")).toBeDisabled();
    await expect(within(await canvas.findByTestId("label-text-input")).getByRole("textbox")).toHaveValue("");
    await expect(await canvas.findByLabelText("Hide 00")).toBeDisabled();
    canvas
      .getByTestId("button-group")
      .querySelectorAll("button")
      .forEach((button) => {
        void expect(button).toBeDisabled();
      });
  },
};
