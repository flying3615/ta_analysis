import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { usePageLabelEdit } from "@/hooks/usePageLabelEdit";
import { usePageLineEdit } from "@/hooks/usePageLineEdit";
import { getCopiedElements } from "@/redux/planSheets/planSheetsSlice";
import { Position } from "@/util/positionUtil";

export const useEditContextMenu = () => {
  const { cyto } = useCytoscapeContext();
  const { pastePageLabels } = usePageLabelEdit(cyto);
  const { pastePageLines } = usePageLineEdit(cyto);
  const copiedElements = useAppSelector(getCopiedElements);

  const buildEditMenuItems = (clickPosition: Position): MenuItem[] => {
    return [
      {
        title: "Cut",
        disabled: true,
      },
      {
        title: "Copy",
        disabled: true,
      },
      {
        title: "Paste",
        callback: () => {
          if (copiedElements) {
            switch (copiedElements.type) {
              case "label":
                pastePageLabels(clickPosition);
                break;
              case "line":
                pastePageLines(clickPosition);
                break;
              default:
                break;
            }
          }
        },
        disabled: !(copiedElements && copiedElements.elements && copiedElements.elements.length > 0),
      },
    ] as MenuItem[];
  };

  return {
    buildEditMenuItems,
  };
};
