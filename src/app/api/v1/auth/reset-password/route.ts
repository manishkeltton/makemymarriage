import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "@/lib/services/auth.service";
import { checkRateLimit } from "@/lib/auth/rate-limit";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required").max(500),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const parsed = resetPasswordSchema.safeParse(body);
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

    const { token, password } = parsed.data;

    // IP-based rate limiting (prevent brute force)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(ip, "reset_password", 10, 1000 * 60 * 60); // 10 per hour

    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many attempts. Please try again later.",
          }
        }, 
        { status: 429 }
      );
    }

    const result = await AuthService.resetPassword(token, password);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: result.code,
            message: result.error,
          }
        }, 
        { status: 400 } // Bad request for invalid token
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
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
