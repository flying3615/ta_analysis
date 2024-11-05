import { CartesianCoordsDTO, LabelDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { render, screen } from "@testing-library/react";

import { useAdjustLoadedPlanData } from "@/hooks/useAdjustLoadedPlanData";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";

describe("useAdjustLoadedPlanData", () => {
  const TestAdjustLoadedPlanData = (props: {
    loadedData: PlanResponseDTO;
    expect: (adjustedData: PlanResponseDTO) => void;
  }) => {
    const adjustLoadedPlanData = useAdjustLoadedPlanData();

    const adjustedData = adjustLoadedPlanData(props.loadedData);

    props.expect(adjustedData);

    return <>Adjusted</>;
  };

  it("leaves diagrams with an offset unchanged", async () => {
    const loadedData = {
      diagrams: [
        {
          originPageOffset: {
            x: 0.015,
            y: -0.015,
          },
          labels: [],
          coordinateLabels: [],
        },
      ],
    } as unknown as PlanResponseDTO;

    render(
      <TestAdjustLoadedPlanData
        loadedData={loadedData}
        expect={(adjustedData) => expect(adjustedData).toStrictEqual(loadedData)}
      />,
    );
    expect(await screen.findByText("Adjusted")).toBeInTheDocument();
  });

  it("applies an offset where there was none", async () => {
    const loadedData = {
      diagrams: [
        {
          originPageOffset: {
            x: 0,
            y: 0,
          },
          labels: [],
          coordinateLabels: [],
        },
      ],
    } as unknown as PlanResponseDTO;

    const expectedOffsetData = {
      diagrams: [
        {
          originPageOffset: {
            x: 0.015,
            y: -0.015,
          },
          labels: [],
          coordinateLabels: [],
        },
      ],
    } as unknown as PlanResponseDTO;

    render(
      <TestAdjustLoadedPlanData
        loadedData={loadedData}
        expect={(adjustedData) => expect(adjustedData).toStrictEqual(expectedOffsetData)}
      />,
    );
    expect(await screen.findByText("Adjusted")).toBeInTheDocument();
  });

  it("applies offset and angle to an offscreen label", async () => {
    const loadedData = new PlanDataBuilder()
      .addDiagram({
        bottomRightPoint: { x: 1625.39, y: -1165.179 },
        zoomScale: 24016,
        originPageOffset: { x: 0.015, y: -0.015 },
      })
      .addLabel("labels", {
        id: 1000,
        displayText: "Diag. A",
        position: { x: 812.695, y: 0 } as CartesianCoordsDTO,
        fontSize: 14,
        textAlignment: "bottomCenter",
      } as LabelDTO)
      .build();

    render(
      <TestAdjustLoadedPlanData
        loadedData={loadedData}
        expect={(adjustedData) => {
          expect(adjustedData.diagrams[0]?.labels?.[0]?.anchorAngle).toBeCloseTo(270);
          expect(adjustedData.diagrams[0]?.labels?.[0]?.pointOffset).toBeCloseTo(2.2, 0);
        }}
      />,
    );
    expect(await screen.findByText("Adjusted")).toBeInTheDocument();
  });
});
