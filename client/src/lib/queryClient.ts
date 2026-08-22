import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { get, ApiRequestError } from "./api-client";

// True for a 401 from either error path used in this file: ApiRequestError (thrown
// by get(), which carries the real statusCode) and the plain `${status}: ${text}`
// Error thrown by apiRequest() below (string-matching status here, not error.message,
// since the backend's message text has no reason to contain "401").
function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    return error.statusCode === 401;
  }
  return error instanceof Error && /^401:/.test(error.message);
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  // VITE_BACKEND_URL: empty for same-origin (Vite proxy / Express static), or full backend URL for separate deployments
  const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL ?? "";
  // Normalize path to always start with /api/
  const endpointUrl = url.startsWith("/api/") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;

  const token = localStorage.getItem("allobricolage_token");
  const headers: Record<string, string> = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_BASE}${endpointUrl}`, {
    method: method.toUpperCase(),
    headers,
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const apiResponse = await response.json() as ApiResponse;
    if (apiResponse.success && apiResponse.data !== undefined) {
      return new Response(JSON.stringify(apiResponse.data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(apiResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  const unauthorizedBehavior = options.on401;
  return async ({ queryKey }) => {
    const rawPath = queryKey.join("/");
    // api-client.ts prepends /api — strip it from the query key if already present
    const path = rawPath.replace(/^\/+api(?=\/)/, "") || "/";

    try {
      return await get<T>(path);
    } catch (error) {
      if (isUnauthorizedError(error) && unauthorizedBehavior === "returnNull") {
        return null as T;
      }
      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        if (isUnauthorizedError(error)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
