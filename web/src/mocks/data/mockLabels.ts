import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";

import { labelsBuilderTestOrigin } from "@/mocks/builders/LabelsBuilder.ts";

export const mockLabels = () =>
  labelsBuilderTestOrigin()
    .withLabel()
    .withId(1)
    .withLabelType(CpgDiagramType.UDFN)
    .withApproxMetres([0, 150])
    .withLabelName("Diag. A")
    .withLabel()
    .withId(2)
    .withLabelType(CpgDiagramType.UDFP)
    .withApproxMetres([100, 150])
    .withLabelName("Diag. A")
    .withLabel()
    .withId(3)
    .withLabelType(CpgDiagramType.UDFT)
    .withApproxMetres([200, 150])
    .withLabelName("Diag. A")
    .build();
