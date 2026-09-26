import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { PlatformAdminService } from "@/modules/admin/services/platform-admin.service";
import { AppError } from "@/shared/errors/app-error";

export async function GET(req: NextRequest) {
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

    const search = req.nextUrl.searchParams.get("search") || undefined;
    const metrics = await PlatformAdminService.getPlatformMetrics(session.user.id);
    const weddings = await PlatformAdminService.searchWeddings(session.user.id, search);

    return NextResponse.json(
      { success: true, data: { metrics, weddings } },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("GET Admin Weddings Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
