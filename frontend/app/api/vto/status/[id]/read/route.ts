// app/api/vto/status/[id]/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { backendFetch } from "@/lib/backendClient";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "ID task tidak valid" }, { status: 400 });
    }

    const response = await backendFetch(`/api/vto/task/${taskId}/read`, {
      method: "POST",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Gagal menandai notifikasi VTO." },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[POST /api/vto/status/:id/read]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
