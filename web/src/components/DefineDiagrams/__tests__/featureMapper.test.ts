import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";
import { ObservationElementSurveyedClassCode } from "@linz/luck-syscodes/build/js/ObservationElementSurveyedClassCode";
import { SurveyFeaturesResponseDTO } from "@linz/survey-plan-generation-api-client";

import { TEST_LOCATION_LAT_LONG } from "@/mocks/builders/CommonBuilder";
import { mockDiagrams } from "@/mocks/data/mockDiagrams";
import { mockLabels } from "@/mocks/data/mockLabels";
import { mockMarks } from "@/mocks/data/mockMarks";
import { centreLineParcel, nonPrimaryParcel, primaryParcel } from "@/mocks/data/mockParcels";
import { mockNonBoundaryVectors, mockParcelDimensionVectors } from "@/mocks/data/mockVectors";

import {
  getDiagramsForOpenLayers,
  getLabelsForOpenLayers,
  getMarksForOpenLayers,
  getParcelsForOpenLayers,
  getVectorsForOpenLayers,
} from "../featureMapper";

describe("featureMapper", () => {
  test("getMarksForOpenLayers", () => {
    const features = { marks: mockMarks() } as SurveyFeaturesResponseDTO;

    const marks = getMarksForOpenLayers(features);
    expect(marks).toHaveLength(13);
    expect(marks[0]).toStrictEqual({
      id: 1,
      name: "PEG 1 DP 123",
      label: "PEG 1 DP 123",
      markSymbol: 1,
      shape: {
        geometry: {
          type: "Point",
          coordinates: [14.825, -41.31009090909091],
        },
      },
    });
  });

  test("getParcelsForOpenLayers", () => {
    const features = {
      primaryParcels: [primaryParcel],
      nonPrimaryParcels: [nonPrimaryParcel],
      centreLineParcels: [centreLineParcel],
    } as SurveyFeaturesResponseDTO;

    const parcels = getParcelsForOpenLayers(features);
    expect(parcels).toHaveLength(3);
    expect(parcels[0]).toStrictEqual({
      id: 1,
      parcelIntent: "FSIM",
      topoClass: "PRIM",
      shape: {
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [14.825, -41.31009090909091],
              [14.826818181818181, -41.31009090909091],
              [14.826818181818181, -41.30918181818182],
              [14.825, -41.30918181818182],
              [14.825, -41.31009090909091],
            ],
          ],
        },
      },
    });
  });

  test("getVectorsForOpenLayers", async () => {
    const features = {
      parcelDimensionVectors: mockParcelDimensionVectors(),
      nonBoundaryVectors: mockNonBoundaryVectors(),
    };

    const vectors = getVectorsForOpenLayers(features as SurveyFeaturesResponseDTO);
    expect(vectors).toHaveLength(8);
    expect(vectors[0]).toStrictEqual({
      id: 1,
      transactionId: 1,
      surveyClass: ObservationElementSurveyedClassCode.PSED,
      isParcelDimensionVector: true,
      isNonBoundaryVector: false,
      shape: {
        geometry: {
          type: "LineString",
          coordinates: [
            [14.825, -41.30736363636364],
            [14.826818181818181, -41.30918181818182],
          ],
        },
      },
    });
  });

  test("getDiagramsForOpenLayers", async () => {
    const diagrams = getDiagramsForOpenLayers(mockDiagrams());

    expect(diagrams[4]?.id).toBe(1);
    expect(diagrams[4]?.["diagramType"]).toBe(CpgDiagramType.SYSN);
    expect(diagrams[4]?.shape?.["geometry"]?.coordinates?.[0]).toHaveLength(5);
    expect(diagrams[4]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [-30, 70]);
    expect(diagrams[4]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [-30, 170]);
    expect(diagrams[4]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [70, 170]);
    expect(diagrams[4]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [70, 70]);
    expect(diagrams[4]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [-30, 70]);

    expect(diagrams[5]?.id).toBe(2);
    expect(diagrams[5]?.["diagramType"]).toBe(CpgDiagramType.SYSP);
    expect(diagrams[5]?.shape?.["geometry"]?.coordinates?.[0]).toHaveLength(5);
    expect(diagrams[5]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [-35, 65]);
    expect(diagrams[5]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [-35, 165]);
    expect(diagrams[5]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [65, 165]);
    expect(diagrams[5]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [65, 65]);
    expect(diagrams[5]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [-35, 65]);
  });

  test("diagram and label features are sorted correctly", async () => {
    const diagrams = getDiagramsForOpenLayers(mockDiagrams());
    const labels = getLabelsForOpenLayers(mockLabels());

    const expectedOrder = [
      CpgDiagramType.UDFT, //bottom layer
      CpgDiagramType.UDFN,
      CpgDiagramType.UDFP,
      CpgDiagramType.SYST,
      CpgDiagramType.SYSN,
      CpgDiagramType.SYSP, //top layer
    ];

    expect(diagrams.map((d) => d.diagramType)).toStrictEqual(expectedOrder);
    expect(labels.map((d) => d.type)).toStrictEqual(expectedOrder);
  });
});
