import { getAccessToken } from "@/lib/admin-store";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export type ApiUser = {
  id: number;
  pkid?: number;

  emp_no?: string;

  organization_id?: number;
  organization_code?: string;
  organization_name?: string;

  email?: string;
  username?: string;

  name?: string;
  fullName?: string;

  first_name?: string;
  middle_name?: string;
  last_name?: string;

  mobile?: string;

  gender?: string;

  date_of_birth?: string;
  dob?: string;
  DOB?: string;

  designation?: string;

  role?: string;
  role_id?: number;
  role_name?: string;

  status?: string;
  is_active?: boolean;

  login_branch?: string;
  login_branch_id?: number;
  login_branch_name?: string;

  mbrAccess?: boolean;
  m_br_access?: boolean;

  multi_branch_access?: boolean;

  two_fa_enabled?: boolean;
  "2fA"?: boolean;

  holiday_login?: boolean;
  login_on_holidays?: boolean;

  inactive_session_timeout?: number;

  no_of_bad_logins?: number;

  lastlogindate?: string;
  last_login_date?: string;
  last_login_time?: string;

  created_by?: number;
  created_date?: string;
  created_at?: string;

  modified_date?: string;
  updated_at?: string;
};

type UsersResponse = {
  success: boolean;
  message?: string;
  data?: ApiUser[];
};

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Unauthorized / session expired");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getUsers(organizationId: string): Promise<ApiUser[]> {
  if (!organizationId.trim()) {
    throw new Error("Select a bank before loading users");
  }

  const url = new URL(API_ENDPOINTS.users);
  url.searchParams.set("organizationId", organizationId);

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized / session expired");
  }

  if (response.status === 403) {
    throw new Error("You do not have permission to view users");
  }

  if (!response.ok) {
    let message = "";

    try {
      const body = await response.json();

      if (typeof body?.message === "string") {
        message = body.message;
      }
    } catch {
      // Ignore invalid JSON response.
    }

    throw new Error(
      message || `Unable to load users (${response.status})`,
    );
  }

  const result: UsersResponse = await response.json();

  if (!result.success) {
    throw new Error(
      result.message || "Unable to load users",
    );
  }

  return Array.isArray(result.data) ? result.data : [];
}

export function getUserName(user: ApiUser): string {
  return (
    user.fullName ||
    user.name ||
    [
      user.first_name,
      user.middle_name,
      user.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Unnamed User"
  );
}

export function getUserRole(user: ApiUser): string {
  return (
    user.role_name ||
    user.role ||
    "—"
  );
}

export function getUserStatus(user: ApiUser): string {
  return (
    user.status ||
    (user.is_active ? "OPERATIVE" : "INACTIVE")
  );
}


