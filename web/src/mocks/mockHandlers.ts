import { DefaultBodyType, MockedRequest, rest, RestHandler } from "msw";
import { MarksBuilder } from "@/mocks/data/MarksBuilder";
import { ParcelsBuilder } from "@/mocks/data/ParcelsBuilder";

export const handlers: RestHandler<MockedRequest<DefaultBodyType>>[] = [
  // added $ in regex to force exact match for transaction id
  rest.get(/\/survey-features\/123$/, (_, res, ctx) =>
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
        primaryParcels: [
          ParcelsBuilder.primaryParcel().build(),
          ParcelsBuilder.hydroParcel().build(),
          ParcelsBuilder.roadParcel().build(),
        ],
        nonPrimaryParcels: [ParcelsBuilder.nonPrimaryParcel().build()],
        centreLineParcels: [ParcelsBuilder.centreLineParcel().build()],
      }),
    ),
  ),

  // 404 case
  rest.get(/\/survey-features\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
];
