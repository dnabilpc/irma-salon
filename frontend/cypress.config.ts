import { defineConfig } from "cypress";
import pg from "pg";
import { loadEnvConfig } from "@next/env";

// Load Next.js environment variables from .env.local
loadEnvConfig(process.cwd());

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      on("task", {
        async getRegistrationOTP(email: string) {
          const client = new pg.Client({
            connectionString: process.env.DATABASE_URL,
          });
          await client.connect();
          try {
            const res = await client.query(
              "SELECT value FROM verification WHERE identifier = $1 LIMIT 1",
              [`registration_otp:${email}`]
            );
            return res.rows[0]?.value || null;
          } finally {
            await client.end();
          }
        },
        async deleteUser(email: string) {
          const client = new pg.Client({
            connectionString: process.env.DATABASE_URL,
          });
          await client.connect();
          try {
            const userRes = await client.query(
              'SELECT id FROM "user" WHERE email = $1 LIMIT 1',
              [email]
            );
            if (userRes.rows.length > 0) {
              const userId = userRes.rows[0].id;
              // Clean up referencing rows first
              await client.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
              await client.query('DELETE FROM booking_details WHERE booking_id IN (SELECT id FROM bookings WHERE user_id = $1)', [userId]);
              await client.query('DELETE FROM bookings WHERE user_id = $1', [userId]);
              await client.query('DELETE FROM rentals WHERE user_id = $1', [userId]);
              await client.query('DELETE FROM rental_orders WHERE user_id = $1', [userId]);
              await client.query('DELETE FROM session WHERE "userId" = $1', [userId]);
              await client.query('DELETE FROM account WHERE "userId" = $1', [userId]);
              await client.query('DELETE FROM "user" WHERE id = $1', [userId]);
              await client.query('DELETE FROM verification WHERE identifier = $1', [
                `registration_otp:${email}`,
              ]);
            }
            return null;
          } finally {
            await client.end();
          }
        }
      });
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    screenshotOnRunFailure: true,
    video: false,
    chromeWebSecurity: false,
  },
  env: {
    adminEmail: "admin@salonirma.com",
    adminPassword: "admin12345",
  }
});
