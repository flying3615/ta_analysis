import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";
import { screen } from "@testing-library/react";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import LineProperties, { LinePropertiesProps } from "@/components/PlanSheets/properties/LineProperties";
import { setupStore } from "@/redux/store";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { mockStore } from "@/test-utils/store-mock";

const mockProps: LinePropertiesProps = {
  displayState: DisplayStateEnum.display,
  lineType: "observation",
  pointWidth: 0.75,
  originalStyle: "brokenSolid1",
};
const mockReduxStore = setupStore({
  planSheets: {
    ...mockStore.planSheets,
    activeSheet: PlanSheetType.TITLE,
  },
});

const renderComponent = ({ props = [mockProps], reduxStore = mockReduxStore }) =>
  renderWithReduxProvider(<LineProperties data={props} />, { store: reduxStore });

describe("LineProperties", () => {
  it("renders correctly", () => {
    renderComponent({});
    expect(screen.getByText("Visibility")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Line style")).toBeInTheDocument();
    expect(screen.getByText("Width (pts)")).toBeInTheDocument();
  });

  it("displays Visibility property as disabled for Title sheet", () => {
    renderComponent({});
    const checkbox = screen.getByRole("checkbox", { name: "Hide Check" });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeDisabled();
  });

  it("displays Visibility property as enabled for userDefined line in Title sheet", () => {
    renderComponent({ props: [{ ...mockProps, lineType: "userDefined" }] });
    const checkbox = screen.getByRole("checkbox", { name: "Hide Check" });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeEnabled();
  });

  it("displays Visibility property as enabled for Survey sheet", () => {
    renderComponent({
      reduxStore: setupStore({
        planSheets: {
          ...mockStore.planSheets,
          activeSheet: PlanSheetType.SURVEY,
        },
      }),
    });
    const checkbox = screen.getByRole("checkbox", { name: "Hide Check" });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeEnabled();
  });

  const lineTypes = ["observation", "parcelBoundary", "ctAbuttal", "userDefined", "xyz"];
  const lineTypeDisplayNames = [
    "Observation from the survey",
    "Parcel boundary not observed as part of this survey",
    "CT boundary or abuttal",
    "User",
  ];
  it.each(lineTypes)("displays Type property - %s", (lineType: string) => {
    renderComponent({ props: [{ ...mockProps, lineType }] });
    const expectedDisplayName = lineTypeDisplayNames[lineTypes.indexOf(lineType)] || "Unknown line type";
    const textInput = screen.getByDisplayValue(expectedDisplayName);
    expect(textInput).toBeInTheDocument();
    expect(textInput).toBeDisabled();
  });

  it("displays Style property as disabled for non-userDefined line", () => {
    renderComponent({});
    const radioInput = screen.getByRole("radio", { name: "solid" });
    expect(radioInput).toBeInTheDocument();
    expect(radioInput).toBeDisabled();
  });

  it("displays Width property as disabled for non-userDefined line", () => {
    renderComponent({});
    const radioInput = screen.getByRole("radio", { name: "0.7" });
    expect(radioInput).toBeInTheDocument();
    expect(radioInput).toBeDisabled();
  });

  it("displays Style property as enabled for userDefined line", () => {
    renderComponent({ props: [{ ...mockProps, lineType: "userDefined" }] });
    const radioInput = screen.getByRole("radio", { name: "solid" });
    expect(radioInput).toBeInTheDocument();
    expect(radioInput).toBeEnabled();
  });

  it("displays Width property as enabled for userDefined line", () => {
    renderComponent({ props: [{ ...mockProps, lineType: "userDefined" }] });
    const radioInput = screen.getByRole("radio", { name: "0.7" });
    expect(radioInput).toBeInTheDocument();
    expect(radioInput).toBeEnabled();
  });
});
