import { DefaultBodyType, MockedRequest, rest, RestHandler } from "msw";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { mockSurveyFeaturesData } from "@/mocks/data/mockSurveyFeaturesData.ts";

export const handlers: RestHandler<MockedRequest<DefaultBodyType>>[] = [
  // added $ in regex to force exact match for transaction id
  rest.get(/\/survey-features\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json(mockSurveyFeaturesData))),

  rest.get(/\/plan\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json(mockPlanData))),

  rest.post(/\/diagrams\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json({ ok: true }))),
  rest.post(/\/diagrams\/456$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json({ ok: true }))),
  rest.post(/\/diagrams\/666$/, (_, res, ctx) =>
    res(
      ctx.status(200, "OK"),
      ctx.json({ ok: false, statusCode: 20001, message: "prepare dataset application error" }),
    ),
  ),

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

  // 404 cases
  rest.get(/\/survey-features\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
  rest.get(/\/plan\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
  rest.post(/\/diagrams\/404$/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
];
