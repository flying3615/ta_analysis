import { render, screen } from "@testing-library/react";
import App from "./App";

describe("Verify rendering of application", () => {
  it("should render the homepage", async () => {
    render(<App />);
    expect(await screen.findByText("Vite + React")).toBeInTheDocument();
  });
});
