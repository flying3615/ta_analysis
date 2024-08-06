import { ParcelIntentCode } from "@linz/luck-syscodes/build/js/ParcelIntentCode";
import { ParcelTopologyClassCode } from "@linz/luck-syscodes/build/js/ParcelTopologyClassCode";
import { TypeOfAffectedParcelCode } from "@linz/luck-syscodes/build/js/TypeOfAffectedParcelCode";

import { TEST_LOCATION_LAT_LONG } from "@/mocks/builders/CommonBuilder.ts";
import { ParcelsBuilder } from "@/mocks/builders/ParcelsBuilder.ts";
import {
  PEG_1_OFFSET,
  PEG_2_OFFSET,
  PEG_3_OFFSET,
  PEG_4_OFFSET,
  PEG_5_OFFSET,
  PEG_6_OFFSET,
  PEG_7_OFFSET,
  PEG_8_OFFSET,
  PEG_11_OFFSET,
  PEG_12_OFFSET,
} from "@/mocks/data/mockMarks.ts";

const parcelsBuilderTestOrigin = () => ParcelsBuilder.empty().withOrigin(TEST_LOCATION_LAT_LONG);

export const primaryParcel = parcelsBuilderTestOrigin()
  .withId(1)
  .withActionCode(TypeOfAffectedParcelCode.CREA)
  .withIntentCode(ParcelIntentCode.FSIM)
  .withTopologyClass(ParcelTopologyClassCode.PRIM)
  .withApproxPolygonMetres([[PEG_1_OFFSET, PEG_3_OFFSET, PEG_7_OFFSET, PEG_5_OFFSET, PEG_1_OFFSET]])
  .build();

export const nonPrimaryParcel = parcelsBuilderTestOrigin()
  .withId(2)
  .withActionCode(TypeOfAffectedParcelCode.CREA)
  .withIntentCode(ParcelIntentCode.FSIM)
  .withTopologyClass(ParcelTopologyClassCode.SECO)
  .withApproxPolygonMetres([[PEG_2_OFFSET, PEG_3_OFFSET, PEG_7_OFFSET, PEG_6_OFFSET, PEG_2_OFFSET]])
  .build();

export const centreLineParcel = parcelsBuilderTestOrigin()
  .withId(3)
  .withActionCode(TypeOfAffectedParcelCode.CREA)
  .withIntentCode(ParcelIntentCode.FSIM)
  .withTopologyClass(ParcelTopologyClassCode.SECL)
  .withApproxLineStringMetres([PEG_1_OFFSET, PEG_6_OFFSET])
  .build();

const hydroParcel = parcelsBuilderTestOrigin()
  .withId(4)
  .withActionCode(TypeOfAffectedParcelCode.CREA)
  .withIntentCode(ParcelIntentCode.HYDR)
  .withTopologyClass(ParcelTopologyClassCode.PRIM)
  .withApproxPolygonMetres([[PEG_7_OFFSET, PEG_8_OFFSET, PEG_12_OFFSET, PEG_11_OFFSET, PEG_7_OFFSET]])
  .build();

const roadParcel = parcelsBuilderTestOrigin()
  .withId(5)
  .withActionCode(TypeOfAffectedParcelCode.CREA)
  .withIntentCode(ParcelIntentCode.ROAD)
  .withTopologyClass(ParcelTopologyClassCode.PRIM)
  .withApproxPolygonMetres([[PEG_3_OFFSET, PEG_4_OFFSET, PEG_8_OFFSET, PEG_7_OFFSET, PEG_3_OFFSET]])
  .build();

export const mockPrimaryParcels = () => [primaryParcel, hydroParcel, roadParcel];
