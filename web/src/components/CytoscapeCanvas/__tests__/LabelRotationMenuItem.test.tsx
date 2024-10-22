import { fireEvent, screen } from "@testing-library/react";
import { NodeSingular } from "cytoscape";

import { LabelRotationMenuItem } from "@/components/CytoscapeCanvas/ContextMenuItems/LabelRotationMenuItem";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { mockStore } from "@/test-utils/store-mock";

const mockedState = {
  preloadedState: { ...mockStore },
};

describe("LabelRotationMenuItem", () => {
  let targetStyles: Record<string, unknown>;
  let targetLabel: NodeSingular;

  beforeEach(() => {
    targetStyles = { "text-rotation": "0deg" };
    targetLabel = {
      data: jest.fn().mockReturnValue({ elementType: "mockElementType", id: "mockId" }),
      style: jest.fn().mockImplementation((key: string, value?: unknown) => {
        if (value !== undefined) {
          targetStyles[key] = value;
        }
        return targetStyles[key];
      }),
    } as unknown as NodeSingular;
  });

  it("renders with initial rotation value", () => {
    renderWithReduxProvider(<LabelRotationMenuItem targetLabel={targetLabel} />, mockedState);
    expect(screen.getByText("0°")).toBeInTheDocument();
  });

  it("updates rotation value when slider is moved", () => {
    renderWithReduxProvider(<LabelRotationMenuItem targetLabel={targetLabel} />, mockedState);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "45" } });
    expect(screen.getByText("45°")).toBeInTheDocument();
  });

  it("updates label style when slider is moved", () => {
    renderWithReduxProvider(<LabelRotationMenuItem targetLabel={targetLabel} />, mockedState);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "45" } });
    expect(targetLabel.style).toHaveBeenCalledWith("text-rotation", "45deg");
  });

  it("does not exceed maximum clockwise rotation", () => {
    renderWithReduxProvider(<LabelRotationMenuItem targetLabel={targetLabel} />, mockedState);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "100" } });
    expect(targetLabel.style).toHaveBeenCalledWith("text-rotation", "90deg");
  });

  it("does not exceed maximum anti-clockwise rotation", () => {
    renderWithReduxProvider(<LabelRotationMenuItem targetLabel={targetLabel} />, mockedState);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "-100" } });
    expect(targetLabel.style).toHaveBeenCalledWith("text-rotation", "-90deg");
  });

  it("converts radian values to degrees correctly", () => {
    targetLabel.style("text-rotation", "6rad");
    const expectedDegreeValue = -16;

    renderWithReduxProvider(<LabelRotationMenuItem targetLabel={targetLabel} />, mockedState);

    expect(screen.getByText(`${expectedDegreeValue}°`)).toBeInTheDocument();
  });

  it("handles values greater than 90 correctly", () => {
    targetLabel.style("text-rotation", "20rad");
    const expectedDegreeValue = 66;

    renderWithReduxProvider(<LabelRotationMenuItem targetLabel={targetLabel} />, mockedState);

    expect(screen.getByText(`${expectedDegreeValue}°`)).toBeInTheDocument();
  });
});
