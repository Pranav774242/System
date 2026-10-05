import { getAccessToken } from "@/lib/admin-store";

const API_BASE_URL =
  "https://los-backend-355v.onrender.com";

/**
 * Returns a clean access token without the "Bearer " prefix.
 */
function getCleanAccessToken(): string {
  const token = getAccessToken();

  if (!token) {
    throw new Error(
      "Access token not found. Please login again.",
    );
  }

  return token
    .trim()
    .replace(/^Bearer\s+/i, "")
    .trim();
}

/**
 * Parse API response safely.
 */
async function parseResponse(
  response: Response,
): Promise<unknown> {
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
function getErrorMessage(
  responseData: unknown,
  status: number,
): string {
  let message =
    `Request failed with status ${status}.`;

  if (
    responseData &&
    typeof responseData === "object"
  ) {
    const body = responseData as {
      success?: boolean;
      status?: number;
      error?: string;
      message?: string;
      detail?: string;
      validationErrors?: Record<
        string,
        unknown
      >;
    };

    if (body.message) {
      message = body.message;
    } else if (body.error) {
      message = body.error;
    } else if (body.detail) {
      message = body.detail;
    }

    if (body.validationErrors) {
      console.error(
        "Backend validation errors:",
        body.validationErrors,
      );

      message +=
        ` ${JSON.stringify(
          body.validationErrors,
        )}`;
    }
  } else if (
    typeof responseData === "string" &&
    responseData.trim()
  ) {
    message = responseData;
  }

  return message;
}

/**
 * POST JSON request for authenticated admin APIs.
 */
export async function postAdminJson<
  TResponse = unknown,
>(
  url: string,
  payload: unknown,
): Promise<TResponse> {
  const cleanToken =
    getCleanAccessToken();

  console.log("POST URL:", url);

  /*
   * Never print the actual token in console.
   * Only print whether a token exists and its length.
   */
  console.log(
    "POST auth token present:",
    Boolean(cleanToken),
    "length:",
    cleanToken.length,
  );

  console.log(
    "POST payload:",
    payload,
  );

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",

      headers: {
        Accept:
          "application/json",

        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${cleanToken}`,
      },

      body: JSON.stringify(
        payload,
      ),
    });
  } catch (error) {
    console.error(
      "Network error while calling POST API:",
      error,
    );

    throw new Error(
      "Unable to connect to the backend server.",
      {
        cause: error,
      },
    );
  }

  const responseData =
    await parseResponse(response);

  console.log(
    "POST status:",
    response.status,
  );

  console.log(
    "POST response:",
    responseData,
  );

  /**
   * 401 means the current access token
   * was rejected by the backend.
   */
  if (response.status === 401) {
    console.error(
      "401 Unauthorized: backend rejected the access token.",
    );

    /*
     * Remove stale token so the application
     * does not keep sending the same invalid token.
     */
    try {
      window.localStorage.removeItem(
        "accessToken",
      );
    } catch {
      // Ignore localStorage errors.
    }

    throw new Error(
      "Your login session is invalid or expired. Please login again.",
    );
  }

  if (!response.ok) {
    const message =
      getErrorMessage(
        responseData,
        response.status,
      );

    throw new Error(message);
  }

  return responseData as TResponse;
}

/**
 * GET JSON request for authenticated admin APIs.
 */
export async function getAdminJson<
  TResponse = unknown,
>(
  url: string,
): Promise<TResponse> {
  const cleanToken =
    getCleanAccessToken();

  console.log("GET URL:", url);

  console.log(
    "GET auth token present:",
    Boolean(cleanToken),
    "length:",
    cleanToken.length,
  );

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",

      headers: {
        Accept:
          "application/json",

        Authorization:
          `Bearer ${cleanToken}`,
      },
    });
  } catch (error) {
    console.error(
      "Network error while calling GET API:",
      error,
    );

    throw new Error(
      "Unable to connect to the backend server.",
      {
        cause: error,
      },
    );
  }

  const responseData =
    await parseResponse(response);

  console.log(
    "GET status:",
    response.status,
  );

  console.log(
    "GET response:",
    responseData,
  );

  if (response.status === 401) {
    console.error(
      "401 Unauthorized: backend rejected the access token.",
    );

    try {
      window.localStorage.removeItem(
        "accessToken",
      );
    } catch {
      // Ignore localStorage errors.
    }

    throw new Error(
      "Your login session is invalid or expired. Please login again.",
    );
  }

  if (!response.ok) {
    const message =
      getErrorMessage(
        responseData,
        response.status,
      );

    throw new Error(message);
  }

  return responseData as TResponse;
}