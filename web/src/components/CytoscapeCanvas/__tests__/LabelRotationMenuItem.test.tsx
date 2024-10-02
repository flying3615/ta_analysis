import { fireEvent, screen } from "@testing-library/react";
import { NodeSingular } from "cytoscape";

import { LabelRotationMenuItem } from "@/components/CytoscapeCanvas/ContextMenuItems/LabelRotationMenuItem.tsx";
import { renderWithReduxProvider } from "@/test-utils/jest-utils.tsx";
import { mockStore } from "@/test-utils/store-mock.ts";

const mockedState = {
  preloadedState: { ...mockStore },
};

describe("LabelRotationMenuItem", () => {
  let targetLabel: NodeSingular;

  beforeEach(() => {
    targetLabel = {
      data: jest.fn().mockReturnValue({ elementType: "mockElementType", id: "mockId" }),
      style: jest.fn().mockImplementation((key, value) => {
        if (value !== undefined) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          targetLabel.styles[key] = value;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return targetLabel.styles[key];
      }),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      styles: { "text-rotation": "0deg" },
    };
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const radTargetLabel = {
      data: jest.fn().mockReturnValue({ elementType: "mockElementType", id: "mockId" }),
      style: jest.fn().mockImplementation((key, value) => {
        if (value !== undefined) {
          radTargetLabel.styles[key] = value;
        }
        return radTargetLabel.styles[key];
      }),
      styles: { "text-rotation": "6rad" },
    };

    const expectedDegreeValue = -16;

    renderWithReduxProvider(<LabelRotationMenuItem targetLabel={radTargetLabel} />, mockedState);

    expect(screen.getByText(`${expectedDegreeValue}°`)).toBeInTheDocument();
  });

  it("handles values greater than 90 correctly", () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const radTargetLabel = {
      data: jest.fn().mockReturnValue({ elementType: "mockElementType", id: "mockId" }),
      style: jest.fn().mockImplementation((key, value) => {
        if (value !== undefined) {
          radTargetLabel.styles[key] = value;
        }
        return radTargetLabel.styles[key];
      }),
      styles: { "text-rotation": "20rad" },
    };
    const expectedDegreeValue = 66;

    renderWithReduxProvider(<LabelRotationMenuItem targetLabel={radTargetLabel} />, mockedState);

    expect(screen.getByText(`${expectedDegreeValue}°`)).toBeInTheDocument();
  });
});
