// frontend/lib/backendClient.ts
import { headers } from "next/headers";
import { auth } from "./auth";
import type { AppUser } from "@/types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  userId?: string;
  userRole?: string;
}

export async function backendFetch(path: string, options: FetchOptions = {}) {
  const url = `${BACKEND_URL}${path}`;
  const reqHeaders = new Headers(options.headers || {});

  // Add INTERNAL_API_KEY bearer authorization
  reqHeaders.set("Authorization", `Bearer ${INTERNAL_API_KEY}`);

  // Fetch session to inject user headers if not explicitly passed
  let userId = options.userId;
  let userRole = options.userRole;

  if (!userId) {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user) {
        const user = session.user as unknown as AppUser;
        userId = user.id;
        userRole = user.role;
      }
    } catch (e) {
      // In some contexts headers() or session retrieval might throw or fail (e.g. static rendering/build)
      console.warn("[backendFetch] Failed to get session headers automatically:", e);
    }
  }

  if (userId) {
    reqHeaders.set("X-User-Id", userId);
  }
  if (userRole) {
    reqHeaders.set("X-User-Role", userRole);
  }

  // Ensure JSON content type if body is present and it is an object
  let bodyToSend = options.body;
  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    reqHeaders.set("Content-Type", "application/json");
    bodyToSend = JSON.stringify(options.body);
  }

  const restOptions = { ...options };
  delete restOptions.userId;
  delete restOptions.userRole;

  const response = await fetch(url, {
    ...restOptions,
    body: bodyToSend as BodyInit,
    headers: reqHeaders,
  });

  // Safe JSON wrapper to prevent SyntaxError when parsing non-JSON responses (like HTML error pages)
  const originalJson = response.json.bind(response);
  response.json = async () => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        return await originalJson();
      } catch (err) {
        console.error("[backendFetch] Failed to parse JSON response:", err);
      }
    }
    try {
      const text = await response.text();
      return { error: text || `HTTP Error ${response.status}: ${response.statusText}` };
    } catch {
      return { error: `HTTP Error ${response.status}: ${response.statusText}` };
    }
  };

  return response;
}
