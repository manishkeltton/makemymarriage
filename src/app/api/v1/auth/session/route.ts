import { NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { getSessionToken } from "@/lib/auth/session";

export async function GET() {
  try {
    const token = await getSessionToken();
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: "AUTH_REQUIRED",
            message: "Not authenticated",
          }
        }, 
        { status: 401 }
      );
    }

    const result = await AuthService.verifySession(token);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: result.code,
            message: result.error,
          }
        }, 
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Session verification error:", error);
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
