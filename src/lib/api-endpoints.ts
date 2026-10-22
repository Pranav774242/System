const env = import.meta.env;

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const baseUrl = requiredEnv("VITE_API_BASE_URL", env.VITE_API_BASE_URL);

function endpoint(name: string, path: string | undefined): string {
  return new URL(
    requiredEnv(name, path).replace(/^\//, ""),
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  ).toString();
}

export const API_ENDPOINTS = {
  authLogin: endpoint("VITE_API_AUTH_LOGIN", env.VITE_API_AUTH_LOGIN),
  organizations: endpoint(
    "VITE_API_ORGANIZATIONS",
    env.VITE_API_ORGANIZATIONS,
  ),
  banks: endpoint("VITE_API_BANKS", env.VITE_API_BANKS),
  bankOnboard: endpoint("VITE_API_BANK_ONBOARD", env.VITE_API_BANK_ONBOARD),
  userManagementUsers: endpoint(
    "VITE_API_USER_MANAGEMENT_USERS",
    env.VITE_API_USER_MANAGEMENT_USERS,
  ),
  users: endpoint("VITE_API_USERS", env.VITE_API_USERS),
  legacyUsers: endpoint("VITE_API_LEGACY_USERS", env.VITE_API_LEGACY_USERS),
};