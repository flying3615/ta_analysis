import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";

import { diagramsBuilderTestOrigin } from "@/mocks/builders/DiagramsBuilder.ts";

export const mockDiagrams = () =>
  diagramsBuilderTestOrigin()
    .withDiagram()
    .withId(1)
    .withDiagramType(CpgDiagramType.SYSN)
    .withApproxMetres([
      [
        [-30, 70],
        [-30, 170],
        [70, 170],
        [70, 70],
        [-30, 70],
      ],
    ])
    .withDiagram()
    .withId(2)
    .withDiagramType(CpgDiagramType.SYSP)
    .withApproxMetres([
      [
        [-35, 65],
        [-35, 165],
        [65, 165],
        [65, 65],
        [-35, 65],
      ],
    ])
    .withDiagram()
    .withId(3)
    .withDiagramType(CpgDiagramType.SYST)
    .withApproxMetres([
      [
        [-25, 75],
        [-25, 175],
        [75, 175],
        [75, 75],
        [-25, 75],
      ],
    ])
    .withDiagram()
    .withId(4)
    .withDiagramType(CpgDiagramType.UDFN)
    .withApproxMetres([
      [
        [-45, 55],
        [-45, 155],
        [55, 155],
        [55, 55],
        [-45, 55],
      ],
    ])
    .withDiagram()
    .withId(5)
    .withDiagramType(CpgDiagramType.UDFP)
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
    .withId(6)
    .withDiagramType(CpgDiagramType.UDFT)
    .withApproxMetres([
      [
        [-40, 60],
        [-40, 160],
        [60, 160],
        [60, 60],
        [-40, 60],
      ],
    ])
    .build();
