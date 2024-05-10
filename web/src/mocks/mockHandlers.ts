import { rest } from "msw";
import { MarksBuilder } from "@/test-utils/MarksBuilder";

export const handlers = [
  rest.get(/\/survey-features\/123/, (_, res, ctx) =>
    res(
      ctx.status(200, "OK"),
      ctx.json({
        marks: [
          MarksBuilder.originMark().build(),
          MarksBuilder.nonWitnessOriginMark().build(),
          MarksBuilder.newPRM().build(),
          MarksBuilder.oldPRM().build(),
          MarksBuilder.newWitnessMark().build(),
          MarksBuilder.oldWitnessMark().build(),
          MarksBuilder.postAdoptedNewMark().build(),
          MarksBuilder.postOtherMark().build(),
          MarksBuilder.unmarkedPoint().build(),
          MarksBuilder.pegNew().build(),
          MarksBuilder.pegOther().build(),
          MarksBuilder.adoptedCadastralSurveyNetworkMarkOrVCM().build(),
          MarksBuilder.oldCadastralSurveyNetworkMarkOrVCM().build(),
        ],
      }),
    ),
  ),

  // 404 case
  rest.get(/\/survey-features\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
];
