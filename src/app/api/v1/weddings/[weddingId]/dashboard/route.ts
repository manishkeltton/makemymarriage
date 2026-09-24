import { NextResponse, NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { WeddingService } from "@/modules/weddings/services/wedding.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_REQUIRED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const session = await AuthService.verifySession(token);
    if (!session.success || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: "SESSION_EXPIRED", message: "Session expired" } },
        { status: 401 }
      );
    }

    const { weddingId } = await params;
    const result = await WeddingService.getDashboardSummary(weddingId, session.user.id);

    if (!result.success) {
      const statusCode = result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "ERROR", message: result.error } },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
