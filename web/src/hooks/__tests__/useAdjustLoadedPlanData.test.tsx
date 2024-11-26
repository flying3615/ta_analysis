import { CartesianCoordsDTO, LabelDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { render, screen } from "@testing-library/react";
import { cloneDeep } from "lodash-es";

import { CSS_PIXELS_PER_CM } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { useAdjustLoadedPlanData } from "@/hooks/useAdjustLoadedPlanData";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";

describe("useAdjustLoadedPlanData", () => {
  const TestAdjustLoadedPlanData = (props: {
    loadedData: PlanResponseDTO;
    expect: (adjustedData: PlanResponseDTO) => void;
  }) => {
    const { adjustPlanData } = useAdjustLoadedPlanData();

    const adjustedData = adjustPlanData(props.loadedData);

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
          lineLabels: undefined,
          coordinateLabels: [],
          parcelLabelGroups: undefined,
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
          lineLabels: undefined,
          coordinateLabels: [],
          parcelLabelGroups: undefined,
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

  describe("with an offscreen label", () => {
    const loadedDataOffscreen = new PlanDataBuilder()
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

    it("applies offset and angle", async () => {
      render(
        <TestAdjustLoadedPlanData
          loadedData={loadedDataOffscreen}
          expect={(adjustedData) => {
            expect(adjustedData.diagrams[0]?.labels?.[0]?.anchorAngle).toBeCloseTo(270);
            expect(adjustedData.diagrams[0]?.labels?.[0]?.pointOffset).toBeCloseTo(10.5, 0);
          }}
        />,
      );
      expect(await screen.findByText("Adjusted")).toBeInTheDocument();
    });

    test("is idempotent when adjusting label position", async () => {
      const TestAdjustLoadedPlanDataMultiple = (props: {
        loadedData: PlanResponseDTO;
        iterations: number;
        expect: (adjustedData: PlanResponseDTO, iteration: number) => boolean;
      }) => {
        const { adjustPlanData } = useAdjustLoadedPlanData();

        let data = props.loadedData;
        let n = 0;
        for (; n < props.iterations; n++) {
          data = adjustPlanData(cloneDeep(data));

          if (!props.expect(data, n)) {
            return <>Failed {n}</>;
          }
        }

        return <>Adjusted {n}</>;
      };

      render(
        <TestAdjustLoadedPlanDataMultiple
          loadedData={loadedDataOffscreen}
          iterations={3}
          expect={(adjustedData, n) => {
            // expect fails didn't stop the test here
            if (Math.abs((adjustedData.diagrams[0]?.labels?.[0]?.anchorAngle ?? 0) - 270) > 0.1) {
              console.error(`Adjusted ${n} anchorAngle: ${adjustedData.diagrams[0]?.labels?.[0]?.anchorAngle} != 270`);
              return false;
            }
            if (Math.abs((adjustedData.diagrams[0]?.labels?.[0]?.pointOffset ?? 0) - 10.5) > 0.1) {
              console.error(`Adjusted ${n} pointOffset: ${adjustedData.diagrams[0]?.labels?.[0]?.pointOffset} != 10.5`);
              return false;
            }
            return true;
          }}
        />,
      );
      expect(await screen.findByText("Adjusted 3")).toBeInTheDocument();
    }, 30000);
  });

  describe("with an offscreen line label", () => {
    const loadedDataOffscreen = new PlanDataBuilder()
      .addDiagram({
        bottomRightPoint: { x: 1625.39, y: -1165.179 },
        zoomScale: 24016,
        originPageOffset: { x: 0.015, y: -0.015 },
      })
      // A label at y==0 and rotated 90 degrees
      // should overlap the screen edge by half its width
      // so 4/2 * 14 pixels
      .addLabel("lineLabels", {
        id: 1000,
        displayText: "Line",
        position: { x: 812.695, y: 0 } as CartesianCoordsDTO,
        fontSize: 14,
        textAlignment: "centerCenter",
        anchorAngle: 0,
        pointOffset: 0,
        rotationAngle: 90,
      } as LabelDTO)
      .build();

    it("applies offset and angle to push the label inside bounds", async () => {
      render(
        <TestAdjustLoadedPlanData
          loadedData={loadedDataOffscreen}
          expect={(adjustedData) => {
            expect(adjustedData.diagrams[0]?.lineLabels?.[0]?.rotationAngle).toBeCloseTo(90);
            expect(adjustedData.diagrams[0]?.lineLabels?.[0]?.anchorAngle).toBeCloseTo(270);
            expect(adjustedData.diagrams[0]?.lineLabels?.[0]?.pointOffset).toBeCloseTo(
              ((4 / 2) * 14 * POINTS_PER_CM) / CSS_PIXELS_PER_CM,
              1,
            );
          }}
        />,
      );
      expect(await screen.findByText("Adjusted")).toBeInTheDocument();
    });
  });
});
