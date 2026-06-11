import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const response = await backendFetch(`/api/admin/closing-time/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error(`[DELETE /api/admin/closing-time/${id}]`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
