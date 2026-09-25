import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "@/lib/services/auth.service";
import { checkRateLimit } from "@/lib/auth/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const parsed = loginSchema.safeParse(body);
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

    const { email, password } = parsed.data;

    // IP-based rate limiting (fallback to a default if not found)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(ip, "login", 10, 1000 * 60 * 15); // 10 per 15 minutes

    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many login attempts. Please try again later.",
          }
        }, 
        { status: 429 }
      );
    }

    const result = await AuthService.login(email, password);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: result.code,
            message: result.error,
          }
        }, 
        { status: 401 } // Unauthorized for bad credentials
      );
    }

    return NextResponse.json(
      { success: true, data: result.user },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Login error:", error);
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
