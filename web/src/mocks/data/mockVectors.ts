import { ObservationElementSurveyedClassCode } from "@linz/luck-syscodes/build/js/ObservationElementSurveyedClassCode";

import { TEST_LOCATION_LAT_LONG } from "@/mocks/builders/CommonBuilder.ts";
import { VectorsBuilder } from "@/mocks/builders/VectorsBuilder.ts";
import {
  PEG_3_OFFSET,
  PEG_4_OFFSET,
  PEG_7_OFFSET,
  PEG_8_OFFSET,
  PEG_12_OFFSET,
  PEG_13_OFFSET,
} from "@/mocks/data/mockMarks.ts";
const vectorsBuilderTestOrigin = () => VectorsBuilder.empty().withOrigin(TEST_LOCATION_LAT_LONG);

// Vector from 8: Boundary post old to 13: oldCadastralSurveyNetworkMarkOrVCM
const parcelDimensionVectorPrimary = (id: number, transactionId: number) =>
  vectorsBuilderTestOrigin()
    .withId(id)
    .withTransactionId(transactionId)
    .withSurveyClass()
    .withPrimary("Y")
    .withNonPrimary("N")
    .withTraverse("N")
    .withApproxMetres([PEG_8_OFFSET, PEG_13_OFFSET])
    .build();
// vector from 13: oldCadastralSurveyNetworkMarkOrVCM to 7: Boundary post new
const parcelDimensionVectorNonPrimary = (id: number, transactionId: number) =>
  vectorsBuilderTestOrigin()
    .withId(id)
    .withTransactionId(transactionId)
    .withSurveyClass()
    .withPrimary("N")
    .withNonPrimary("Y")
    .withTraverse("N")
    .withApproxMetres([PEG_13_OFFSET, PEG_7_OFFSET])
    .build();

// Vector from 8: Boundary post old to 12: adoptedCadastralSurveyNetworkMarkOrVCM
const nonBoundaryPseudo = (id: number, transactionId: number) =>
  vectorsBuilderTestOrigin()
    .withId(id)
    .withTransactionId(transactionId)
    .withSurveyClass(ObservationElementSurveyedClassCode.PSED)
    .withPrimary("N")
    .withNonPrimary("N")
    .withTraverse("Y")
    .withApproxMetres([PEG_8_OFFSET, PEG_12_OFFSET])
    .build();
// Vector from 4:old primary to 3:new primary
const nonBoundaryCalculated = (id: number, transactionId: number) =>
  vectorsBuilderTestOrigin()
    .withId(id)
    .withTransactionId(transactionId)
    .withSurveyClass(ObservationElementSurveyedClassCode.CALC)
    .withPrimary("N")
    .withNonPrimary("N")
    .withTraverse("Y")
    .withApproxMetres([PEG_4_OFFSET, PEG_3_OFFSET])
    .build();

// Vector from 8: Boundary post old to 7: Boundary post new
const nonBoundaryAdopted = (id: number, transactionId: number) =>
  vectorsBuilderTestOrigin()
    .withId(id)
    .withTransactionId(transactionId)
    .withSurveyClass(ObservationElementSurveyedClassCode.ADPT)
    .withPrimary("N")
    .withNonPrimary("N")
    .withTraverse("Y")
    .withApproxMetres([PEG_8_OFFSET, PEG_7_OFFSET])
    .build();
// Vector from 8: Boundary post old to 3: New primary
const nonBoundaryMeasured = (id: number, transactionId: number) =>
  vectorsBuilderTestOrigin()
    .withId(id)
    .withTransactionId(transactionId)
    .withSurveyClass(ObservationElementSurveyedClassCode.MEAS)
    .withPrimary("N")
    .withNonPrimary("N")
    .withTraverse("Y")
    .withApproxMetres([PEG_8_OFFSET, PEG_3_OFFSET])
    .build();
// Vector from 3: New Primary to 12: adoptedCadastralSurveyNetworkMarkOrVCM
const nonBoundaryReinstatedAdopted = (id: number, transactionId: number) =>
  vectorsBuilderTestOrigin()
    .withId(id)
    .withTransactionId(transactionId)
    .withSurveyClass(ObservationElementSurveyedClassCode.REIA)
    .withPrimary("N")
    .withNonPrimary("N")
    .withTraverse("Y")
    .withApproxMetres([PEG_3_OFFSET, PEG_12_OFFSET])
    .build();

// Vector from 7: Boundary post new to 4: old primary
const nonBoundaryReinstatedCalculated = (id: number, transactionId: number) =>
  vectorsBuilderTestOrigin()
    .withId(id)
    .withTransactionId(transactionId)
    .withSurveyClass(ObservationElementSurveyedClassCode.REIC)
    .withPrimary("N")
    .withNonPrimary("N")
    .withTraverse("Y")
    .withApproxMetres([PEG_7_OFFSET, PEG_4_OFFSET])
    .build();

export const mockParcelDimensionVectors = () => [
  parcelDimensionVectorNonPrimary(1, 1),
  parcelDimensionVectorPrimary(2, 2),
];

export const mockNonBoundaryVectors = () => [
  nonBoundaryPseudo(1, 1),
  nonBoundaryCalculated(2, 2),
  nonBoundaryMeasured(3, 2),
  nonBoundaryAdopted(4, 3),
  nonBoundaryReinstatedAdopted(5, 4),
  nonBoundaryReinstatedCalculated(6, 5),
];
