import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { ExpenseService } from "@/modules/expenses/services/expense.service";

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
    const result = await ExpenseService.getFinanceSummary(weddingId, session.user.id);

    if (!result.success) {
      const statusCode = result.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "BAD_REQUEST", message: result.error } },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET Finance Summary Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
