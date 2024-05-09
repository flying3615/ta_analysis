import { rest } from "msw";
import { mockOriginMark } from "./mockSurveyFeatures";

export const handlers = [
  rest.get(/\/survey-features\/123/, (_, res, ctx) => res(
    ctx.status(200, "OK"),
    ctx.json({
      marks: [mockOriginMark(1)],
    }),
  )),
];
