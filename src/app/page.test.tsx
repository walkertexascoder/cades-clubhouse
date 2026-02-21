import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import Home from "./page";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

describe("Triple-click secret", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockImplementation(async () => {
      return Response.json({
        date: "2026-02-21",
        fact: "George Washington had wooden teeth!",
        starWars: "Just like Chewbacca chews on everything!",
        imagePrompt: "cartoon George Washington smiling",
        imageUrl: "https://blob.example.com/image.png",
        generatedAt: "2026-02-21T06:00:00Z",
      });
    });
  });

  it("shows loading state after triple-clicking the clubhouse image", async () => {
    const user = userEvent.setup();

    // Block the fact fetch so loading stays visible
    let resolveFact!: (value: Response) => void;
    vi.spyOn(global, "fetch").mockImplementation(
      () => new Promise((resolve) => { resolveFact = resolve; })
    );

    render(<Home />);
    const image = screen.getByAltText(
      /castle.treehouse growing out of the world/i
    );

    await user.click(image);
    await user.click(image);
    await user.click(image);

    expect(screen.getByText(/discovering a secret/i)).toBeInTheDocument();

    // Clean up the pending promise
    await act(async () => {
      resolveFact(
        Response.json({
          date: "2026-02-21",
          fact: "test",
          starWars: "test",
          imageUrl: "https://blob.example.com/image.png",
        })
      );
    });
  });

  it("shows facts after API response", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const image = screen.getByAltText(
      /castle.treehouse growing out of the world/i
    );

    await user.click(image);
    await user.click(image);
    await user.click(image);

    // Wait for facts to appear
    expect(
      await screen.findByText(/george washington had wooden teeth/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/just like chewbacca chews on everything/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/did you know/i)).toBeInTheDocument();
  });

  it("returns to clubhouse after triple-clicking facts area", async () => {
    const user = userEvent.setup();
    render(<Home />);

    // First, trigger facts
    const image = screen.getByAltText(
      /castle.treehouse growing out of the world/i
    );
    await user.click(image);
    await user.click(image);
    await user.click(image);

    // Wait for facts
    await screen.findByText(/george washington had wooden teeth/i);

    // Triple-click on the facts area to go back
    const factsArea = screen.getByText(/did you know/i).closest("div")!;
    await user.click(factsArea);
    await user.click(factsArea);
    await user.click(factsArea);

    // Should be back at clubhouse
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /cade's clubhouse/i,
      })
    ).toBeInTheDocument();
  });
});
