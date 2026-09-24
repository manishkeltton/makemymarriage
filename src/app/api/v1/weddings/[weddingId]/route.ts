import { NextResponse, NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { WeddingService } from "@/modules/weddings/services/wedding.service";
import { z } from "zod";

const updateWeddingSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  bride: z.object({ name: z.string().min(1).max(100) }).optional(),
  groom: z.object({ name: z.string().min(1).max(100) }).optional(),
  primaryWeddingDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .transform((val) => new Date(val))
    .optional(),
  generalLocation: z
    .object({
      name: z.string().optional(),
      addressLine1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    })
    .optional(),
  preferredLanguage: z.enum(["en", "hi"]).optional(),
  status: z.enum(["PLANNING", "COMPLETED", "ARCHIVED"]).optional(),
});

export async function GET(
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
    const result = await WeddingService.getWeddingById(weddingId, session.user.id);

    if (!result.success) {
      const statusCode = result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "ERROR", message: result.error } },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching wedding:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    const parseResult = updateWeddingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { weddingId } = await params;
    const result = await WeddingService.updateWedding(weddingId, session.user.id, parseResult.data);

    if (!result.success) {
      const statusCode = result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "ERROR", message: result.error } },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true, data: result.wedding }, { status: 200 });
  } catch (error) {
    console.error("Error updating wedding:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
