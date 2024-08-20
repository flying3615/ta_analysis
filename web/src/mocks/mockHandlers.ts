import { delay, http, HttpHandler, HttpResponse } from "msw";

import { DiagramsBuilder } from "@/mocks/builders/DiagramsBuilder.ts";
import { LabelsBuilder } from "@/mocks/builders/LabelsBuilder.ts";
import { LinesBuilder } from "@/mocks/builders/LinesBuilder.ts";
import { mockDiagrams } from "@/mocks/data/mockDiagrams.ts";
import { mockLabels } from "@/mocks/data/mockLabels.ts";
import { mockLines } from "@/mocks/data/mockLines.ts";
import { mockMarks, unmarkedPointBuilder } from "@/mocks/data/mockMarks.ts";
import { centreLineParcel, mockPrimaryParcels, nonPrimaryParcel } from "@/mocks/data/mockParcels.ts";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { mockNonBoundaryVectors, mockParcelDimensionVectors } from "@/mocks/data/mockVectors.ts";

import { mockInternalServerError } from "./data/mockError";

export const handlers: HttpHandler[] = [
  // Survey 123 = all features
  // use $ in regex to force exact match for transaction id
  http.get(/\/123\/survey-features$/, () =>
    HttpResponse.json(
      {
        marks: mockMarks(),
        primaryParcels: mockPrimaryParcels(),
        nonPrimaryParcels: [nonPrimaryParcel],
        centreLineParcels: [centreLineParcel],
        parcelDimensionVectors: mockParcelDimensionVectors(),
        nonBoundaryVectors: mockNonBoundaryVectors(),
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/api\/survey\/123\/survey-title/, async () =>
    HttpResponse.json(
      {
        surveyNo: "LT 999999",
        surveyReference: "Test Reference",
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/api\/survey\/124\/survey-title/, async () =>
    HttpResponse.json(
      {
        surveyNo: "LT 999999",
        surveyReference: "Test Reference",
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/123\/plan$/, () => HttpResponse.json(mockPlanData, { status: 200, statusText: "OK" })),
  http.get(/\/124\/plan$/, () => HttpResponse.json(mockPlanData, { status: 200, statusText: "OK" })),

  http.put(/\/123\/plan$/, async () => {
    await delay(2000);
    return HttpResponse.json({}, { status: 200 });
  }),
  http.put(/\/124\/plan$/, async () => HttpResponse.json(mockInternalServerError, { status: 500 })),

  http.get(/\/123\/plan-check$/, () =>
    HttpResponse.json({ refreshRequired: false }, { status: 200, statusText: "OK" }),
  ),

  http.post(/\/123\/prepare$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/124\/prepare$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/125\/prepare$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/126\/prepare$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/456\/prepare$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/666\/prepare$/, () =>
    HttpResponse.json(
      { ok: false, statusCode: 20001, message: "prepare dataset application error" },
      { status: 200, statusText: "OK" },
    ),
  ),

  // Survey 124 = diagrams with context, regular plan
  http.get(/\/124\/plan$/, () => HttpResponse.json(mockPlanData, { status: 200, statusText: "OK" })),
  http.get(/\/124\/survey-features$/, () =>
    HttpResponse.json(
      {
        marks: [],
        primaryParcels: mockPrimaryParcels(),
        nonPrimaryParcels: [nonPrimaryParcel],
        centreLineParcels: [],
      },
      { status: 200, statusText: "OK" },
    ),
  ),
  http.get(/\/124\/plan-check$/, () => HttpResponse.json({ refreshRequired: true }, { status: 200, statusText: "OK" })),
  // regenerate xml with delay
  http.post(/\/124\/plan$/, async () => {
    await delay(2000);
    return HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" });
  }),
  http.get(/\/124\/diagrams$/, () => HttpResponse.json(mockDiagrams(), { status: 200, statusText: "OK" })),
  http.delete(/\/124\/diagrams$/, () =>
    HttpResponse.json(
      { ok: true, statusCode: null, message: null },
      {
        status: 200,
        statusText: "OK",
      },
    ),
  ),
  http.get(/\/124\/lines/, () => HttpResponse.json(mockLines(), { status: 200, statusText: "OK" })),
  http.delete(/\/124\/lines/, () =>
    HttpResponse.json(
      { ok: true, statusCode: null, message: null },
      {
        status: 200,
        statusText: "OK",
      },
    ),
  ),
  http.get(/\/124\/extinguished-lines/, () => HttpResponse.json(mockLines(), { status: 200, statusText: "OK" })),
  http.post(/\/124\/convert-extinguished-lines/, async () => {
    return HttpResponse.json({ ok: true, statusCode: null, message: null }, { status: 200, statusText: "OK" });
  }),
  http.get(/\/124\/diagram-labels/, () => HttpResponse.json(mockLabels(), { status: 200, statusText: "OK" })),
  // Survey 125: Return two marks in order to center the map on the geotiles fixture data we have manually defined
  http.get(/\/125\/survey-features$/, () =>
    HttpResponse.json(
      {
        marks: [
          unmarkedPointBuilder().withCoordinates([14.8280094, -41.306448]).build(),
          unmarkedPointBuilder().withCoordinates([14.8337251, -41.308552]).build(),
        ],
        primaryParcels: [],
        nonPrimaryParcels: [],
        centreLineParcels: [],
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  // Survey 126: Return two marks in order to center the map on the geotiles fixture data we have manually defined
  http.get(/\/126\/survey-features$/, () =>
    HttpResponse.json(
      {
        marks: [
          unmarkedPointBuilder().withCoordinates([10.9857178, -45.07255078]).build(),
          unmarkedPointBuilder().withCoordinates([10.9925842, -45.06770141]).build(),
        ],
        primaryParcels: [],
        nonPrimaryParcels: [],
        centreLineParcels: [],
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/123\/diagrams$/, () =>
    HttpResponse.json(new DiagramsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.get(/\/125\/diagrams$/, () =>
    HttpResponse.json(new DiagramsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.get(/\/126\/diagrams$/, () =>
    HttpResponse.json(new DiagramsBuilder().build(), { status: 200, statusText: "OK" }),
  ),

  http.post(/\/125\/diagrams$/, () => HttpResponse.json({ ok: true, statusCode: null, message: null, diagramId: 4 })),
  http.post(/\/123\/diagrams$/, () => HttpResponse.json({ ok: true, statusCode: null, message: null, diagramId: 4 })),
  http.get(/\/125\/extinguished-lines/, () => HttpResponse.json(mockLines(), { status: 200, statusText: "OK" })),
  http.get(/\/123\/extinguished-lines/, () => HttpResponse.json(mockLines(), { status: 200, statusText: "OK" })),
  http.get(/\/126\/extinguished-lines/, () => HttpResponse.json(mockLines(), { status: 200, statusText: "OK" })),

  http.get(/\/123\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),
  http.get(/\/125\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),
  http.get(/\/126\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),
  http.get(/\/666\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),

  http.get(/\/123\/diagram-labels/, () =>
    HttpResponse.json(new LabelsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.patch(/\/123\/diagram-labels/, () => new HttpResponse(null, { status: 204 })),
  http.get(/\/125\/diagram-labels/, () =>
    HttpResponse.json(new LabelsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.patch(/\/125\/diagram-labels/, () => new HttpResponse(null, { status: 204 })),
  http.get(/\/126\/diagram-labels/, () =>
    HttpResponse.json(new LabelsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.patch(/\/126\/diagram-labels/, () => new HttpResponse(null, { status: 204 })),
  http.get(/\/666\/diagram-labels/, () =>
    HttpResponse.json(new LabelsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.patch(/\/666\/diagram-labels/, () => new HttpResponse(null, { status: 204 })),

  // Geotiles - URL in the format of /v1/generate-plans/tiles/{layerName}/{zoom}/{x}/{y}
  // Note: the /v1/generate-plans prefix is needed to differentiate from basemap's /tiles endpoint
  http.get(/\/v1\/generate-plans\/tiles\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/, async ({ params }) => {
    const [layerName, zoom, x, y] = Object.values(params);
    const response = await fetch(`/data/geotiles/${layerName}/${zoom}/${x}/${y}`);
    if (response.ok) {
      return HttpResponse.arrayBuffer(await response.arrayBuffer());
    }
    return HttpResponse.arrayBuffer(new ArrayBuffer(0));
  }),

  // Application errors
  http.post(/\/666\/diagrams$/, () =>
    HttpResponse.json(
      { ok: false, statusCode: 20001, message: "prepare dataset application error" },
      { status: 200, statusText: "OK" },
    ),
  ),

  // 404 cases
  http.get(/404\/survey-features/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
  http.get(/\/404\/diagrams/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
  http.post(/\/404\/prepare/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
  http.get(/\/plan\/404/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
  http.get(/\/plan\/check\/404/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
  http.post(/\/404\/diagrams$/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
  http.post(/\/prepare\/404$/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
];
