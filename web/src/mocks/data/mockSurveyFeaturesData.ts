import { MarksBuilder } from "@/mocks/data/MarksBuilder.ts";
import { ParcelsBuilder } from "@/mocks/data/ParcelsBuilder.ts";
import { VectorsBuilder } from "@/test-utils/VectorsBuilder.ts";

export const mockSurveyFeaturesData = {
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
};
