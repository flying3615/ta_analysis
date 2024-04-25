import { Meta, StoryFn } from "@storybook/react";
import Header from "../Header";
import { MemoryRouter } from "react-router-dom";

// react-menu styles
import "@szhsin/react-menu/dist/index.css";

export default {
  title: "Header",
  component: Header,
} as Meta<typeof Header>;

export const Default: StoryFn<typeof Header> = () => {
  return (
    <MemoryRouter initialEntries={["/plan-generation/define-diagrams/12345"]}>
      <Header onNavigate={() => {}} transactionId="12345" view="Diagrams" />
    </MemoryRouter>
  );
};
