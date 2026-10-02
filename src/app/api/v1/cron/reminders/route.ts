import { NextRequest, NextResponse } from "next/server";
import { ReminderSchedulerService } from "@/modules/reminders/services/reminder-scheduler.service";

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET || "dev-reminder-cron-secret";
    const authHeader = req.headers.get("authorization");
    const secretHeader = req.headers.get("x-cron-secret");

    const providedSecret = secretHeader || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null);

    if (providedSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid CRON authorization secret" } },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const weddingId = searchParams.get("weddingId") || undefined;

    const result = await ReminderSchedulerService.processReminders({ weddingId });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: result.error } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      processedWeddings: result.processedWeddings,
      notificationsCreated: result.notificationsCreated,
    });
  } catch (error: unknown) {
    console.error("Error in CRON reminders route:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
