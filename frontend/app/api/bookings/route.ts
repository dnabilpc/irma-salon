// app/api/bookings/route.ts
// Delegating all DB queries to the Express backend

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { AppUser } from "@/types";
import { backendFetch } from "@/lib/backendClient";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as unknown as AppUser;
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") ?? "ALL";
    const search = searchParams.get("search") ?? "";
    const page   = searchParams.get("page")  ?? "1";
    const limit  = searchParams.get("limit") ?? "20";

    let response;

    if (user.role === "ADMIN") {
      const queryParams = new URLSearchParams({ status, search, page, limit });
      response = await backendFetch(`/api/admin/bookings?${queryParams.toString()}`);
    } else {
      response = await backendFetch("/api/bookings");
    }

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Internal Server Error" }, { status: response.status });
    }

    if (user.role === "ADMIN") {
      return NextResponse.json({
        rows: data.rows,
        total: data.total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      });
    } else {
      // Customer: wrap into original structure
      return NextResponse.json({
        rows: data,
        total: data.length,
        page: 1,
        limit: 1000
      });
    }
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const response = await backendFetch("/api/bookings", {
      method: "POST",
      body,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Internal Server Error" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}