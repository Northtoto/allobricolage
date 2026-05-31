const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export class ApiRequestError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = "ApiRequestError";
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem("allobricolage_token");
}

function getHeaders(contentType = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiRequestError("La requête a expiré. Veuillez réessayer.", "TIMEOUT", 0);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function retryFetch(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    return await fetchWithTimeout(url, options);
  } catch (error) {
    if (retries <= 0) throw error;

    // Only retry on network errors or 5xx server errors
    if (error instanceof ApiRequestError && error.code === "TIMEOUT") {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1)));
      return retryFetch(url, options, retries - 1);
    }
    throw error;
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const errorData = await response.json() as ApiResponse;
      throw new ApiRequestError(
        errorData.error?.message ?? `Erreur HTTP ${response.status}`,
        errorData.error?.code ?? "HTTP_ERROR",
        response.status,
        errorData.error?.details
      );
    }
    throw new ApiRequestError(
      response.statusText || `Erreur HTTP ${response.status}`,
      "HTTP_ERROR",
      response.status
    );
  }

  if (isJson) {
    return (await response.json()) as ApiResponse<T>;
  }

  return { success: true, data: undefined as unknown as T };
}

export async function get<T>(path: string): Promise<T> {
  const response = await retryFetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  const result = await handleResponse<T>(response);
  if (result.data === undefined) {
    throw new ApiRequestError("Aucune donnée dans la réponse", "NO_DATA", 200);
  }
  return result.data;
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await retryFetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await handleResponse<T>(response);
  if (result.data === undefined) {
    throw new ApiRequestError("Aucune donnée dans la réponse", "NO_DATA", 200);
  }
  return result.data;
}

export async function patch<T>(path: string, body?: unknown): Promise<T> {
  const response = await retryFetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await handleResponse<T>(response);
  if (result.data === undefined) {
    throw new ApiRequestError("Aucune donnée dans la réponse", "NO_DATA", 200);
  }
  return result.data;
}

export async function del<T>(path: string): Promise<T> {
  const response = await retryFetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
  const result = await handleResponse<T>(response);
  if (result.data === undefined) {
    throw new ApiRequestError("Aucune donnée dans la réponse", "NO_DATA", 200);
  }
  return result.data;
}

export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  return retryFetch(`${API_BASE_URL}${url}`, {
    method: method.toUpperCase(),
    headers: getHeaders(!!data),
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/** Check if a specific error code matches */
export function isErrorCode(error: unknown, code: string): boolean {
  return error instanceof ApiRequestError && error.code === code;
}

/** Format API errors into user-friendly French messages */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    switch (error.code) {
      case "UNAUTHORIZED": return "Session expirée. Veuillez vous reconnecter.";
      case "FORBIDDEN": return "Vous n'avez pas l'autorisation d'effectuer cette action.";
      case "VALIDATION_ERROR": return error.message || "Données invalides. Veuillez vérifier les champs.";
      case "CONFLICT": return "Cette ressource existe déjà.";
      case "TOO_MANY_REQUESTS": return "Trop de requêtes. Veuillez patienter quelques minutes.";
      case "TIMEOUT": return "La connexion est trop lente. Veuillez réessayer.";
      case "NOT_FOUND": return "Ressource introuvable.";
      case "INTERNAL_ERROR": return "Une erreur serveur s'est produite. Réessayez plus tard.";
      default: return error.message || "Une erreur inattendue s'est produite.";
    }
  }
  if (error instanceof Error) {
    if (error.message.includes("NetworkError") || error.message.includes("fetch")) {
      return "Problème de connexion. Vérifiez votre réseau internet.";
    }
    return error.message;
  }
  return "Une erreur inattendue s'est produite.";
}
