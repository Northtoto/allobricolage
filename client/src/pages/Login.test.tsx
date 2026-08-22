import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const login = vi.fn();
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ login }) }));

const setLocation = vi.fn();
vi.mock("wouter", () => ({ useLocation: () => ["/login", setLocation] }));

const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

vi.mock("@/components/layout/Header", () => ({ Header: () => <div data-testid="mock-header" /> }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => <div data-testid="mock-footer" /> }));
vi.mock("@/components/auth/GoogleSignInButton", () => ({ GoogleSignInButton: () => null }));

import Login from "./Login";

function fillForm(username: string, password: string) {
  fireEvent.change(screen.getByLabelText(/nom d'utilisateur/i), { target: { value: username } });
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: password } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Login required-field validation", () => {
  it("shows an error toast and never calls login when fields are empty", () => {
    render(<Login />);
    submit();

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Erreur",
      description: "Veuillez remplir tous les champs",
      variant: "destructive",
    }));
    expect(login).not.toHaveBeenCalled();
  });

  it("blocks submission when only the password is filled in", () => {
    render(<Login />);
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "secret123" } });
    submit();

    expect(login).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
  });
});

describe("Login successful authentication", () => {
  it("calls login with the entered credentials", async () => {
    login.mockResolvedValueOnce(undefined);
    render(<Login />);
    fillForm("john_doe", "secret123");
    submit();

    await waitFor(() => expect(login).toHaveBeenCalledWith("john_doe", "secret123"));
  });

  it("navigates to the technician dashboard when the stored user is a technician", async () => {
    login.mockImplementationOnce(async () => {
      localStorage.setItem("allobricolage_user", JSON.stringify({ id: "u1", role: "technician" }));
    });
    render(<Login />);
    fillForm("john_doe", "secret123");
    submit();

    await waitFor(() => expect(setLocation).toHaveBeenCalledWith("/technician-dashboard"));
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Succes" }));
  });

  it("navigates to the client dashboard when the stored user is a client", async () => {
    login.mockImplementationOnce(async () => {
      localStorage.setItem("allobricolage_user", JSON.stringify({ id: "u2", role: "client" }));
    });
    render(<Login />);
    fillForm("jane_doe", "secret123");
    submit();

    await waitFor(() => expect(setLocation).toHaveBeenCalledWith("/client-dashboard"));
  });

  it("falls back to the homepage when no user was persisted", async () => {
    login.mockResolvedValueOnce(undefined);
    render(<Login />);
    fillForm("john_doe", "secret123");
    submit();

    await waitFor(() => expect(setLocation).toHaveBeenCalledWith("/"));
  });
});

describe("Login failed authentication", () => {
  it("shows the backend's own error message and does not navigate", async () => {
    login.mockRejectedValueOnce(new Error("Nom d'utilisateur ou mot de passe incorrect"));
    render(<Login />);
    fillForm("john_doe", "wrongpass");
    submit();

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Erreur",
      description: "Nom d'utilisateur ou mot de passe incorrect",
      variant: "destructive",
    })));
    expect(setLocation).not.toHaveBeenCalled();
  });

  it("falls back to a generic message when the rejection carries no message", async () => {
    login.mockRejectedValueOnce("boom");
    render(<Login />);
    fillForm("john_doe", "wrongpass");
    submit();

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      description: "Identifiants invalides",
      variant: "destructive",
    })));
    expect(setLocation).not.toHaveBeenCalled();
  });

  it("re-enables the form after a failed login attempt", async () => {
    login.mockRejectedValueOnce(new Error("Compte verrouillé"));
    render(<Login />);
    fillForm("john_doe", "wrongpass");
    submit();

    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /se connecter/i })).not.toBeDisabled();
    expect(screen.getByLabelText(/nom d'utilisateur/i)).not.toBeDisabled();
  });
});

describe("Login navigation to signup", () => {
  it("navigates to /signup when the signup link is clicked", () => {
    render(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));
    expect(setLocation).toHaveBeenCalledWith("/signup");
  });
});
