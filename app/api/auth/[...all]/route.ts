// app/api/auth/[...all]/route.ts
// Better Auth menangani SEMUA request auth via route ini:
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-out
//   GET  /api/auth/get-session
//   ... dan route lainnya otomatis dari Better Auth

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);