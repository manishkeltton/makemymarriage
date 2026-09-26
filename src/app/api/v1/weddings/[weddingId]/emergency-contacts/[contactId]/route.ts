import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { connectToDatabase } from "@/lib/db/connect";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { EmergencyService } from "@/modules/emergency/services/emergency.service";
import { updateEmergencyContactSchema } from "@/modules/emergency/validation/emergency.validation";
import { AppError } from "@/shared/errors/app-error";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; contactId: string }> }
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

    const { weddingId, contactId } = await params;
    await connectToDatabase();

    const hasPermission = await TeamAuthorization.requireWeddingPermission(weddingId, session.user.id, "emergency");
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Requires emergency permission" } },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const parseResult = updateEmergencyContactSchema.safeParse(body);
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

    const contact = await EmergencyService.updateContact(weddingId, contactId, parseResult.data);
    return NextResponse.json({ success: true, data: contact }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("PATCH Emergency Contact Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; contactId: string }> }
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

    const { weddingId, contactId } = await params;
    await connectToDatabase();

    const hasPermission = await TeamAuthorization.requireWeddingPermission(weddingId, session.user.id, "emergency");
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Requires emergency permission" } },
        { status: 403 }
      );
    }

    await EmergencyService.deleteContact(weddingId, contactId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("DELETE Emergency Contact Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
