import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { connectToDatabase } from "@/lib/db/connect";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { AlbumService } from "@/modules/media/services/album.service";
import { updateAlbumSchema } from "@/modules/media/validation/media.validation";
import { AppError } from "@/shared/errors/app-error";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; albumId: string }> }
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

    const { weddingId, albumId } = await params;
    await connectToDatabase();

    const hasPermission = await TeamAuthorization.requireWeddingPermission(weddingId, session.user.id, "gallery");
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Requires gallery permission" } },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const parseResult = updateAlbumSchema.safeParse(body);
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

    const album = await AlbumService.updateAlbum(weddingId, albumId, parseResult.data);
    return NextResponse.json({ success: true, data: album }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("PATCH Album Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; albumId: string }> }
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

    const { weddingId, albumId } = await params;
    await connectToDatabase();

    const hasPermission = await TeamAuthorization.requireWeddingPermission(weddingId, session.user.id, "gallery");
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Requires gallery permission" } },
        { status: 403 }
      );
    }

    await AlbumService.deleteAlbum(weddingId, albumId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("DELETE Album Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
