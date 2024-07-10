import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";

import { diagramsBuilderTestOrigin } from "@/mocks/builders/DiagramsBuilder.ts";

export const mockDiagrams = () =>
  diagramsBuilderTestOrigin()
    .withDiagram()
    .withId(1)
    .withDiagramType(CpgDiagramType.SYSN)
    .withApproxMetres([
      [
        [-50, 150],
        [-50, 250],
        [50, 250],
        [50, 150],
        [-50, 150],
      ],
    ])
    .withDiagram()
    .withId(2)
    .withDiagramType(CpgDiagramType.SYSP)
    .withApproxMetres([
      [
        [50, 150],
        [50, 250],
        [150, 250],
        [150, 150],
        [50, 150],
      ],
    ])
    .withDiagram()
    .withId(3)
    .withDiagramType(CpgDiagramType.SYST)
    .withApproxMetres([
      [
        [150, 150],
        [150, 250],
        [250, 250],
        [250, 150],
        [150, 150],
      ],
    ])
    .withDiagram()
    .withId(4)
    .withDiagramType(CpgDiagramType.UDFN)
    .withApproxMetres([
      [
        [-50, 50],
        [-50, 150],
        [50, 150],
        [50, 50],
        [-50, 50],
      ],
    ])
    .withDiagram()
    .withId(5)
    .withDiagramType(CpgDiagramType.UDFP)
    .withApproxMetres([
      [
        [50, 50],
        [50, 150],
        [150, 150],
        [150, 50],
        [50, 50],
      ],
    ])
    .withDiagram()
    .withId(6)
    .withDiagramType(CpgDiagramType.UDFT)
    .withApproxMetres([
      [
        [150, 50],
        [150, 150],
        [250, 150],
        [250, 50],
        [150, 50],
      ],
    ])
    .build();
