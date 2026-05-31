/**
 * @deprecated This adapter previously used localStorage as a mock backend.
 * Now it delegates to the real HTTP API client.
 * Use `get`, `post`, `patch`, `del` from `./api-client` instead.
 */
import { get, post, patch, del } from "./api-client";

export async function apiAdapter(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  let result: unknown;

  switch (method.toUpperCase()) {
    case "GET":
      result = await get(url);
      break;
    case "POST":
      result = await post(url, data);
      break;
    case "PATCH":
      result = await patch(url, data);
      break;
    case "DELETE":
      result = await del(url);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
