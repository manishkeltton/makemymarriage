import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "@/lib/services/auth.service";
import { checkRateLimit } from "@/lib/auth/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: parsed.error.flatten().fieldErrors,
          }
        }, 
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // IP-based rate limiting (prevent email enum & spam)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(ip, "forgot_password", 5, 1000 * 60 * 60); // 5 per hour

    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
          }
        }, 
        { status: 429 }
      );
    }

    await AuthService.forgotPassword(email);

    // Always return success to avoid account enumeration
    return NextResponse.json(
      { success: true, data: { accepted: true } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        }
      }, 
      { status: 500 }
    );
  }
}
