import { rest, RestHandler } from "msw";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { mockDiagrams } from "@/mocks/data/mockDiagrams.ts";
import { mockMarks, unmarkedPointBuilder } from "@/mocks/data/mockMarks.ts";
import { centreLineParcel, mockPrimaryParcels, nonPrimaryParcel } from "@/mocks/data/mockParcels.ts";
import { mockNonBoundaryVectors, mockParcelDimensionVectors } from "@/mocks/data/mockVectors.ts";
import { DiagramsBuilder } from "@/mocks/builders/DiagramsBuilder.ts";

export const handlers: RestHandler[] = [
  // Survey 123 = all features
  // use $ in regex to force exact match for transaction id
  rest.get(/\/survey-features\/123$/, (_, res, ctx) =>
    res(
      ctx.status(200, "OK"),
      ctx.json({
        marks: mockMarks(),
        primaryParcels: mockPrimaryParcels(),
        nonPrimaryParcels: [nonPrimaryParcel],
        centreLineParcels: [centreLineParcel],
        parcelDimensionVectors: mockParcelDimensionVectors(),
        nonBoundaryVectors: mockNonBoundaryVectors(),
      }),
    ),
  ),

  rest.get(/\/plan\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json(mockPlanData))),
  rest.get(/\/diagrams\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json(new DiagramsBuilder().build()))),
  rest.post(/\/diagrams\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json({ ok: true }))),
  rest.post(/\/diagrams\/124$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json({ ok: true }))),
  rest.post(/\/diagrams\/125$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json({ ok: true }))),
  rest.post(/\/diagrams\/456$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json({ ok: true }))),
  rest.post(/\/diagrams\/666$/, (_, res, ctx) =>
    res(
      ctx.status(200, "OK"),
      ctx.json({ ok: false, statusCode: 20001, message: "prepare dataset application error" }),
    ),
  ),

  // Survey 124 = diagrams with context
  rest.get(/\/survey-features\/124$/, (_, res, ctx) =>
    res(
      ctx.status(200, "OK"),
      ctx.json({
        marks: [],
        primaryParcels: mockPrimaryParcels(),
        nonPrimaryParcels: [nonPrimaryParcel],
        centreLineParcels: [],
      }),
    ),
  ),

  rest.get(/\/diagrams\/124$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json(mockDiagrams()))),

  // Survey 125: Return two marks in order to center the map on the geotiles fixture data we have manually defined
  rest.get(/\/survey-features\/125$/, (_, res, ctx) =>
    res(
      ctx.status(200, "OK"),
      ctx.json({
        marks: [
          unmarkedPointBuilder().withCoordinates([14.8280094, -41.306448]).build(),
          unmarkedPointBuilder().withCoordinates([14.8337251, -41.308552]).build(),
        ],
        primaryParcels: [],
        nonPrimaryParcels: [],
        centreLineParcels: [],
      }),
    ),
  ),

  rest.get(/\/plan\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json(mockPlanData))),

  rest.get(/\/diagrams\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json(new DiagramsBuilder().build()))),
  rest.get(/\/diagrams\/125$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json(new DiagramsBuilder().build()))),

  // Geotiles - URL in the format of /v1/generate-plans/tiles/{layerName}/{zoom}/{x}/{y}
  // Note: the /v1/generate-plans prefix is needed to differentiate from basemap's /tiles endpoint
  rest.get(/\/v1\/generate-plans\/tiles\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/, async ({ params }, res, ctx) => {
    const [layerName, zoom, x, y] = Object.values(params);
    const response = await fetch(`/data/geotiles/${layerName}/${zoom}/${x}/${y}`);
    if (response.ok) {
      return res(ctx.body(await response.arrayBuffer()));
    }
    return res(ctx.body(new ArrayBuffer(0)));
  }),

  // Application errors
  rest.post(/\/diagrams\/666$/, (_, res, ctx) =>
    res(
      ctx.status(200, "OK"),
      ctx.json({ ok: false, statusCode: 20001, message: "prepare dataset application error" }),
    ),
  ),

  // 404 cases
  rest.get(/\/survey-features\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
  rest.get(/\/diagrams\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
  rest.get(/\/plan\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
  rest.get(/\/diagrams\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
  rest.post(/\/diagrams\/404$/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
];
