// frontend/actions/authActions.ts
"use server";

import { hashPassword } from "better-auth/crypto";
import { backendFetch } from "@/lib/backendClient";

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Action to request a password reset via WhatsApp OTP
 */
export async function forgotPasswordOTP(phoneNumber: string): Promise<ActionResult> {
  if (!phoneNumber) {
    return { success: false, error: "Nomor WhatsApp wajib diisi." };
  }

  try {
    const response = await backendFetch("/api/auth/forgot-password-otp", {
      method: "POST",
      body: { phone: phoneNumber },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal mengajukan OTP." };
    }

    return { success: true };
  } catch (err) {
    console.error("[forgotPasswordOTP] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem. Silakan coba lagi." };
  }
}

/**
 * Action to reset the password using verified WhatsApp OTP
 */
export async function resetPasswordOTP(
  phoneNumber: string,
  otp: string,
  newPassword: string
): Promise<ActionResult> {
  if (!phoneNumber || !otp || !newPassword) {
    return { success: false, error: "Semua input wajib diisi." };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password baru minimal 8 karakter." };
  }

  try {
    // 1. Verify OTP first and get the userId
    const verifyRes = await backendFetch("/api/auth/verify-otp", {
      method: "POST",
      body: { phone: phoneNumber, otp },
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      return { success: false, error: verifyData.error || "Kode OTP salah atau tidak valid." };
    }

    const { userId } = verifyData;
    if (!userId) {
      return { success: false, error: "User tidak ditemukan." };
    }

    // 2. Hash the password locally (Next.js server side)
    const hashedPassword = await hashPassword(newPassword);

    // 3. Request Express backend to write to DB
    const resetRes = await backendFetch("/api/auth/reset-password-db", {
      method: "POST",
      body: { userId, hashedPassword, phone: phoneNumber },
    });

    const resetData = await resetRes.json();
    if (!resetRes.ok) {
      return { success: false, error: resetData.error || "Gagal memperbarui password." };
    }

    return { success: true };
  } catch (err) {
    console.error("[resetPasswordOTP] Error:", err);
    return { success: false, error: "Gagal mereset password. Silakan coba lagi." };
  }
}
