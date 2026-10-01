import { NextResponse, NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { VendorService } from "@/modules/vendors/services/vendor.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; vendorId: string; eventId: string }> }
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

    const { weddingId, vendorId, eventId } = await params;
    const result = await VendorService.linkVendorToEvent({
      weddingId,
      vendorId,
      eventId,
      userId: session.user.id,
    });

    if (!result.success) {
      const statusCode =
        result.code === "FORBIDDEN"
          ? 403
          : result.code === "NOT_FOUND" || result.code === "INVALID_EVENT"
          ? 404
          : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "ERROR", message: result.error } },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error linking vendor to event:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; vendorId: string; eventId: string }> }
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

    const { weddingId, vendorId, eventId } = await params;
    const result = await VendorService.unlinkVendorFromEvent({
      weddingId,
      vendorId,
      eventId,
      userId: session.user.id,
    });

    if (!result.success) {
      const statusCode =
        result.code === "FORBIDDEN"
          ? 403
          : result.code === "NOT_FOUND" || result.code === "INVALID_EVENT"
          ? 404
          : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "ERROR", message: result.error } },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error unlinking vendor from event:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
