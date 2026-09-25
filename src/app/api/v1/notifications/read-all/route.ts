import { NextResponse, NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { NotificationService } from "@/modules/notifications/services/notification.service";

export async function POST(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;
    const weddingId = searchParams.get("weddingId") || undefined;

    const result = await NotificationService.markAllRead({
      userId: session.user.id,
      weddingId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "ERROR", message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, count: result.count }, { status: 200 });
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
