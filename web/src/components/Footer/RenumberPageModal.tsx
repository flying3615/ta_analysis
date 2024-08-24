import { LuiButton, LuiModalV2, LuiTextInput } from "@linzjs/lui";
import { ChangeEvent, useState } from "react";

import { IPopupModal } from "@/components/Footer/PageManager.tsx";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { getFilteredPages } from "@/redux/planSheets/planSheetsSlice.ts";

export const RenumberPageModal = ({ closeModal, pageInfo, callback }: IPopupModal) => {
  const { totalPages } = useAppSelector(getFilteredPages);
  const [renumberError, setRenumberError] = useState("");
  const [renumberWarning, setRenumberWarning] = useState("");
  const [newPageNumber, setNewPageNumber] = useState<number | undefined>(undefined);

  const isValidPageNumber = (pageNumber: number | undefined) =>
    pageNumber !== undefined && !isNaN(Number(pageNumber)) && pageNumber > 0 && pageNumber <= totalPages;
  const isCurrentPage = (pageNumber: number | undefined) => pageNumber === pageInfo.activePageNumber;

  const renumberInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setNewPageNumber(newValue);
    validatePageNumber(newValue);
  };

  const validatePageNumber = (pageNumber: number | undefined) => {
    if (!isValidPageNumber(pageNumber)) {
      setRenumberError(`Enter a number between 1 and ${totalPages}`);
      setRenumberWarning("");
      return;
    }

    if (isCurrentPage(pageNumber)) {
      setRenumberError("");
      setRenumberWarning(`Diagram is already on page ${pageInfo.activePageNumber}`);
      return;
    }

    setRenumberError("");
    setRenumberWarning("");
  };

  const renumberPage = () => {
    if (isValidPageNumber(newPageNumber) && newPageNumber !== undefined) {
      closeModal();
      callback(newPageNumber);
    }
  };

  return (
    <LuiModalV2
      headingText="Renumber page"
      shouldCloseOnOverlayClick
      preventAutoFocus
      onClose={closeModal}
      helpLink="https://www.linz.govt.nz/"
    >
      <LuiTextInput
        label={`Renumber ${pageInfo.activeSheet.replace(/\b\w/g, (char) => char.toUpperCase())} Page ${pageInfo.activePageNumber} to:`}
        size="sm"
        inputProps={{ type: "number", pattern: "\\d*", placeholder: "Enter page number" }}
        onChange={renumberInputChange}
        error={renumberError}
        warning={renumberWarning}
      />
      <LuiModalV2.Buttons>
        <LuiButton level="tertiary" onClick={closeModal}>
          Cancel
        </LuiButton>
        <LuiButton level="tertiary" disabled={!!renumberError || newPageNumber === undefined} onClick={renumberPage}>
          Continue
        </LuiButton>
      </LuiModalV2.Buttons>
    </LuiModalV2>
  );
};
