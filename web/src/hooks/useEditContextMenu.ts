import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { usePageLabelEdit } from "@/hooks/usePageLabelEdit";
import { Position } from "@/util/positionUtil";

export const useEditContextMenu = () => {
  const { cyto } = useCytoscapeContext();
  const { pastePageLabels, canPaste: canPasteLabel } = usePageLabelEdit(cyto);

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
        callback: () => pastePageLabels(clickPosition),
        disabled: !canPasteLabel,
      },
    ] as MenuItem[];
  };

  return {
    buildEditMenuItems,
  };
};
