import { screen } from "@testing-library/react";

import { NoPageMessage } from "@/components/Footer/NoPageMessage";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";

describe("NoPageMessage component", () => {
  it("renders the component with text and button", () => {
    renderWithReduxProvider(<NoPageMessage />);

    expect(screen.getByText("It looks like your plan does not have any pages")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add new page/i })).toBeInTheDocument();
    expect(screen.getByText(/or hit to add new page/i)).toBeInTheDocument();
    expect(screen.getByText(/Return/i)).toBeInTheDocument();
  });
});
