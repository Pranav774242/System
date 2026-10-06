import { getAccessToken } from "@/lib/admin-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function responseMessage(response: Response) {
  const text = await response.text();

  if (!text) {
    return "";
  }

  try {
    const body: unknown = JSON.parse(text);

    if (!isRecord(body)) {
      return "";
    }

    for (const key of ["message", "detail", "error"]) {
      if (typeof body[key] === "string" && body[key].trim()) {
        return body[key];
      }
    }
  } catch {
    return text.trim();
  }

  return "";
}

export async function postAdminJson<TPayload>(
  endpoint: string,
  payload: TPayload,
) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Unauthorized / session expired");
  }

  /*
   * LOG EXACT REQUEST SENT TO BACKEND
   */
  console.log("=================================");
  console.log("ADMIN API REQUEST");
  console.log("URL:", endpoint);
  console.log("METHOD:", "POST");
  console.log("PAYLOAD:", payload);
  console.log(
    "PAYLOAD JSON:",
    JSON.stringify(payload, null, 2),
  );
  console.log("=================================");

  const response = await fetch(endpoint, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(payload),
  });

  /*
   * LOG RESPONSE STATUS
   */
  console.log("ADMIN API RESPONSE STATUS:", response.status);

  if (response.status === 200 || response.status === 201) {
    return;
  }

  if (response.status === 401) {
    throw new Error("Unauthorized / session expired");
  }

  if (response.status === 403) {
    throw new Error("You do not have permission");
  }

  const message = await responseMessage(response);

  if (response.status === 400) {
    throw new Error(
      message || "Please check the submitted information",
    );
  }

  if (response.status === 500) {
    throw new Error(
      message || "The server encountered an error",
    );
  }

  throw new Error(
    message || `Request failed (${response.status})`,
  );
}
