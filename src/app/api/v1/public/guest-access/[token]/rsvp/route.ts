import { NextRequest, NextResponse } from "next/server";
import { GuestService } from "@/modules/guests/services/guest.service";
import { publicRsvpSchema } from "@/modules/guests/validation/guest.schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json().catch(() => null);

    const headers = new Headers();
    headers.set("Cache-Control", "no-store, private");

    if (!body) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
        { status: 400, headers }
      );
    }

    const parseResult = publicRsvpSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400, headers }
      );
    }

    const result = await GuestService.submitPublicRsvp(token, parseResult.data);

    if (!result.success) {
      const status =
        result.code === "TOKEN_EXPIRED" || result.code === "TOKEN_REVOKED"
          ? 410
          : result.code === "NOT_FOUND"
          ? 404
          : 400;

      return NextResponse.json(
        { success: false, error: { code: result.code || "BAD_REQUEST", message: result.error } },
        { status, headers }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200, headers });
  } catch (err: unknown) {
    console.error("POST Public Guest RSVP Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
