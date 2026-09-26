import { NextRequest, NextResponse } from "next/server";
import { verifyGuestTokenAccess } from "@/modules/guests/utils/guest-token-auth";
import { MediaService } from "@/modules/media/services/media.service";
import { completeUploadSchema } from "@/modules/media/validation/media.validation";
import { AppError } from "@/shared/errors/app-error";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; mediaId: string }> }
) {
  try {
    const { token, mediaId } = await params;
    const verified = await verifyGuestTokenAccess(token);

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

    const media = await MediaService.completeUpload(verified.weddingId, mediaId, parseResult.data);
    return NextResponse.json({ success: true, data: media }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("POST Complete Guest Upload Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
