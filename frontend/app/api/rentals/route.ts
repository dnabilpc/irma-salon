// app/api/rentals/route.ts
// Delegating all DB queries to the Express backend

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { AppUser } from "@/types";
import { backendFetch } from "@/lib/backendClient";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "ALL";
    const page   = searchParams.get("page")  ?? "1";
    const limit  = searchParams.get("limit") ?? "20";

    let response;

    if (user.role === "admin") {
      const queryParams = new URLSearchParams({ status, page, limit });
      response = await backendFetch(`/api/admin/rentals?${queryParams.toString()}`);
    } else {
      response = await backendFetch("/api/rentals");
    }

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Internal Server Error" }, { status: response.status });
    }

    // Standardize return format for list sewa
    if (user.role === "admin") {
      return NextResponse.json({
        rows: data.rows,
        total: data.total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      });
    } else {
      // Customer API returns an array, wrap it in Next.js expected structure if needed or return direct
      // Let's check what the client expects:
      // The original return was `NextResponse.json({ rows: result.rows, total, page, limit });`
      // Wait! The original code for Customer (role !== "admin") did:
      // `const result = await db.query(..., [...params, limit, offset]);`
      // `return NextResponse.json({ rows: result.rows, total, page, limit });`
      // Ah! The Next.js Route Handler GET originally returned `{ rows, total, page, limit }` for both Admin and Customer!
      // So if the user is a CUSTOMER, and our backend `/api/rentals` returns just `data` (which is array of rows),
      // we should wrap it to match the exact original format:
      return NextResponse.json({
        rows: data,
        total: data.length,
        page: 1,
        limit: 1000
      });
    }
  } catch (err) {
    console.error("[GET /api/rentals]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const response = await backendFetch("/api/rentals", {
      method: "POST",
      body,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Internal Server Error" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/rentals]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
