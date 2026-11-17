import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4173", channel: process.env.PW_CHANNEL ?? "chrome", viewport: { width: 390, height: 844 }, hasTouch: true },
  webServer: { command: "npx expo export --platform web && npx serve dist -l 4173 -s", url: "http://localhost:4173", reuseExistingServer: true, timeout: 180000 },
});
