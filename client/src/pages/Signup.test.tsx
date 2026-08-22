import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const setLocation = vi.fn();
vi.mock("wouter", () => ({ useLocation: () => ["/signup", setLocation] }));

vi.mock("@/components/layout/Header", () => ({ Header: () => <div data-testid="mock-header" /> }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => <div data-testid="mock-footer" /> }));
vi.mock("@/components/auth/GoogleSignInButton", () => ({ GoogleSignInButton: () => null }));

import Signup from "./Signup";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Signup account type selection", () => {
  it("renders both the client and technician options", () => {
    render(<Signup />);
    expect(screen.getByTestId("card-signup-client")).toBeInTheDocument();
    expect(screen.getByTestId("card-signup-technician")).toBeInTheDocument();
  });

  it("navigates to /signup/client when the client card is clicked", () => {
    render(<Signup />);
    fireEvent.click(screen.getByTestId("card-signup-client"));
    expect(setLocation).toHaveBeenCalledWith("/signup/client");
  });

  it("navigates to /signup/client when the client CTA button is clicked", () => {
    render(<Signup />);
    fireEvent.click(screen.getByTestId("button-signup-client"));
    expect(setLocation).toHaveBeenCalledWith("/signup/client");
  });

  it("navigates to /signup/technician when the technician card is clicked", () => {
    render(<Signup />);
    fireEvent.click(screen.getByTestId("card-signup-technician"));
    expect(setLocation).toHaveBeenCalledWith("/signup/technician");
  });

  it("navigates to /signup/technician when the technician CTA button is clicked", () => {
    render(<Signup />);
    fireEvent.click(screen.getByTestId("button-signup-technician"));
    expect(setLocation).toHaveBeenCalledWith("/signup/technician");
  });
});

describe("Signup navigation to login", () => {
  it("navigates to /login when the login link is clicked", () => {
    render(<Signup />);
    fireEvent.click(screen.getByTestId("link-to-login"));
    expect(setLocation).toHaveBeenCalledWith("/login");
  });
});
