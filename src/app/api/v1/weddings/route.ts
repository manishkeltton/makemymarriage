import { NextResponse, NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { WeddingService } from "@/modules/weddings/services/wedding.service";
import { z } from "zod";

const createWeddingSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  bride: z.object({
    name: z.string().min(1, "Bride name is required").max(100),
  }),
  groom: z.object({
    name: z.string().min(1, "Groom name is required").max(100),
  }),
  primaryWeddingDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid primary wedding date",
  }),
  generalLocation: z
    .object({
      name: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    })
    .optional(),
  preferredLanguage: z.enum(["en", "hi"]).optional(),
});

export async function POST(req: NextRequest) {
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

    const parseResult = createWeddingSchema.safeParse(body);
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

    const result = await WeddingService.createWedding(session.user.id, parseResult.data);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: result.code || "INTERNAL_ERROR", message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.wedding }, { status: 201 });
  } catch (error) {
    console.error("Error creating wedding:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    const result = await WeddingService.getUserWeddings(session.user.id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: result.error } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.weddings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching weddings:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
