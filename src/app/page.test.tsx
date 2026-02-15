import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import Home from "./page";

afterEach(cleanup);

describe("Homepage", () => {
  it("renders 'Cade\\'s Clubhouse' as an h1 heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", {
      level: 1,
      name: /cade's clubhouse/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("displays the clubhouse image with appropriate alt text", () => {
    render(<Home />);
    const image = screen.getByAltText(
      /castle.treehouse growing out of the world/i
    );
    expect(image).toBeInTheDocument();
  });
});
