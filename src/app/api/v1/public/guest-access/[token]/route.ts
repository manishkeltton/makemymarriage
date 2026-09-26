import { NextRequest, NextResponse } from "next/server";
import { GuestService } from "@/modules/guests/services/guest.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const result = await GuestService.getPublicGuestAccess(token);

    const headers = new Headers();
    headers.set("Cache-Control", "no-store, private");

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
    console.error("GET Public Guest Access Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
