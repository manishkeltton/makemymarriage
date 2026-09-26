import { NextRequest, NextResponse } from "next/server";
import { verifyGuestTokenAccess } from "@/modules/guests/utils/guest-token-auth";
import { MediaService } from "@/modules/media/services/media.service";
import { AppError } from "@/shared/errors/app-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; mediaId: string }> }
) {
  try {
    const { token, mediaId } = await params;
    const verified = await verifyGuestTokenAccess(token);

    const accessUrl = await MediaService.getMediaAccessUrl(verified.weddingId, mediaId, { allowPrivate: false });
    return NextResponse.json({ success: true, data: { accessUrl } }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("GET Guest Media Access URL Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
