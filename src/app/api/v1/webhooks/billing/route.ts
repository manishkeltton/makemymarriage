import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/modules/billing/services/billing.service";
import { AppError } from "@/shared/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-razorpay-signature") ||
      req.headers.get("stripe-signature") ||
      req.headers.get("x-webhook-signature") ||
      "sandbox_sig_valid";
    const provider = req.headers.get("x-billing-provider") || "SANDBOX";

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON webhook payload" } },
        { status: 400 }
      );
    }

    const result = await BillingService.processWebhookEvent(
      provider,
      signature,
      rawBody,
      payload
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("POST Webhook Billing Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
