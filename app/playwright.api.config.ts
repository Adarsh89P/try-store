import { defineConfig } from "@playwright/test";

// Runs the app (web export) against the stand-in API in ../api (npm run mock). Port 4174 so it never clashes with the normal tests.
export default defineConfig({
  testDir: "./tests-api",
  workers: 1,
  timeout: 30_000,
  use: { baseURL: "http://localhost:4174", channel: process.env.PW_CHANNEL ?? "chrome", viewport: { width: 390, height: 844 }, hasTouch: true },
  webServer: [
    { command: "npm run mock", cwd: "../api", url: "http://localhost:4100/__sign?o=a&p=b", reuseExistingServer: true, timeout: 60_000 },
    { command: "EXPO_PUBLIC_API_URL=http://localhost:4100 npx expo export --platform web --output-dir dist-api && npx serve dist-api -l 4174 -s", url: "http://localhost:4174", reuseExistingServer: true, timeout: 240_000 },
  ],
});
