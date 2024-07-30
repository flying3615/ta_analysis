import { LuiButton, LuiCounter, LuiIcon } from "@linzjs/lui";
import React from "react";

interface IPagination {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => () => void;
}

const FooterPagination: React.FC<IPagination> = ({ totalPages, currentPage, onPageChange }) => {
  const cls = "lui-button-icon lui-button-con-only lui-button-tertiary";

  return (
    <div className="pagination">
      <LuiButton disabled={currentPage <= 1} level="tertiary" onClick={onPageChange(1)} className={cls}>
        <LuiIcon name="ic_double_arrow_left" alt="First" size="md" />
      </LuiButton>

      <LuiButton disabled={currentPage <= 1} level="tertiary" onClick={onPageChange(currentPage - 1)} className={cls}>
        <LuiIcon name="ic_keyboard_arrow_left" alt="Previous" size="md" />
      </LuiButton>
      <>
        Page <LuiCounter selectedNum={currentPage} totalNum={currentPage} shape="rect" /> of{" "}
        <LuiCounter selectedNum={totalPages} totalNum={totalPages} shape="rect" />
      </>
      <LuiButton
        disabled={currentPage === totalPages}
        level="tertiary"
        onClick={onPageChange(currentPage + 1)}
        className={cls}
      >
        <LuiIcon name="ic_keyboard_arrow_right" alt="Next" size="md" />
      </LuiButton>
      <LuiButton
        disabled={currentPage === totalPages}
        level="tertiary"
        onClick={onPageChange(totalPages)}
        className={cls}
      >
        <LuiIcon name="ic_double_arrow_right" alt="Last" size="md" />
      </LuiButton>
    </div>
  );
};

export default FooterPagination;
