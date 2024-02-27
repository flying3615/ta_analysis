import { render, screen } from "@testing-library/react";
import LandingPage from "@components/LandingPage/LandingPage";

describe("Verify rendering of the Landing Page", () => {
  it("should render", async () => {
    render(<LandingPage />);
    expect(await screen.findByText("Landonline Survey Plan Generation")).toBeInTheDocument();
  });
});
