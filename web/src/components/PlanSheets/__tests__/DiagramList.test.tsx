import { render, screen } from "@testing-library/react";

import { nestedSurveyPlan, nestedTitlePlan } from "@/components/PlanSheets/__tests__/data/plansheetDiagramData.ts";
import { DiagramList } from "@/components/PlanSheets/DiagramList.tsx";

describe("The Diagram list tree", () => {
  it("displays all title diagram labels correctly", () => {
    const titleDiagramList = nestedTitlePlan.diagrams;
    const allLabelsForDiagrams: string[] = titleDiagramList
      .flatMap((m) => m.labels.filter((l) => l.labelType == "diagram"))
      .map((l) => l.displayText);
    // check that a label has been found for all diagrams
    expect(allLabelsForDiagrams).toHaveLength(titleDiagramList.length);
    render(<DiagramList diagrams={titleDiagramList} />);
    for (const diagramLabel of allLabelsForDiagrams) {
      expect(screen.getByText(diagramLabel)).toBeInTheDocument();
    }

    const orderedDiagramNames = screen.queryAllByText(/Diag/).map((elem) => elem.textContent);
    expect(orderedDiagramNames).toEqual([
      "System Generated Primary Diagram",
      "System Generated Non Primary Diagram",
      "Diag. A",
      "Diag. AA",
      "Diag. AAA",
      "Diag. AAAA",
      "Diag. AB",
      "Diag. ABA",
      "Diag. ABAA",
      "Diag. ABAAA",
      "Diag. AC",
      "Diag. ACA",
      "Diag. AD",
    ]);
  });

  it("displays all survey diagram labels correctly", () => {
    const surveyDiagramList = nestedSurveyPlan.diagrams;
    const allLabelsForDiagrams: string[] = surveyDiagramList
      .flatMap((m) => m.labels.filter((l) => l.labelType == "diagram"))
      .map((l) => l.displayText);
    // check that a label has been found for all diagrams
    expect(allLabelsForDiagrams).toHaveLength(surveyDiagramList.length);
    render(<DiagramList diagrams={surveyDiagramList} />);
    for (const diagramLabel of allLabelsForDiagrams) {
      expect(screen.getByText(diagramLabel)).toBeInTheDocument();
    }

    const orderedDiagramNames = screen.queryAllByText(/Diag/).map((elem) => elem.textContent);
    expect(orderedDiagramNames).toEqual(["System Generated Traverse Diagram", "Diag. A", "Diag. AA"]);
  });
});
