import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    screenshotOnRunFailure: true,
    video: false,
    chromeWebSecurity: false, // Useful for Better-Auth redirects or cookies
  },
  env: {
    adminEmail: "admin@salonirma.com",
    adminPassword: "admin12345",
  }
});
