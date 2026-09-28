import { defineConfig } from "@playwright/test";

export default defineConfig({
    reporter: "line",
    retries: 0,
    testDir: "./monitoring",
    timeout: 90_000,
    use: {
        browserName: "chromium",
        headless: true
    },
    workers: 1
});