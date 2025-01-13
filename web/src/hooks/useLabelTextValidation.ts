import { useCallback, useEffect, useState } from "react";

import {
  createLineBreakRestrictedEditRegex,
  isLineBreakRestrictedEditType,
} from "@/components/PlanSheets/properties/LabelPropertiesUtils";

export const useLabelTextValidation = ({
  originalLabelText,
  labelType,
}: {
  originalLabelText?: string;
  labelType?: string;
}) => {
  const [labelRegex, setLabelRegex] = useState("");

  useEffect(() => {
    setLabelRegex(createLineBreakRestrictedEditRegex(originalLabelText));
  }, [originalLabelText]);

  type RegExpMatchArrayWithIndices = RegExpMatchArray & { indices: Array<[number, number]> };
  const fixLabelTextWhitespace = useCallback(
    (labelText: string): string => {
      if (!isLineBreakRestrictedEditType(labelType)) return labelText;

      //remove extra spaces and/or new lines
      let fixedText = labelText.replace(/[ ]+/g, " ");
      fixedText = fixedText.replace(/ *[\n]+ */g, "\n");

      //put missing spaces in
      const matches = RegExp(labelRegex, "d").exec(labelText) as RegExpMatchArrayWithIndices;
      if (matches) {
        //the groups in the regex are for the expected space/newlines in the label
        //if they're empty then we need to put a space at that index
        matches
          .slice(1) //first match is the entire string
          .reverse() //we want to be inserting any missing spaces in reverse order otherwise the indexes could be off
          .forEach((value, index) => {
            const insertionIndex = matches.indices.slice(1).reverse()[index]?.[0];
            if (value === "" && insertionIndex) {
              const chars = [...fixedText];
              chars.splice(insertionIndex, 0, " ");
              fixedText = chars.join("");
            }
          });
      }
      return fixedText;
    },
    [labelRegex, labelType],
  );

  const isLabelTextValid = useCallback(
    (labelText: string): boolean => {
      if (!isLineBreakRestrictedEditType(labelType)) return true;

      return labelText.match(labelRegex) !== null;
    },
    [labelType, labelRegex],
  );

  return {
    fixLabelTextWhitespace,
    isLabelTextValid,
  };
};
