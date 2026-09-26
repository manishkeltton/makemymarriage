import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { connectToDatabase } from "@/lib/db/connect";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { MediaService } from "@/modules/media/services/media.service";
import { completeUploadSchema } from "@/modules/media/validation/media.validation";
import { AppError } from "@/shared/errors/app-error";

export async function POST(
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

    const hasPermission = await TeamAuthorization.requireWeddingPermission(weddingId, session.user.id, "gallery");
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Requires gallery permission" } },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const parseResult = completeUploadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const media = await MediaService.completeUpload(weddingId, mediaId, parseResult.data);
    return NextResponse.json({ success: true, data: media }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("POST Complete Upload Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
