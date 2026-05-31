import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage, isErrorCode, ApiRequestError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

interface ApiErrorHandlerOptions {
  /** Show a toast notification on error */
  showToast?: boolean;
  /** Custom toast title */
  title?: string;
  /** Redirect to login on 401 */
  redirectOnAuth?: boolean;
  /** Callback on error */
  onError?: (error: ApiRequestError) => void;
}

export function useApiError() {
  const { toast } = useToast();
  const { logout } = useAuth();

  const handleError = useCallback(
    (error: unknown, options: ApiErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        title = "Erreur",
        redirectOnAuth = true,
        onError,
      } = options;

      if (error instanceof ApiRequestError) {
        if (redirectOnAuth && error.statusCode === 401) {
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter.",
            variant: "destructive",
          });
          logout();
          return;
        }

        if (isErrorCode(error, "TOO_MANY_REQUESTS")) {
          toast({
            title: "Trop de requêtes",
            description: error.message,
            variant: "destructive",
          });
          if (onError) onError(error);
          return;
        }

        if (showToast) {
          toast({
            title,
            description: getErrorMessage(error),
            variant: "destructive",
          });
        }

        if (onError) onError(error);
        return;
      }

      if (showToast) {
        toast({
          title,
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }

      if (onError && error instanceof ApiRequestError) {
        onError(error);
      }
    },
    [toast, logout]
  );

  return { handleError, getErrorMessage };
}
