import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { PlatformAdminService } from "@/modules/admin/services/platform-admin.service";
import { platformAdminOverrideSchema } from "@/modules/billing/validation/billing.validation";
import { AppError } from "@/shared/errors/app-error";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
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

    const { subscriptionId } = await params;
    const body = await req.json().catch(() => null);

    const parseResult = platformAdminOverrideSchema.safeParse(body || {});
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid admin override input",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const result = await PlatformAdminService.overrideSubscription(
      session.user.id,
      subscriptionId,
      parseResult.data
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("POST Admin Override Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
