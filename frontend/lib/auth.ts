import { betterAuth } from "better-auth";
import { db } from "./db";

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "customer",
      },
      phone_number: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge:  60 * 60 * 24,
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User    = typeof auth.$Infer.Session.user;