import { Meta, StoryFn } from "@storybook/react";
import React, { useState } from "react";

import FooterPagination from "@/components/Footer/FooterPagination.tsx";

export default {
  title: "PlanSheets/PlanSheetsFooter/FooterPagination",
  component: FooterPagination,
} as Meta;

interface IPagination {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Template: StoryFn<IPagination> = (args) => {
  const [currentPage, setCurrentPage] = useState(args.currentPage);
  const handlePageChange = (page: number) => () => {
    setCurrentPage(page);
    args.onPageChange(page);
  };

  return <FooterPagination {...args} currentPage={currentPage} onPageChange={handlePageChange} />;
};

export const Default = Template.bind({});
Default.args = {
  totalPages: 10,
  currentPage: 1,
  onPageChange: (page: number) => console.log(`Page changed to: ${page}`),
};
