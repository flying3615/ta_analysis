import { DefaultBodyType, MockedRequest, rest, RestHandler } from "msw";
import { MarksBuilder } from "@/mocks/data/MarksBuilder";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { ParcelsBuilder } from "@/mocks/data/ParcelsBuilder";
import { VectorsBuilder } from "@/test-utils/VectorsBuilder.ts";

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
        parcelDimensionVectors: [
          VectorsBuilder.parcelDimensionVectorNonPrimary(1, 1).build(),
          VectorsBuilder.parcelDimensionVectorPrimary(2, 2).build(),
        ],
        nonBoundaryVectors: [
          VectorsBuilder.nonBoundaryPseudo(1, 1).build(),
          VectorsBuilder.nonBoundaryCalculated(2, 2).build(),
          VectorsBuilder.nonBoundaryMeasured(3, 2).build(),
          VectorsBuilder.nonBoundaryAdopted(4, 3).build(),
          VectorsBuilder.nonBoundaryReinstatedAdopted(5, 4).build(),
          VectorsBuilder.nonBoundaryReinstatedCalculated(6, 5).build(),
        ],
      }),
    ),
  ),

  rest.get(/\/plan\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.json(mockPlanData))),

  // Geotiles - URL in the format of /v1/generate-plans/tiles/{layerName}/{zoom}/{x}/{y}
  // Note: the /v1/generate-plans prefix is needed to differentiate from basemap's /tiles endpoint
  rest.get(/\/v1\/generate-plans\/tiles\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/, async ({ params }, res, ctx) => {
    const [layerName, zoom, x, y] = Object.values(params);
    const tileBuffer = await fetch(`/data/geotiles/${layerName}/${zoom}/${x}/${y}`).then((res) => res.arrayBuffer());
    return res(
      ctx.set("Content-Length", tileBuffer.byteLength.toString()),
      ctx.set("Content-Type", "application/x-protobuf"),
      ctx.body(tileBuffer),
    );
  }),

  // 404 cases
  rest.get(/\/survey-features\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
  rest.get(/\/plan\/404/, (_, res, ctx) =>
    res(ctx.status(404, "Not found"), ctx.json({ code: 404, message: "Not found" })),
  ),
];
