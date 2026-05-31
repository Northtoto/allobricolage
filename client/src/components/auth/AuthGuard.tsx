import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireRole?: string;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireRole,
  redirectTo = "/login"
}: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    setLocation(redirectTo);
    return null;
  }

  if (requireRole && user && user.role !== requireRole) {
    setLocation("/");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acces non autorise
          </h2>
          <p className="text-gray-600">
            Vous n avez pas les permissions necessaires pour acceder a cette page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
