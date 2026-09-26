import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { connectToDatabase } from "@/lib/db/connect";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { MediaService } from "@/modules/media/services/media.service";
import { AppError } from "@/shared/errors/app-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; mediaId: string }> }
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

    const { weddingId, mediaId } = await params;
    await connectToDatabase();

    const isMember = await TeamAuthorization.requireWeddingMembership(weddingId, session.user.id);
    if (!isMember || isMember.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied to wedding" } },
        { status: 403 }
      );
    }

    const accessUrl = await MediaService.getMediaAccessUrl(weddingId, mediaId);
    return NextResponse.json({ success: true, data: { accessUrl } }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("GET Media Access URL Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
