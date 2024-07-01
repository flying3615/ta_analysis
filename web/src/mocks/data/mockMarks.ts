import { OffsetXY, TEST_LOCATION_LAT_LONG } from "@/mocks/builders/CommonBuilder.ts";
import { MarksBuilder } from "@/mocks/builders/MarksBuilder.ts";

const marksBuilderTestOrigin = () => MarksBuilder.empty().withOrigin(TEST_LOCATION_LAT_LONG);

export const PEG_1_OFFSET: OffsetXY = [0, 100];
export const PEG_2_OFFSET: OffsetXY = [100, 100];
export const PEG_3_OFFSET: OffsetXY = [200, 100];
export const PEG_4_OFFSET: OffsetXY = [300, 100];
export const PEG_5_OFFSET: OffsetXY = [0, 200];
export const PEG_6_OFFSET: OffsetXY = [100, 200];
export const PEG_7_OFFSET: OffsetXY = [200, 200];
export const PEG_8_OFFSET: OffsetXY = [300, 200];
export const PEG_9_OFFSET: OffsetXY = [0, 300];
export const PEG_10_OFFSET: OffsetXY = [100, 300];
export const PEG_11_OFFSET: OffsetXY = [200, 300];
export const PEG_12_OFFSET: OffsetXY = [300, 300];
export const PEG_13_OFFSET: OffsetXY = [0, 400];

const originMark = marksBuilderTestOrigin()
  .withName("PEG 1 DP 123")
  .withRefId(1)
  .withSymbolCode(1)
  .withApproxMetres(PEG_1_OFFSET)
  .build();

const nonWitnessOriginMark = marksBuilderTestOrigin()
  .withId(2)
  .withName("PEG 2 DP 123")
  .withRefId(2)
  .withSymbolCode(2)
  .withApproxMetres(PEG_2_OFFSET)
  .build();

const newPRM = marksBuilderTestOrigin()
  .withId(3)
  .withName("PEG 3 DP 123")
  .withRefId(3)
  .withSymbolCode(3)
  .withApproxMetres(PEG_3_OFFSET)
  .build();

const oldPRM = marksBuilderTestOrigin()
  .withId(4)
  .withName("PEG 4 DP 123")
  .withRefId(4)
  .withSymbolCode(4)
  .withApproxMetres(PEG_4_OFFSET)
  .build();

const newWitnessMark = marksBuilderTestOrigin()
  .withId(5)
  .withName("PEG 5 DP 123")
  .withRefId(5)
  .withSymbolCode(5)
  .withApproxMetres(PEG_5_OFFSET)
  .build();

const oldWitnessMark = marksBuilderTestOrigin()
  .withId(6)
  .withName("PEG 6 DP 123")
  .withRefId(6)
  .withSymbolCode(6)
  .withApproxMetres(PEG_6_OFFSET)
  .build();

//Boundary post New / adopted
const postAdoptedNewMark = marksBuilderTestOrigin()
  .withId(7)
  .withName("PEG 7 DP 123")
  .withRefId(7)
  .withSymbolCode(7)
  .withApproxMetres(PEG_7_OFFSET)
  .build();

//Boundary post Old
const postOtherMark = marksBuilderTestOrigin()
  .withId(8)
  .withName("PEG 8 DP 123")
  .withRefId(8)
  .withSymbolCode(8)
  .withApproxMetres(PEG_8_OFFSET)
  .build();

export const unmarkedPointBuilder = () =>
  marksBuilderTestOrigin().withId(9).withName("PEG 9 DP 123").withRefId(9).withSymbolCode(9);

export const unmarkedPoint = unmarkedPointBuilder().withApproxMetres(PEG_9_OFFSET).build();

const pegNew = marksBuilderTestOrigin()
  .withId(10)
  .withName("PEG 10 DP 123")
  .withRefId(10)
  .withSymbolCode(10)
  .withApproxMetres(PEG_10_OFFSET)
  .build();

const pegOther = marksBuilderTestOrigin()
  .withId(11)
  .withName("PEG 11 DP 123")
  .withRefId(11)
  .withSymbolCode(11)
  .withApproxMetres(PEG_11_OFFSET)
  .build();

const adoptedCadastralSurveyNetworkMarkOrVCM = marksBuilderTestOrigin()
  .withId(12)
  .withName("PEG 12 DP 123")
  .withRefId(12)
  .withSymbolCode(12)
  .withApproxMetres(PEG_12_OFFSET)
  .build();

const oldCadastralSurveyNetworkMarkOrVCM = marksBuilderTestOrigin()
  .withId(13)
  .withName("PEG 13 DP 123")
  .withRefId(13)
  .withSymbolCode(13)
  .withApproxMetres(PEG_13_OFFSET)
  .build();

export const mockMarks = () => [
  originMark,
  nonWitnessOriginMark,
  newPRM,
  oldPRM,
  newWitnessMark,
  oldWitnessMark,
  postAdoptedNewMark,
  postOtherMark,
  unmarkedPoint,
  pegNew,
  pegOther,
  adoptedCadastralSurveyNetworkMarkOrVCM,
  oldCadastralSurveyNetworkMarkOrVCM,
];
