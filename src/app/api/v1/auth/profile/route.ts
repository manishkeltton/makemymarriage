import { NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { getSessionToken } from "@/lib/auth/session";

const FORBIDDEN_FIELDS = [
  "email",
  "passwordHash",
  "status",
  "isPlatformAdmin",
  "_id",
  "id",
  "createdAt",
  "updatedAt",
  "$set",
  "$unset",
  "$inc",
  "$push",
  "$pull",
];

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
          },
        },
        { status: 401, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    const sessionResult = await AuthService.verifySession(token);
    if (!sessionResult.success) {
      const status = sessionResult.code === "ACCOUNT_SUSPENDED" ? 403 : 401;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: sessionResult.code,
            message: sessionResult.error,
          },
        },
        { status, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    const profile = await AuthService.getProfile(sessionResult.user.id);
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_SUSPENDED",
            message: "Account suspended or user not found",
          },
        },
        { status: 403, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    return NextResponse.json(
      { success: true, data: profile },
      { status: 200, headers: { "Cache-Control": "no-store, private" } }
    );
  } catch (error) {
    console.error("GET /api/v1/auth/profile error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500, headers: { "Cache-Control": "no-store, private" } }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_REQUIRED",
            message: "Not authenticated",
          },
        },
        { status: 401, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    const sessionResult = await AuthService.verifySession(token);
    if (!sessionResult.success) {
      const status = sessionResult.code === "ACCOUNT_SUSPENDED" ? 403 : 401;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: sessionResult.code,
            message: sessionResult.error,
          },
        },
        { status, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON body",
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request body must be an object",
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    const bodyKeys = Object.keys(body);
    const containsForbiddenField = bodyKeys.some(
      (key) => FORBIDDEN_FIELDS.includes(key) || key.startsWith("$")
    );

    if (containsForbiddenField) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN_FIELD_UPDATE",
            message: "Updating email, status, or internal fields is not allowed",
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    const input: { name?: string; preferredLanguage?: "en" | "hi" } = {};

    if ("name" in body) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Name must be a string",
            },
          },
          { status: 400, headers: { "Cache-Control": "no-store, private" } }
        );
      }
      const trimmed = body.name.trim();
      if (trimmed.length < 2 || trimmed.length > 100) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Name must be between 2 and 100 characters long",
            },
          },
          { status: 400, headers: { "Cache-Control": "no-store, private" } }
        );
      }
      input.name = trimmed;
    }

    if ("preferredLanguage" in body) {
      if (body.preferredLanguage !== "en" && body.preferredLanguage !== "hi") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Preferred language must be 'en' or 'hi'",
            },
          },
          { status: 400, headers: { "Cache-Control": "no-store, private" } }
        );
      }
      input.preferredLanguage = body.preferredLanguage;
    }

    const updatedProfile = await AuthService.updateProfile(sessionResult.user.id, input);
    if (!updatedProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_SUSPENDED",
            message: "Account suspended or user not found",
          },
        },
        { status: 403, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedProfile },
      { status: 200, headers: { "Cache-Control": "no-store, private" } }
    );
  } catch (error) {
    console.error("PATCH /api/v1/auth/profile error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500, headers: { "Cache-Control": "no-store, private" } }
    );
  }
}
