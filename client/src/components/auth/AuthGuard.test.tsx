import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const setLocation = vi.fn();
vi.mock("wouter", () => ({ useLocation: () => ["/", setLocation] }));

const useAuthMock = vi.fn();
vi.mock("@/lib/auth", () => ({ useAuth: () => useAuthMock() }));

import { AuthGuard } from "./AuthGuard";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthGuard", () => {
  it("shows a loading spinner while auth state is resolving, without rendering children", () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: true, isAuthenticated: false });

    const { container } = render(
      <AuthGuard>
        <div>secret</div>
      </AuthGuard>
    );

    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(setLocation).not.toHaveBeenCalled();
  });

  it("redirects an unauthenticated user to the default login route and renders nothing", async () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });

    render(
      <AuthGuard>
        <div>secret</div>
      </AuthGuard>
    );

    await waitFor(() => expect(setLocation).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("redirects to a custom redirectTo path when provided", async () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });

    render(
      <AuthGuard redirectTo="/signup">
        <div>secret</div>
      </AuthGuard>
    );

    await waitFor(() => expect(setLocation).toHaveBeenCalledWith("/signup"));
  });

  it("renders children for an authenticated user on a protected route", () => {
    useAuthMock.mockReturnValue({ user: { role: "client" }, isLoading: false, isAuthenticated: true });

    render(
      <AuthGuard>
        <div>secret</div>
      </AuthGuard>
    );

    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(setLocation).not.toHaveBeenCalled();
  });

  it("renders children for an unauthenticated user when requireAuth is false", () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });

    render(
      <AuthGuard requireAuth={false}>
        <div>public content</div>
      </AuthGuard>
    );

    expect(screen.getByText("public content")).toBeInTheDocument();
    expect(setLocation).not.toHaveBeenCalled();
  });

  it("denies access and redirects home when the user's role does not match requireRole", async () => {
    useAuthMock.mockReturnValue({ user: { role: "client" }, isLoading: false, isAuthenticated: true });

    render(
      <AuthGuard requireRole="admin">
        <div>secret</div>
      </AuthGuard>
    );

    await waitFor(() => expect(setLocation).toHaveBeenCalledWith("/"));
    expect(screen.getByText(/Acces non autorise/)).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders children when the user's role matches requireRole", () => {
    useAuthMock.mockReturnValue({ user: { role: "admin" }, isLoading: false, isAuthenticated: true });

    render(
      <AuthGuard requireRole="admin">
        <div>secret</div>
      </AuthGuard>
    );

    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(setLocation).not.toHaveBeenCalled();
  });
});
