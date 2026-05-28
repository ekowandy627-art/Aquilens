import base from "./playwright.config";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? base.use?.baseURL ?? "http://127.0.0.1:3000";

export default {
  ...base,
  use: {
    ...base.use,
    baseURL,
  },
  webServer: undefined,
};
