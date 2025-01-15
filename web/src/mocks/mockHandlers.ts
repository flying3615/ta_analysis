import { AsyncTaskDTOTypeEnum } from "@linz/survey-plan-generation-api-client";
import { http, HttpHandler, HttpResponse } from "msw";

import { AsyncTaskBuilder } from "@/mocks/builders/AsyncTaskBuilder";
import { DiagramsBuilder } from "@/mocks/builders/DiagramsBuilder";
import { LabelsBuilder } from "@/mocks/builders/LabelsBuilder";
import { LinesBuilder } from "@/mocks/builders/LinesBuilder";
import { mockDiagramLayerNames } from "@/mocks/data/mockDiagramLayerNames";
import { mockDiagramLayerTypes } from "@/mocks/data/mockDiagramLayerTypes";
import { mockDiagrams } from "@/mocks/data/mockDiagrams";
import { mockLabelPreferences } from "@/mocks/data/mockLabelPreferences";
import { mockLabels } from "@/mocks/data/mockLabels";
import { mockLines } from "@/mocks/data/mockLines";
import { mockMaintainDiagramLayersByDiagram } from "@/mocks/data/mockMaintainDiagramLayersByDiagram";
import { mockMaintainDiagramLayersByDiagramType } from "@/mocks/data/mockMaintainDiagramLayersByDiagramType";
import { mockMarks, unmarkedPointBuilder } from "@/mocks/data/mockMarks";
import { centreLineParcel, mockPrimaryParcels, nonPrimaryParcel } from "@/mocks/data/mockParcels";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { mockSurveyInfo } from "@/mocks/data/mockSurveyInfo";
import { mockNonBoundaryVectors, mockParcelDimensionVectors } from "@/mocks/data/mockVectors";
import {
  failedRegeneratePlanTaskId,
  failedUpdatePlanTaskId,
  mockAsyncTaskGeneratorHandler,
  successfulRegeneratePlanTaskId,
  successfulUpdatePlanTaskId,
} from "@/mocks/mockAsyncTaskHandler";
import { writeCompileImage } from "@/test-utils/compile-images-utils";
import { generateUniqueValue } from "@/util/httpUtil";

// Keeping track of the SFU uploads for compile plan feature
const fileUlidSet = new Map<string, string>();

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

  http.get(/\/api\/survey\/123\/survey-title/, () =>
    HttpResponse.json(
      {
        surveyNo: "LT 999999",
        surveyReference: "Test Reference",
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/api\/survey\/124\/survey-title/, () =>
    HttpResponse.json(
      {
        surveyNo: "LT 999999",
        surveyReference: "Test Reference",
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/api\/survey\/(123|124)\/survey-info/, () =>
    HttpResponse.json(mockSurveyInfo, { status: 200, statusText: "OK" }),
  ),

  http.get(/\/api\/survey\/666\/locks$/, () =>
    HttpResponse.html("<html lang='en'><body>Unexpected exception</body></html>", {
      status: 500,
      statusText: "Failed",
    }),
  ),

  http.get(/\/api\/survey\/5000061\/locks$/, () =>
    HttpResponse.json(
      {
        transactionLock: {
          locked: true,
          lockedId: 5000061,
          lockedEntityId: 2100000,
          sessionUser: "extsurv1",
          type: null,
          lockedBy: {
            id: "extsurv4",
            givenNames: "Survey X",
            surname: "External",
          },
          lockedAt: "{{now}}",
          isNewAppLock: false,
        },
        taCertificationRequestLocks: [],
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  // fresh lock that does not require extend
  http.get(/\/api\/survey\/12345\/locks$/, () =>
    HttpResponse.json(
      {
        transactionLock: {
          locked: true,
          lockedId: 2100000,
          lockedEntityId: 12345,
          sessionUser: "extsurv1",
          type: null,
          lockedAt: new Date().toISOString(),
          lockedBy: {
            id: "extsurv1",
            givenNames: "Survey B",
            surname: "External",
          },
          isNewAppLock: true,
        },
        taCertificationRequestLocks: [],
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/api\/survey\/([0-9]+)\/locks$/, ({ params }) =>
    HttpResponse.json(
      {
        transactionLock: {
          locked: true,
          lockedId: 2100000,
          lockedEntityId: params[0],
          sessionUser: "extsurv1",
          type: null,
          lockedBy: {
            id: "extsurv1",
            givenNames: "Survey B",
            surname: "External",
          },
          lockedAt: new Date(new Date().getTime() - 300_001).toISOString(),
          isNewAppLock: true,
        },
        taCertificationRequestLocks: [],
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.put(/\/api\/survey\/667\/locks\/([0-9]+)\/lastUsed$/, () =>
    HttpResponse.html("<html lang='en'><body>Unexpected exception</body></html>", {
      status: 500,
      statusText: "Failed",
    }),
  ),

  http.put(/\/api\/survey\/([0-9]+)\/locks\/([0-9]+)\/lastUsed$/, ({ params }) =>
    HttpResponse.json(
      {
        id: params[1],
        lastUsedAt: new Date().toISOString(),
        status: "IN_PROGRESS",
        userId: "extsurv1",
        newLock: true,
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/123\/plan$/, () => HttpResponse.json(mockPlanData, { status: 200, statusText: "OK" })),

  http.put(/\/123\/plan$/, () =>
    HttpResponse.json(
      new AsyncTaskBuilder()
        .withType(AsyncTaskDTOTypeEnum.UPDATE_PLAN)
        .withTaskId(successfulUpdatePlanTaskId)
        .withQueuedStatus()
        .build(),
      {
        status: 202,
        statusText: "ACCEPTED",
      },
    ),
  ),
  http.post(/\/123\/plan-regenerate$/, () => HttpResponse.json(undefined, { status: 200, statusText: "OK" })),
  http.post(/\/123\/prepare$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.get(/\/123\/diagrams$/, () =>
    HttpResponse.json(new DiagramsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.post(/\/123\/diagrams$/, () => HttpResponse.json({ ok: true, statusCode: null, message: null, diagramId: 4 })),
  http.get(/\/123\/extinguished-lines/, () => HttpResponse.json(mockLines(), { status: 200, statusText: "OK" })),
  http.get(/\/123\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),
  http.get(/\/123\/diagram-labels/, () =>
    HttpResponse.json(new LabelsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.patch(/\/123\/diagram-labels/, () => new HttpResponse(null, { status: 204 })),

  // Survey 124 = diagrams with context, regular plan, regeneration task takes longer
  http.get(/\/124\/plan$/, () => HttpResponse.json(mockPlanData, { status: 200, statusText: "OK" })),
  http.post(/\/124\/prepare$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
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
  http.post(/\/124\/plan-regenerate$/, () =>
    HttpResponse.json(
      new AsyncTaskBuilder()
        .withType(AsyncTaskDTOTypeEnum.REGENERATE_PLAN)
        .withTaskId(successfulRegeneratePlanTaskId)
        .withQueuedStatus()
        .build(),
      {
        status: 202,
        statusText: "ACCEPTED",
      },
    ),
  ),

  // Get diagrams
  http.get(/\/124\/diagrams$/, () => HttpResponse.json(mockDiagrams(), { status: 200, statusText: "OK" })),
  http.patch(/\/124\/diagrams\/6/, () => HttpResponse.json({ ok: true, statusCode: null, message: null })),
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
  http.post(/\/124\/convert-extinguished-lines/, () => {
    return HttpResponse.json({ ok: true, statusCode: null, message: null }, { status: 200, statusText: "OK" });
  }),
  http.get(/\/124\/diagram-labels/, () => HttpResponse.json(mockLabels(), { status: 200, statusText: "OK" })),
  http.patch(/\/124\/diagram-labels/, () => new HttpResponse(null, { status: 204 })),
  http.get(/\/api\/survey\/124\/survey-title/, () =>
    HttpResponse.json(
      {
        surveyNo: "LT 999999",
        surveyReference: "Test Reference",
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  // Survey 125
  http.post(/\/125\/prepare$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
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
  http.get(/\/125\/diagrams$/, () =>
    HttpResponse.json(new DiagramsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.post(/\/125\/diagrams$/, () => HttpResponse.json({ ok: true, statusCode: null, message: null, diagramId: 4 })),
  http.get(/\/125\/extinguished-lines/, () => HttpResponse.json(mockLines(), { status: 200, statusText: "OK" })),
  http.get(/\/125\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),
  http.get(/\/125\/diagram-labels/, () =>
    HttpResponse.json(new LabelsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.patch(/\/125\/diagram-labels/, () => new HttpResponse(null, { status: 204 })),
  http.get(/\/125\/plan$/, () => HttpResponse.json(mockPlanData, { status: 200, statusText: "OK" })),
  http.put(/\/125\/plan$/, () =>
    HttpResponse.json(
      new AsyncTaskBuilder()
        .withTaskId(failedUpdatePlanTaskId)
        .withType(AsyncTaskDTOTypeEnum.UPDATE_PLAN)
        .withInProgressStatus()
        .build(),
      { status: 202, statusText: "ACCEPTED" },
    ),
  ),
  http.post(/\/125\/plan-regenerate$/, () => HttpResponse.json(undefined, { status: 200, statusText: "OK" })),

  //Survey 126
  http.post(/\/126\/prepare$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
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
  http.get(/\/126\/diagrams$/, () =>
    HttpResponse.json(new DiagramsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.get(/\/126\/extinguished-lines/, () => HttpResponse.json(mockLines(), { status: 200, statusText: "OK" })),
  http.get(/\/126\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),
  http.get(/\/126\/diagram-labels/, () =>
    HttpResponse.json(new LabelsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.patch(/\/126\/diagram-labels/, () => new HttpResponse(null, { status: 204 })),

  // Survey 127: Regenerate Plan async task fails
  http.post(/\/127\/plan-regenerate$/, () =>
    HttpResponse.json(
      new AsyncTaskBuilder()
        .withTaskId(failedRegeneratePlanTaskId)
        .withType(AsyncTaskDTOTypeEnum.REGENERATE_PLAN)
        .withFailedStatus()
        .build(),
      { status: 202, statusText: "ACCEPTED" },
    ),
  ),

  http.get(/\/diagrams-check/, () => {
    return HttpResponse.json(
      {
        isPrimaryParcelsExists: true,
        isNonPrimaryParcelsExists: true,
        isTraverseExists: true,
      },
      { status: 200, statusText: "OK" },
    );
  }),

  http.get(/\/label-preference/, () =>
    HttpResponse.json(
      {
        fonts: mockLabelPreferences.fonts,
        defaults: mockLabelPreferences.defaults,
        userLabelPreferences: mockLabelPreferences.userLabelPreferences,
        surveyLabelPreferences: mockLabelPreferences.surveyLabelPreferences,
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/diagram-layers-by-diagram-type/, () =>
    HttpResponse.json(
      {
        ok: mockMaintainDiagramLayersByDiagramType.ok,
        diagramLayerByTypePreferences: mockMaintainDiagramLayersByDiagramType.diagramLayerByTypePreferences,
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/diagram-layers-by-diagram/, () =>
    HttpResponse.json(
      {
        ok: mockMaintainDiagramLayersByDiagram.ok,
        diagramLayerPreferences: mockMaintainDiagramLayersByDiagram.diagramLayerPreferences,
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/diagram-layer-types/, () =>
    HttpResponse.json(
      {
        ok: mockDiagramLayerTypes.ok,
        diagramTypes: mockDiagramLayerTypes.diagramTypes,
      },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/diagram-layer-names/, () =>
    HttpResponse.json(
      {
        ok: mockDiagramLayerNames.ok,
        diagrams: mockDiagramLayerNames.diagrams,
      },
      { status: 200, statusText: "OK" },
    ),
  ),
  http.get(/\/123\/pre-compile-plans$/, () => {
    return HttpResponse.json(
      {
        hasPlanGenRanBefore: true,
      },
      { status: 200, statusText: "OK" },
    );
  }),

  http.get(/\/456\/pre-compile-plans$/, () => {
    return HttpResponse.json(
      {
        hasPlanGenRanBefore: false,
      },
      { status: 200, statusText: "OK" },
    );
  }),

  http.post(/\/123\/compile-plans$/, () => HttpResponse.json({}, { status: 200, statusText: "OK" })),
  http.post(/\/v1\/file-uploads/, async ({ request }) => {
    const ulid = generateUniqueValue();
    const requestBody = (await request.json()) as { originalFileName: string };
    fileUlidSet.set(ulid, requestBody.originalFileName);
    return HttpResponse.json({ fileUlid: ulid, signedUrl: `/v1/file-uploads/s3/${ulid}` }, { status: 200 });
  }),
  http.put(/\/v1\/file-uploads\/s3/, async ({ request }) => {
    const blob = await request.blob();
    const fileUlid = request.url.split("/").pop();
    if (fileUlid) {
      // Add blob to the compileImages map
      const filename = fileUlidSet.get(fileUlid);
      if (filename) {
        await writeCompileImage(filename, new Blob([blob], { type: "image/jpeg" }));
      }
      return HttpResponse.json({}, { status: 200, statusText: "OK" });
    }
    return HttpResponse.json({}, { status: 400, statusText: "Bad Request" });
  }),

  http.post(/\/456\/prepare$/, () => HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" })),
  http.post(/\/666\/prepare$/, () =>
    HttpResponse.json(
      { ok: false, statusCode: 20001, message: "prepare dataset application error" },
      { status: 200, statusText: "OK" },
    ),
  ),

  http.get(/\/666\/lines/, () => HttpResponse.json(new LinesBuilder().build(), { status: 200, statusText: "OK" })),
  http.get(/\/666\/diagram-labels/, () =>
    HttpResponse.json(new LabelsBuilder().build(), { status: 200, statusText: "OK" }),
  ),
  http.patch(/\/666\/diagram-labels/, () => new HttpResponse(null, { status: 204 })),

  // Async task handler
  http.get(/\/async-task/, mockAsyncTaskGeneratorHandler),

  // Geotiles - URL in the format of /v1/generate-plans/tiles/{layerName}/{zoom}/{x}/{y}
  // Note: the /v1/generate-plans prefix is needed to differentiate from basemap's /tiles endpoint
  http.get(/\/v1\/generate-plans\/tiles\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/, async ({ params }) => {
    const [layerName, zoom, x, y] = Object.values(params);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
  http.post(/\/404\/plan-regenerate$/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
  http.post(/\/404\/diagrams$/, () =>
    HttpResponse.json({ code: 404, message: "Not found" }, { status: 404, statusText: "Not found" }),
  ),
];
