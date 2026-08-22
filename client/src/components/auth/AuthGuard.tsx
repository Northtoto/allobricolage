import { ReactNode, useEffect } from "react";
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

  const deniedByAuth = !isLoading && requireAuth && !isAuthenticated;
  const deniedByRole = !isLoading && !deniedByAuth && !!requireRole && !!user && user.role !== requireRole;

  // Navigate from an effect, not during render — calling wouter's setLocation
  // synchronously in the render body updates another component (the router)
  // while this one is still rendering.
  useEffect(() => {
    if (deniedByAuth) {
      setLocation(redirectTo);
    } else if (deniedByRole) {
      setLocation("/");
    }
  }, [deniedByAuth, deniedByRole, redirectTo, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (deniedByAuth) {
    return null;
  }

  if (deniedByRole) {
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
