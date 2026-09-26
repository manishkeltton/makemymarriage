import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { connectToDatabase } from "@/lib/db/connect";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { GuestbookService } from "@/modules/guestbook/services/guestbook.service";
import { AppError } from "@/shared/errors/app-error";

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
    await connectToDatabase();

    const isMember = await TeamAuthorization.requireWeddingMembership(weddingId, session.user.id);
    if (!isMember || isMember.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied to wedding" } },
        { status: 403 }
      );
    }

    const status = req.nextUrl.searchParams.get("status") as "PENDING" | "APPROVED" | "REJECTED" | undefined;
    const entries = await GuestbookService.listEntries(weddingId, { status });

    return NextResponse.json({ success: true, data: entries }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("GET Workspace Guestbook Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
