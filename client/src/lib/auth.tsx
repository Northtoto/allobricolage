import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  username: string;
  name?: string;
  role: "client" | "technician";
  email?: string;
  profilePicture?: string;
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
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/me", undefined);
        const userData = await res.json();
        setUser(userData);
      } catch (error) {
        // User not logged in, that's fine
        console.log("No active session");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    const userData = await res.json();
    setUser(userData);
  };

  const signup = async (username: string, password: string, name: string, role: "client" | "technician") => {
    const res = await apiRequest("POST", "/api/auth/signup", { username, password, name, role });
    const userData = await res.json();
    setUser(userData);
  };

  const signupTechnician = async (data: TechnicianSignupData) => {
    const res = await apiRequest("POST", "/api/auth/signup", { 
      ...data, 
      role: "technician" 
    });
    const userData = await res.json();
    setUser(userData);
  };

  const signupClient = async (data: ClientSignupData) => {
    const res = await apiRequest("POST", "/api/auth/signup", { 
      ...data, 
      role: "client" 
    });
    const userData = await res.json();
    setUser(userData);
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, signupTechnician, signupClient, logout, isAuthenticated: !!user }}>
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
