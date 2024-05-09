import { rest } from "msw";
import { mockOriginMark } from "./mockSurveyFeatures";

export const handlers = [
  rest.get(/\/survey-features\/123/, (_, res, ctx) =>
    res(
      ctx.status(200, "OK"),
      ctx.json({
        marks: [mockOriginMark(1), mockOriginMark(2), mockOriginMark(3)],
      }),
    ),
  ),

  // 404 case
  rest.get(/\/survey-features\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
];
