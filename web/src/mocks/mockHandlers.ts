import { http, HttpHandler, HttpResponse } from "msw";

import { DiagramsBuilder } from "@/mocks/builders/DiagramsBuilder.ts";
import { LinesBuilder } from "@/mocks/builders/LinesBuilder.ts";
import { mockDiagrams } from "@/mocks/data/mockDiagrams.ts";
import { mockLines } from "@/mocks/data/mockLines.ts";
import { mockMarks, unmarkedPointBuilder } from "@/mocks/data/mockMarks.ts";
import { centreLineParcel, mockPrimaryParcels, nonPrimaryParcel } from "@/mocks/data/mockParcels.ts";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { mockNonBoundaryVectors, mockParcelDimensionVectors } from "@/mocks/data/mockVectors.ts";

export const handlers: HttpHandler[] = [
  // Survey 123 = all features
  // use $ in regex to force exact match for transaction id
  http.get(/\/survey-features\/123$/, () =>
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

  http.get(/\/plan\/123$/, () => HttpResponse.json(mockPlanData, { status: 200, statusText: "OK" })),

  http.post(/\/diagrams\/123$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/diagrams\/124$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/diagrams\/125$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/diagrams\/126$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/diagrams\/456$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/diagrams\/666$/, () =>
    HttpResponse.json(
      { ok: false, statusCode: 20001, message: "prepare dataset application error" },
      { status: 200, statusText: "OK" },
    ),
  ),

  // Survey 124 = diagrams with context
  http.get(/\/survey-features\/124$/, () =>
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

  http.get(/\/diagrams\/124$/, () => HttpResponse.json(mockDiagrams(), { status: 200, statusText: "OK" })),
  http.get(/\/124\/lines/, () => HttpResponse.json(mockLines(), { status: 200, statusText: "OK" })),

  // Survey 125: Return two marks in order to center the map on the geotiles fixture data we have manually defined
  http.get(/\/survey-features\/125$/, () =>
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
  http.get(/\/survey-features\/126$/, () =>
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

  http.get(/\/diagrams\/123$/, () =>
    HttpResponse.json(new DiagramsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.get(/\/diagrams\/125$/, () =>
    HttpResponse.json(new DiagramsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.get(/\/diagrams\/126$/, () =>
    HttpResponse.json(new DiagramsBuilder().build(), { status: 200, statusText: "OK" }),
  ),

  http.get(/\/123\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),
  http.get(/\/125\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),
  http.get(/\/126\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),
  http.get(/\/666\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),

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
  http.post(/\/diagrams\/666$/, () =>
    HttpResponse.json(
      { ok: false, statusCode: 20001, message: "prepare dataset application error" },
      { status: 200, statusText: "OK" },
    ),
  ),

  // 404 cases
  http.get(/\/survey-features\/404/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
  http.get(/\/diagrams\/404/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
  http.get(/\/plan\/404/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
  http.post(/\/diagrams\/404$/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
];
