import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { connectToDatabase } from "@/lib/db/connect";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { MediaService, ListMediaFilters } from "@/modules/media/services/media.service";
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

    const searchParams = req.nextUrl.searchParams;
    const albumId = searchParams.get("albumId") || undefined;
    const statusParam = searchParams.get("status") || undefined;
    const visibilityParam = searchParams.get("visibility") || undefined;
    const mediaTypeParam = searchParams.get("mediaType") || undefined;
    const uploadedByTypeParam = searchParams.get("uploadedByType") || undefined;

    const filters: ListMediaFilters = {
      albumId,
      status: statusParam ? (statusParam.split(",") as ListMediaFilters["status"]) : undefined,
      visibility: visibilityParam ? (visibilityParam.split(",") as ListMediaFilters["visibility"]) : undefined,
      mediaType: mediaTypeParam as ListMediaFilters["mediaType"],
      uploadedByType: uploadedByTypeParam as ListMediaFilters["uploadedByType"],
    };

    const mediaList = await MediaService.listMedia(weddingId, filters);

    return NextResponse.json({ success: true, data: mediaList }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("GET Media List Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
