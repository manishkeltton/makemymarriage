import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "@/lib/services/auth.service";
import { checkRateLimit } from "@/lib/auth/rate-limit";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password is too long"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const parsed = signupSchema.safeParse(body);
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

    const { name, email, password } = parsed.data;

    // IP-based rate limiting (fallback to a default if not found)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(ip, "signup", 5, 1000 * 60 * 15); // 5 per 15 minutes

    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many signup attempts. Please try again later.",
          }
        }, 
        { status: 429 }
      );
    }

    const result = await AuthService.signUp(name, email, password);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: result.code,
            message: result.error,
          }
        }, 
        { status: 409 } // Conflict for existing email
      );
    }

    return NextResponse.json(
      { success: true, data: result.user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
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
