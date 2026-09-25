import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { VendorService } from "@/modules/vendors/services/vendor.service";
import { createVendorSchema } from "@/modules/vendors/validation/vendor.schemas";
import { VendorCategory } from "@/modules/vendors/dto/vendor.dto";

export async function POST(
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
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    const parseResult = createVendorSchema.safeParse(body);
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

    const result = await VendorService.createVendor(weddingId, session.user.id, parseResult.data);

    if (!result.success) {
      const status = result.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "BAD_REQUEST", message: result.error } },
        { status }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST Vendor Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

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
    const searchParams = req.nextUrl.searchParams;

    const categoryParam = searchParams.get("category");
    const eventId = searchParams.get("eventId") || undefined;
    const q = searchParams.get("q") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const sortParam = searchParams.get("sort");
    const orderParam = searchParams.get("order");

    const category = categoryParam ? (categoryParam as VendorCategory) : undefined;
    const sort = sortParam ? (sortParam as "name" | "category" | "createdAt" | "agreedAmountPaise") : undefined;
    const order = orderParam ? (orderParam as "asc" | "desc") : undefined;

    const result = await VendorService.getVendors(weddingId, session.user.id, {
      category,
      eventId,
      q,
      limit,
      cursor,
      sort,
      order,
    });

    if (!result.success) {
      const statusCode = result.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "BAD_REQUEST", message: result.error } },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        totalCount: result.totalCount,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("GET Vendors Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
