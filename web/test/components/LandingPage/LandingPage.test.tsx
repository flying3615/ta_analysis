import LandingPage from "@components/LandingPage/LandingPage";
import { render, screen } from "@testing-library/react";

describe("Verify rendering of the Landing Page", () => {
  it("should render", async () => {
    render(<LandingPage />);
    expect(await screen.findByText("Landonline Survey Plan Generation")).toBeInTheDocument();
  });
});
