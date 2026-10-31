import { getAccessToken } from "@/lib/admin-store";

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly validationErrors?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

/**
 * Returns a clean access token without the "Bearer " prefix.
 */
function getCleanAccessToken(): string {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Access token not found. Please login again.");
  }

  return token
    .trim()
    .replace(/^Bearer\s+/i, "")
    .trim();
}

/**
 * Parse API response safely.
 */
async function parseResponse(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

/**
 * Extract a useful backend error message.
 */
function getErrorMessage(responseData: unknown, status: number): string {
  let message = `Request failed with status ${status}.`;

  if (responseData && typeof responseData === "object") {
    const body = responseData as {
      success?: boolean;
      status?: number;
      error?: string;
      message?: string;
      detail?: string;
      validationErrors?: Record<string, unknown>;
    };

    if (body.message) {
      message = body.message;
    } else if (body.error) {
      message = body.error;
    } else if (body.detail) {
      message = body.detail;
    }

    if (body.validationErrors) {
      console.error("Backend validation errors:", body.validationErrors);

      message += ` ${JSON.stringify(body.validationErrors)}`;
    }
  } else if (typeof responseData === "string" && responseData.trim()) {
    message = responseData;
  }

  return message;
}

function getValidationErrors(
  responseData: unknown,
): Record<string, unknown> | undefined {
  if (!responseData || typeof responseData !== "object") return undefined;

  const body = responseData as Record<string, unknown>;
  const nestedData =
    body["data"] && typeof body["data"] === "object"
      ? (body["data"] as Record<string, unknown>)
      : undefined;
  const errors =
    body["validationErrors"] ??
    body["errors"] ??
    nestedData?.["validationErrors"] ??
    nestedData?.["errors"];

  return errors && typeof errors === "object" && !Array.isArray(errors)
    ? (errors as Record<string, unknown>)
    : undefined;
}

/**
 * POST JSON request for authenticated admin APIs.
 */
export async function postAdminJson<TResponse = unknown>(
  url: string,
  payload: unknown,
): Promise<TResponse> {
  const cleanToken = getCleanAccessToken();

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",

      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",

        Authorization: `Bearer ${cleanToken}`,
      },

      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Network error while calling POST API:", error);

    throw new Error("Unable to connect to the backend server.", {
      cause: error,
    });
  }

  const responseData = await parseResponse(response);

  /**
   * 401 means the current access token
   * was rejected by the backend.
   */
  if (response.status === 401) {
    console.error("401 Unauthorized: backend rejected the access token.");

    /*
     * Remove stale token so the application
     * does not keep sending the same invalid token.
     */
    try {
      window.localStorage.removeItem("accessToken");
    } catch {
      // Ignore localStorage errors.
    }

    throw new Error(
      "Your login session is invalid or expired. Please login again.",
    );
  }

  if (!response.ok) {
    const message = getErrorMessage(responseData, response.status);

    throw new AdminApiError(message, getValidationErrors(responseData));
  }

  return responseData as TResponse;
}
