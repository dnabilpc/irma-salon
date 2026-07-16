// frontend/actions/authActions.ts
"use server";

import { hashPassword } from "better-auth/crypto";
import { backendFetch } from "@/lib/backendClient";

interface ActionResult {
  success: boolean;
  error?: string;
}

export interface PendingRegistration {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  createdAt: string;
}

export interface ActiveCustomer {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  createdAt: string;
  total_booking: string;
  total_sewa: string;
}

/**
 * Server Action: registers a new customer with PENDING status.
 * Hashes password server-side before sending to Express backend.
 */
export async function registerCustomer(
  name: string,
  email: string,
  phone_number: string,
  password: string,
  gender?: string
): Promise<ActionResult> {
  if (!name || !email || !password) {
    return { success: false, error: "Semua kolom wajib diisi." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password minimal 8 karakter." };
  }

  try {
    const hashedPassword = await hashPassword(password);

    const response = await backendFetch("/api/auth/register", {
      method: "POST",
      body: { name, email, phone_number, hashedPassword, gender: gender || "unspecified" },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Pendaftaran gagal." };
    }

    return { success: true };
  } catch (err) {
    console.error("[registerCustomer] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem. Silakan coba lagi." };
  }
}

/**
 * Server Action: Triggers sending a registration OTP via WhatsApp.
 */
export async function sendRegistrationOTP(email: string): Promise<ActionResult> {
  try {
    const response = await backendFetch("/api/auth/send-registration-otp", {
      method: "POST",
      body: { email },
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal mengirim OTP." };
    }
    return { success: true };
  } catch (err) {
    console.error("[sendRegistrationOTP] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem. Silakan coba lagi." };
  }
}

/**
 * Server Action: Verifies the registration OTP and activates the account.
 */
export async function verifyRegistrationOTP(email: string, otp: string): Promise<ActionResult> {
  try {
    const response = await backendFetch("/api/auth/verify-registration-otp", {
      method: "POST",
      body: { email, otp },
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal memverifikasi OTP." };
    }
    return { success: true };
  } catch (err) {
    console.error("[verifyRegistrationOTP] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem. Silakan coba lagi." };
  }
}

/**
 * Server Action: Creates a new customer account directly by Admin (status ACTIVE).
 */
export async function adminCreateCustomer(
  name: string,
  email: string,
  phone_number: string,
  password: string
): Promise<ActionResult> {
  if (!name || !email || !password) {
    return { success: false, error: "Nama, email, dan password wajib diisi." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password minimal 8 karakter." };
  }
  try {
    const hashedPassword = await hashPassword(password);
    const response = await backendFetch("/api/admin/customers/create", {
      method: "POST",
      body: { name, email, phone_number, hashedPassword },
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal membuat pelanggan baru." };
    }
    return { success: true };
  } catch (err) {
    console.error("[adminCreateCustomer] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem. Silakan coba lagi." };
  }
}

/**
 * Server Action: fetch all PENDING registrations (admin only)
 */
export async function fetchPendingRegistrations(): Promise<{
  success: boolean;
  registrations?: PendingRegistration[];
  error?: string;
}> {
  try {
    const response = await backendFetch("/api/admin/registrations/pending");
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal mengambil data." };
    }
    return { success: true, registrations: data.registrations };
  } catch (err) {
    console.error("[fetchPendingRegistrations] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}

/**
 * Server Action: fetch all ACTIVE customers (admin only)
 */
export async function fetchActiveCustomers(): Promise<{
  success: boolean;
  customers?: ActiveCustomer[];
  error?: string;
}> {
  try {
    const response = await backendFetch("/api/admin/registrations/customers");
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal mengambil data." };
    }
    return { success: true, customers: data.customers };
  } catch (err) {
    console.error("[fetchActiveCustomers] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}

/**
 * Server Action: fetch all REJECTED registrations (admin only)
 */
export async function fetchRejectedRegistrations(): Promise<{
  success: boolean;
  registrations?: PendingRegistration[];
  error?: string;
}> {
  try {
    const response = await backendFetch("/api/admin/registrations/rejected");
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal mengambil data." };
    }
    return { success: true, registrations: data.registrations };
  } catch (err) {
    console.error("[fetchRejectedRegistrations] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}

/**
 * Server Action: approve a pending registration (admin only)
 */
export async function approveRegistration(userId: string): Promise<ActionResult> {
  try {
    const response = await backendFetch(`/api/admin/registrations/${userId}/approve`, {
      method: "PATCH",
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal menyetujui." };
    }
    return { success: true };
  } catch (err) {
    console.error("[approveRegistration] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}

/**
 * Server Action: reject a pending registration (admin only)
 */
export async function rejectRegistration(userId: string): Promise<ActionResult> {
  try {
    const response = await backendFetch(`/api/admin/registrations/${userId}/reject`, {
      method: "PATCH",
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal menolak." };
    }
    return { success: true };
  } catch (err) {
    console.error("[rejectRegistration] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
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

/**
 * Action to update user profile information
 */
export async function updateUserProfile(
  name: string,
  phone: string,
  imageBase64?: string | null,
  gender?: string
): Promise<ActionResult> {
  if (!name) {
    return { success: false, error: "Nama wajib diisi." };
  }

  try {
    const response = await backendFetch("/api/auth/profile", {
      method: "PATCH",
      body: { name, phone_number: phone, image: imageBase64, gender },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal memperbarui profil." };
    }

    return { success: true };
  } catch (err) {
    console.error("[updateUserProfile] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem. Silakan coba lagi." };
  }
}

/**
 * Server Action: Resolves user identifier (either email or phone number) to its registered email address.
 */
export async function resolveLoginIdentifier(
  identifier: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  if (!identifier) {
    return { success: false, error: "Email atau nomor WhatsApp wajib diisi." };
  }

  // If identifier is email format, return it directly
  if (identifier.includes("@")) {
    return { success: true, email: identifier };
  }

  try {
    const response = await backendFetch(`/api/auth/resolve-email?phone=${encodeURIComponent(identifier)}`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Nomor WhatsApp tidak terdaftar." };
    }

    return { success: true, email: data.email };
  } catch (err) {
    console.error("[resolveLoginIdentifier] Error:", err);
    return { success: false, error: "Gagal memproses login. Silakan coba lagi." };
  }
}
