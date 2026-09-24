import { NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { getSessionToken, clearSessionCookie } from "@/lib/auth/session";

async function handleLogout() {
  try {
    const token = await getSessionToken();
    
    if (token) {
      await AuthService.logout(token);
    } else {
      await clearSessionCookie();
    }
    
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false };
  }
}

export async function POST() {
  await handleLogout();
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: Request) {
  await handleLogout();
  return NextResponse.redirect(new URL("/login", req.url));
}
