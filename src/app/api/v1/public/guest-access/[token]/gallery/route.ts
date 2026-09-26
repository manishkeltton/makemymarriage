import { NextRequest, NextResponse } from "next/server";
import { verifyGuestTokenAccess } from "@/modules/guests/utils/guest-token-auth";
import { MediaService } from "@/modules/media/services/media.service";
import { AlbumService } from "@/modules/media/services/album.service";
import { AppError } from "@/shared/errors/app-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const verified = await verifyGuestTokenAccess(token);

    const albumId = req.nextUrl.searchParams.get("albumId") || undefined;

    const [albums, media] = await Promise.all([
      AlbumService.getPublicAlbums(verified.weddingId),
      MediaService.listGuestGalleryMedia(verified.weddingId, verified.householdId, albumId),
    ]);

    return NextResponse.json({ success: true, data: { albums, media } }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("GET Guest Gallery Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
