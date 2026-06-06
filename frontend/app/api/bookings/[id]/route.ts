// app/api/bookings/[id]/route.ts
// Delegating single booking operations to Express backend

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { AppUser } from "@/types";
import { backendFetch } from "@/lib/backendClient";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const response = await backendFetch(`/api/bookings/${bookingId}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Internal Server Error" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/bookings/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body as { status: string };

    const response = await backendFetch(`/api/admin/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: { status },
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Internal Server Error" }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/bookings/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    // Cancel booking on backend
    const response = await backendFetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Internal Server Error" }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/bookings/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
