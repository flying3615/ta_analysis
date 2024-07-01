import { ParcelsBuilder } from "@/mocks/builders/ParcelsBuilder.ts";
import { ParcelIntentCode } from "@linz/luck-syscodes/build/js/ParcelIntentCode";
import {
  PEG_11_OFFSET,
  PEG_12_OFFSET,
  PEG_1_OFFSET,
  PEG_2_OFFSET,
  PEG_3_OFFSET,
  PEG_4_OFFSET,
  PEG_5_OFFSET,
  PEG_6_OFFSET,
  PEG_7_OFFSET,
  PEG_8_OFFSET,
} from "@/mocks/data/mockMarks.ts";
import { TEST_LOCATION_LAT_LONG } from "@/mocks/builders/CommonBuilder.ts";

const parcelsBuilderTestOrigin = () => ParcelsBuilder.empty().withOrigin(TEST_LOCATION_LAT_LONG);

const primaryParcel = parcelsBuilderTestOrigin()
  .withId(1)
  .withActionCode("CREA", "Created")
  .withIntentCode(ParcelIntentCode.FSIM)
  .withTopologyClass("PRIM")
  .withApproxPolygonMetres([[PEG_1_OFFSET, PEG_3_OFFSET, PEG_7_OFFSET, PEG_5_OFFSET, PEG_1_OFFSET]])
  .build();

export const nonPrimaryParcel = parcelsBuilderTestOrigin()
  .withId(2)
  .withActionCode("CREA", "Created")
  .withIntentCode(ParcelIntentCode.FSIM)
  .withTopologyClass("SECO")
  .withApproxPolygonMetres([[PEG_2_OFFSET, PEG_3_OFFSET, PEG_7_OFFSET, PEG_6_OFFSET, PEG_2_OFFSET]])
  .build();

export const centreLineParcel = parcelsBuilderTestOrigin()
  .withId(3)
  .withActionCode("CREA", "Created")
  .withIntentCode(ParcelIntentCode.FSIM)
  .withTopologyClass("SECL")
  .withApproxLineStringMetres([PEG_1_OFFSET, PEG_6_OFFSET])
  .build();

const hydroParcel = parcelsBuilderTestOrigin()
  .withId(4)
  .withActionCode("CREA", "Created")
  .withIntentCode(ParcelIntentCode.HYDR)
  .withTopologyClass("PRIM")
  .withApproxPolygonMetres([[PEG_7_OFFSET, PEG_8_OFFSET, PEG_12_OFFSET, PEG_11_OFFSET, PEG_7_OFFSET]])
  .build();

const roadParcel = parcelsBuilderTestOrigin()
  .withId(5)
  .withActionCode("CREA", "Created")
  .withIntentCode(ParcelIntentCode.ROAD)
  .withTopologyClass("PRIM")
  .withApproxPolygonMetres([[PEG_3_OFFSET, PEG_4_OFFSET, PEG_8_OFFSET, PEG_7_OFFSET, PEG_3_OFFSET]])
  .build();

export const mockPrimaryParcels = () => [primaryParcel, hydroParcel, roadParcel];
