import { createContext, useContext, useState, useEffect } from "react";
import { get, post } from "./api-client";
import type { User } from "@shared/schema";

export interface AuthUser extends User {
  role: "client" | "technician" | "admin";
}

interface TechnicianSignupData {
  username: string;
  password: string;
  name: string;
  phone: string;
  city: string;
  services: string[];
  yearsExperience?: string;
  hourlyRate?: string;
  bio?: string;
}

interface ClientSignupData {
  username: string;
  password: string;
  name: string;
  phone: string;
  city: string;
  businessName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, name: string, role: "client" | "technician") => Promise<void>;
  signupTechnician: (data: TechnicianSignupData) => Promise<void>;
  signupClient: (data: ClientSignupData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  googleLogin: (credential: string) => Promise<void>;
}

interface AuthResponse {
  user: User;
  token: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "allobricolage_token";
const USER_KEY = "allobricolage_user";

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setAuthState(response: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, response.token);
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
}

function clearAuthState(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await get<AuthUser>("/auth/me");
        setUser(data);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
      } catch {
        clearAuthState();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const data = await post<AuthResponse>("/auth/login", { username, password });
    setAuthState(data);
    setUser(data.user as AuthUser);
  };

  const signup = async (username: string, password: string, name: string, role: "client" | "technician") => {
    const data = await post<AuthResponse>("/auth/signup", { username, password, name, role });
    setAuthState(data);
    setUser(data.user as AuthUser);
  };

  const signupTechnician = async (signupData: TechnicianSignupData) => {
    const data = await post<AuthResponse>("/auth/signup", {
      ...signupData,
      role: "technician",
    });
    setAuthState(data);
    setUser(data.user as AuthUser);
  };

  const signupClient = async (signupData: ClientSignupData) => {
    const data = await post<AuthResponse>("/auth/signup", {
      ...signupData,
      role: "client",
    });
    setAuthState(data);
    setUser(data.user as AuthUser);
  };

  const googleLogin = async (credential: string) => {
    const data = await post<AuthResponse>("/auth/google", { credential });
    setAuthState(data);
    setUser(data.user as AuthUser);
  };

  const logout = async () => {
    try {
      await post("/auth/logout", {});
    } catch {
      // Ignore logout errors
    }
    clearAuthState();
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      signup,
      signupTechnician,
      signupClient,
      logout,
      isAuthenticated: !!user,
      googleLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
