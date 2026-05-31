export const SESSION_TIMEOUTS = {
  accessToken: 60 * 60,
  refreshToken: 60 * 60 * 24 * 7,
};

export const TENANT_APP_LOGIN_URL =
  process.env.NEXT_PUBLIC_TENANT_APP_LOGIN_URL ?? "http://localhost:3000/login";
