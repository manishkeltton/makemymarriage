import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { BillingService } from "@/modules/billing/services/billing.service";
import { checkoutSchema } from "@/modules/billing/validation/billing.validation";
import { AppError } from "@/shared/errors/app-error";

export async function POST(
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
    const body = await req.json().catch(() => null);

    const parseResult = checkoutSchema.safeParse(body || {});
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid checkout request",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const sessionDTO = await BillingService.createCheckoutSession(
      weddingId,
      session.user.id,
      parseResult.data
    );

    return NextResponse.json({ success: true, data: sessionDTO }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message, details: err.details } },
        { status: err.status }
      );
    }
    console.error("POST Billing Checkout Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
