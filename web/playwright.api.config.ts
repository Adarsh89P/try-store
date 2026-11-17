import { defineConfig } from "@playwright/test";

// Runs the site against the stand-in API (../api: npm run mock). Port 3100 so it never clashes with the normal tests.
export default defineConfig({
  testDir: "./tests-api",
  timeout: 30_000,
  workers: 1,
  use: { baseURL: "http://localhost:3100", channel: process.env.PW_CHANNEL ?? "chrome" },
  webServer: [
    { command: "npm run mock", cwd: "../api", url: "http://localhost:4100/__sign?o=a&p=b", reuseExistingServer: true, timeout: 60_000 },
    {
      command: "NEXT_PUBLIC_API_URL=http://localhost:4100 NEXT_DIST_DIR=.next-api npx next build && NEXT_DIST_DIR=.next-api npx next start -p 3100",
      url: "http://localhost:3100",
      reuseExistingServer: true,
      timeout: 240_000,
    },
  ],
});
