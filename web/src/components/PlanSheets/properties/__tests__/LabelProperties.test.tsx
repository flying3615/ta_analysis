import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { expect } from "@storybook/jest";
import { fireEvent, userEvent } from "@storybook/test";
import { screen } from "@testing-library/react";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import LabelProperties, { LabelPropertiesData } from "@/components/PlanSheets/properties/LabelProperties";
import {
  isLineBreakRestrictedEditType,
  lineBreakRestrictedInfoMessages,
} from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { setupStore } from "@/redux/store";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { modifiedState, stateVersions } from "@/test-utils/store-mock";

const mockText = "Test label text\nNew line";
const mockValidLineBreakEdit = "Test label\ntext\nNew line";
const mockValidRemoveLineBreakEdit = "Test label text New line";
const mockTextContentEdit = "Test label text xx\nNew line";

const mockProps: LabelPropertiesData = {
  id: "LAB_100",
  displayState: DisplayStateEnum.display,
  labelType: LabelDTOLabelTypeEnum.parcelAppellation,
  label: mockText,
  font: "Arial",
  fontSize: "10",
  fontStyle: "regular",
  textRotation: "0",
  textAlignment: "Left",
  diagramId: "1",
  elementType: PlanElementType.PARCEL_LABELS,
  borderWidth: undefined,
  displayFormat: undefined,
};

const expectElementToBeEnabled = (element: HTMLElement, enabled: boolean) => {
  void (enabled ? expect(element).toBeEnabled() : expect(element).not.toBeEnabled());
};

const expectElementToBeInDocument = (message: string, isPresent: boolean) => {
  void (isPresent
    ? expect(screen.getByText(message)).toBeInTheDocument()
    : expect(screen.queryByText(/cannot be altered/i)).not.toBeInTheDocument());
};

describe.each(stateVersions)("labelProperties-editing label text state%s", (version) => {
  const mockReduxStore = setupStore({
    planSheets: modifiedState(
      {
        activeSheet: PlanSheetType.TITLE,
      },
      version,
    ),
  });

  const renderComponent = ({ props = [mockProps], reduxStore = mockReduxStore }) =>
    renderWithReduxProvider(
      <LabelProperties
        data={props}
        setSaveEnabled={jest.fn()}
        setSaveFunction={jest.fn()}
        cyto={{ container: jest.fn() } as unknown as cytoscape.Core}
      />,
      {
        store: reduxStore,
      },
    );

  const labelTypes = [
    {
      labelType: LabelDTOLabelTypeEnum.userAnnotation,
      elementType: PlanElementType.LABELS,
      diagramId: undefined,
      justifyEnabled: true,
      mockTextContentEditResult: mockTextContentEdit,
    },
    {
      labelType: LabelDTOLabelTypeEnum.parcelAppellation,
      elementType: PlanElementType.PARCEL_LABELS,
      diagramId: "1",
      justifyEnabled: true,
      mockTextContentEditResult: mockValidRemoveLineBreakEdit,
    },
    {
      labelType: LabelDTOLabelTypeEnum.lineDescription,
      elementType: PlanElementType.LINE_LABELS,
      diagramId: "1",
      justifyEnabled: false,
      mockTextContentEditResult: mockValidRemoveLineBreakEdit,
    },
    {
      labelType: LabelDTOLabelTypeEnum.lineLongDescription,
      elementType: PlanElementType.LINE_LABELS,
      diagramId: "1",
      justifyEnabled: false,
      mockTextContentEditResult: mockValidRemoveLineBreakEdit,
    },
    {
      labelType: LabelDTOLabelTypeEnum.markDescription,
      elementType: PlanElementType.COORDINATE_LABELS,
      diagramId: "1",
      justifyEnabled: false,
      mockTextContentEditResult: mockValidRemoveLineBreakEdit,
    },
  ];

  it.each(labelTypes)(
    "enables correct editing of labelText and Justify fields for $labelType",
    ({ labelType, elementType, diagramId, justifyEnabled }) => {
      renderComponent({ props: [{ ...mockProps, labelType, elementType, diagramId }] });
      const textArea = screen.getByTestId("label-textarea");
      const leftJustify = screen.getByText("Left");
      const centreJustify = screen.getByText("Center");
      const rightJustify = screen.getByText("Right");

      void expect(textArea).toBeEnabled();
      expectElementToBeEnabled(leftJustify, justifyEnabled);
      expectElementToBeEnabled(centreJustify, justifyEnabled);
      expectElementToBeEnabled(rightJustify, justifyEnabled);
    },
  );

  it.each(labelTypes)(
    "Edited Label Text is correctly validated for $labelType",
    async ({ labelType, elementType, diagramId, mockTextContentEditResult }) => {
      renderComponent({ props: [{ ...mockProps, labelType, elementType, diagramId }] });

      const textArea = screen.getByTestId("label-textarea");

      await userEvent.click(textArea);
      void fireEvent.input(textArea, { target: { value: mockValidLineBreakEdit } });
      await expect(screen.queryByText(/cannot be altered/i)).not.toBeInTheDocument();
      await expect(await screen.findByTestId("label-textarea")).toHaveValue(mockValidLineBreakEdit);

      await userEvent.click(textArea);
      void fireEvent.input(textArea, { target: { value: mockValidRemoveLineBreakEdit } });
      await expect(screen.queryByText(/cannot be altered/i)).not.toBeInTheDocument();
      await expect(await screen.findByTestId("label-textarea")).toHaveValue(mockValidRemoveLineBreakEdit);

      await userEvent.click(textArea);
      void fireEvent.input(textArea, { target: { value: mockTextContentEdit } });
      expectElementToBeInDocument(
        lineBreakRestrictedInfoMessages[labelType] ?? "Error",
        isLineBreakRestrictedEditType(labelType),
      );
      await expect(await screen.findByTestId("label-textarea")).toHaveValue(mockTextContentEditResult);
    },
  );
});
