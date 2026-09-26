import { NextRequest, NextResponse } from "next/server";
import { verifyGuestTokenAccess } from "@/modules/guests/utils/guest-token-auth";
import { GuestbookService } from "@/modules/guestbook/services/guestbook.service";
import { submitGuestbookSchema } from "@/modules/guestbook/validation/guestbook.validation";
import { AppError } from "@/shared/errors/app-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const verified = await verifyGuestTokenAccess(token);

    const entries = await GuestbookService.listPublicEntries(verified.weddingId);
    return NextResponse.json({ success: true, data: entries }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("GET Public Guestbook Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const verified = await verifyGuestTokenAccess(token);

    const body = await req.json().catch(() => null);
    const parseResult = submitGuestbookSchema.safeParse(body);
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

    const entry = await GuestbookService.submitEntry(
      verified.weddingId,
      verified.householdId,
      parseResult.data
    );

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("POST Public Guestbook Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
