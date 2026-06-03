// frontend/actions/notification.ts
"use server";

import { backendFetch } from "@/lib/backendClient";
import { revalidatePath } from "next/cache";
import type { Notification, NotifType } from "@/types";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface NotificationRow {
  id: number;
  message?: string | null;
  title?: string | null;
  created_at: string | Date | number;
  type?: string | null;
  is_read: boolean;
}

/**
 * Formats a timestamp into Indonesian relative time (e.g., "5 menit lalu")
 */
function getRelativeTime(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHr < 24) return `${diffHr} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/**
 * Gets notifications for the admin view
 */
export async function getAdminNotifications(): Promise<ActionResult<Notification[]>> {
  try {
    const response = await backendFetch("/api/admin/notifications", {
      method: "GET",
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || "Gagal mengambil data notifikasi." };
    }

    const rows = (await response.json()) as NotificationRow[];
    const formatted: Notification[] = rows.map((row) => ({
      id: row.id,
      message: row.message || `${row.title || 'Pemberitahuan'}`,
      time: getRelativeTime(row.created_at),
      type: (row.type || "booking") as NotifType,
      unread: !row.is_read
    }));

    return { success: true, data: formatted };
  } catch (err) {
    console.error("[getAdminNotifications]", err);
    return { success: false, error: "Gagal mengambil data notifikasi." };
  }
}

/**
 * Marks a specific notification as read
 */
export async function markNotificationAsRead(id: number): Promise<ActionResult> {
  try {
    const response = await backendFetch(`/api/admin/notifications/${id}/read`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || "Gagal memperbarui status notifikasi." };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("[markNotificationAsRead]", err);
    return { success: false, error: "Gagal memperbarui status notifikasi." };
  }
}

/**
 * Marks all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<ActionResult> {
  try {
    const response = await backendFetch("/api/admin/notifications/read-all", {
      method: "POST",
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || "Gagal memperbarui status notifikasi." };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("[markAllNotificationsAsRead]", err);
    return { success: false, error: "Gagal memperbarui status notifikasi." };
  }
}
