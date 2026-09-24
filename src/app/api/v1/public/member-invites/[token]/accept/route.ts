import { NextResponse, NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { TeamService } from "@/modules/team/services/team.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const sessionToken = await getSessionToken();
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_REQUIRED", message: "Authentication required to accept invitation" } },
        { status: 401 }
      );
    }

    const session = await AuthService.verifySession(sessionToken);
    if (!session.success || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: "SESSION_EXPIRED", message: "Session expired. Please log in again." } },
        { status: 401 }
      );
    }

    const { token } = await params;
    const result = await TeamService.acceptInvite(token, session.user.id);

    if (!result.success) {
      const statusCode =
        result.code === "EMAIL_MISMATCH"
          ? 403
          : result.code === "INVITE_EXPIRED" || result.code?.startsWith("INVITE_")
          ? 410
          : result.code === "NOT_FOUND"
          ? 404
          : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "ERROR", message: result.error } },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { success: true, data: { weddingId: result.weddingId, message: "Invitation accepted successfully!" } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
