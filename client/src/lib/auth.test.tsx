import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api-client", () => ({
  get: (...args: unknown[]) => get(...args),
  post: (...args: unknown[]) => post(...args),
}));

import { AuthProvider, useAuth } from "./auth";

const TOKEN_KEY = "allobricolage_token";
const USER_KEY = "allobricolage_user";

function TestConsumer() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="username">{user?.username ?? ""}</div>
      <button onClick={() => login("ahmed", "secret")}>do-login</button>
      <button onClick={() => logout()}>do-logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("AuthProvider", () => {
  it("starts unauthenticated when no token is stored", async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(get).not.toHaveBeenCalled();
  });

  it("restores an authenticated session on mount when a token is already stored", async () => {
    localStorage.setItem(TOKEN_KEY, "existing-token");
    get.mockResolvedValue({ id: "u1", username: "ahmed", role: "client", name: "Ahmed" });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));
    expect(get).toHaveBeenCalledWith("/auth/me");
    expect(screen.getByTestId("username")).toHaveTextContent("ahmed");
    expect(JSON.parse(localStorage.getItem(USER_KEY)!)).toMatchObject({ username: "ahmed" });
  });

  it("clears stored auth state when restoring the session fails", async () => {
    localStorage.setItem(TOKEN_KEY, "stale-token");
    localStorage.setItem(USER_KEY, JSON.stringify({ id: "u1", username: "ahmed" }));
    get.mockRejectedValue(new Error("unauthorized"));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it("login persists the token and user then updates auth state", async () => {
    post.mockResolvedValue({
      token: "new-token",
      user: { id: "u2", username: "sara", role: "client", name: "Sara" },
    });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    fireEvent.click(screen.getByText("do-login"));

    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));
    expect(post).toHaveBeenCalledWith("/auth/login", { username: "ahmed", password: "secret" });
    expect(localStorage.getItem(TOKEN_KEY)).toBe("new-token");
    expect(JSON.parse(localStorage.getItem(USER_KEY)!)).toMatchObject({ username: "sara" });
    expect(screen.getByTestId("username")).toHaveTextContent("sara");
  });

  it("logout clears stored auth state and user", async () => {
    // jsdom's window.location.reload is a non-configurable own property, so it
    // can't be spied on directly; logout() calls it as a fire-and-forget side
    // effect (jsdom logs "Not implemented: navigation" and continues), so we
    // only assert on the state logout is responsible for clearing.
    localStorage.setItem(TOKEN_KEY, "existing-token");
    get.mockResolvedValue({ id: "u1", username: "ahmed", role: "client", name: "Ahmed" });
    post.mockResolvedValue({});

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));

    fireEvent.click(screen.getByText("do-logout"));

    await waitFor(() => expect(post).toHaveBeenCalledWith("/auth/logout", {}));
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it("logout still clears local state when the logout request fails", async () => {
    localStorage.setItem(TOKEN_KEY, "existing-token");
    get.mockResolvedValue({ id: "u1", username: "ahmed", role: "client", name: "Ahmed" });
    post.mockRejectedValue(new Error("network down"));

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));

    fireEvent.click(screen.getByText("do-logout"));

    await waitFor(() => expect(localStorage.getItem(TOKEN_KEY)).toBeNull());
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });

  it("throws when useAuth is called outside of an AuthProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Bad() {
      useAuth();
      return null;
    }
    expect(() => render(<Bad />)).toThrow("useAuth must be used within AuthProvider");
    consoleSpy.mockRestore();
  });
});
