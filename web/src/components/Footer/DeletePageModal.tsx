import { LuiAlertModalV2, LuiButton, LuiModalV2 } from "@linzjs/lui";

import { IPopupModal } from "@/components/Footer/PageManager.tsx";

const DeletePageModal = ({ closeModal, pageInfo, callback }: IPopupModal) => (
  <LuiAlertModalV2
    level="warning"
    shouldCloseOnOverlayClick
    headingText="Delete page?"
    helpLink="https://www.linz.govt.nz/"
    onClose={closeModal}
  >
    <p>
      Are you sure you want to remove {pageInfo.activeSheet.replace(/\b\w/g, (char) => char.toUpperCase())} Page{" "}
      {pageInfo.activePageNumber}?
    </p>
    <LuiModalV2.Buttons>
      <LuiButton title="Cancel delete" level="tertiary" onClick={closeModal}>
        Cancel
      </LuiButton>
      <LuiButton
        title="Proceed delete"
        level="tertiary"
        className="delete-page"
        onClick={() => {
          callback(pageInfo.activePageNumber);
          closeModal();
        }}
      >
        Delete
      </LuiButton>
    </LuiModalV2.Buttons>
  </LuiAlertModalV2>
);

export default DeletePageModal;
