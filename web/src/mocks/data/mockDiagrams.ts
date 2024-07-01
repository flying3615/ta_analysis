import { diagramsBuilderTestOrigin } from "@/mocks/builders/DiagramsBuilder.ts";
import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";

export const mockDiagrams = () =>
  diagramsBuilderTestOrigin()
    .withDiagram()
    .withId(1)
    .withDiagramType(CpgDiagramType.SYSP)
    .withApproxMetres([
      [
        [-50, 50],
        [150, 50],
        [150, 150],
        [-50, 150],
        [-50, 50],
      ],
    ])
    .withDiagram()
    .withId(2)
    .withDiagramType(CpgDiagramType.SYSP)
    .withApproxMetres([
      [
        [-50, 50],
        [250, 50],
        [250, 250],
        [150, 250],
        [150, 150],
        [-50, 150],
        [-50, 50],
      ],
    ])
    .build();
