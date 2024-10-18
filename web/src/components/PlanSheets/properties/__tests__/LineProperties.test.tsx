import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";
import { render, screen } from "@testing-library/react";

import LineProperties, { LinePropertiesProps } from "@/components/PlanSheets/properties/LineProperties";

const mockProps: LinePropertiesProps = {
  displayState: DisplayStateEnum.display,
  lineType: "observation",
  pointWidth: 0.75,
  originalStyle: "brokenSolid1",
};

const setup = () => render(<LineProperties data={mockProps} />);

describe("LineProperties", () => {
  it("renders correctly", () => {
    setup();
    expect(screen.getByText("Visibility")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Line style")).toBeInTheDocument();
    expect(screen.getByText("Width (pts)")).toBeInTheDocument();
  });

  it("displays Visibility property", () => {
    setup();
    const checkbox = screen.getByRole("checkbox", { name: "Hide Check" });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeDisabled();
  });

  const lineTypes = ["observation", "parcelBoundary", "ctAbuttal", "userDefined", "xyz"];
  const lineTypeDisplayNames = [
    "Observation from the survey",
    "Parcel boundary not observed as part of this survey",
    "CT boundary or abuttal",
    "User",
  ];
  it.each(lineTypes)("displays Type property - %s", async (lineType: string) => {
    render(<LineProperties data={{ ...mockProps, lineType: lineType }} />);
    const expectedDisplayName = lineTypeDisplayNames[lineTypes.indexOf(lineType)] || "Unknown line type";
    const textInput = screen.getByDisplayValue(expectedDisplayName);
    expect(textInput).toBeInTheDocument();
    expect(textInput).toBeDisabled();
  });

  it("displays Style property", () => {
    setup();
    const radioInput = screen.getByRole("radio", { name: "brokenSolid1" });
    expect(radioInput).toBeInTheDocument();
    expect(radioInput).toBeDisabled();
  });

  it("displays Width property", () => {
    setup();
    const radioInput = screen.getByRole("radio", { name: "0.75" });
    expect(radioInput).toBeInTheDocument();
    expect(radioInput).toBeDisabled();
  });
});
