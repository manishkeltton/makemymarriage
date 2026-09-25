import { NextResponse, NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { TaskService } from "@/modules/tasks/services/task.service";
import { createTaskSchema } from "@/modules/tasks/validation/task.schemas";

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

    const parseResult = createTaskSchema.safeParse(body);
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

    const result = await TaskService.createTask(weddingId, session.user.id, parseResult.data);
    if (!result.success) {
      const statusCode = result.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "ERROR", message: result.error } },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
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

    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const eventId = searchParams.get("eventId") || undefined;
    const assignedTo = searchParams.get("assignedTo") || undefined;
    const q = searchParams.get("q") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const sortParam = searchParams.get("sort");
    const orderParam = searchParams.get("order");
    const dueBeforeParam = searchParams.get("dueBefore");
    const dueAfterParam = searchParams.get("dueAfter");

    const dueBefore = dueBeforeParam ? new Date(dueBeforeParam) : undefined;
    const dueAfter = dueAfterParam ? new Date(dueAfterParam) : undefined;

    const status = (statusParam && ["TODO", "IN_PROGRESS", "COMPLETED"].includes(statusParam)) ? statusParam as "TODO" | "IN_PROGRESS" | "COMPLETED" : undefined;
    const priority = (priorityParam && ["LOW", "MEDIUM", "HIGH"].includes(priorityParam)) ? priorityParam as "LOW" | "MEDIUM" | "HIGH" : undefined;
    const sort = (sortParam && ["dueAt", "createdAt", "priority", "status", "title"].includes(sortParam)) ? sortParam as "dueAt" | "createdAt" | "priority" | "status" | "title" : undefined;
    const order = (orderParam && ["asc", "desc"].includes(orderParam)) ? orderParam as "asc" | "desc" : undefined;

    const result = await TaskService.getTasks(weddingId, session.user.id, {
      status,
      priority,
      eventId,
      assignedTo,
      dueBefore,
      dueAfter,
      q,
      limit,
      cursor,
      sort,
      order,
    });

    if (!result.success) {
      const statusCode = result.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code || "ERROR", message: result.error } },
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
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
