import { ReminderSchedulerService } from "../src/modules/reminders/services/reminder-scheduler.service";

async function main() {
  const weddingId = process.argv[2] || undefined;
  console.log(`[ReminderWorker] Starting reminder worker execution at ${new Date().toISOString()}...`);

  const result = await ReminderSchedulerService.processReminders({ weddingId });

  if (result.success) {
    console.log(
      `[ReminderWorker] Success! Processed ${result.processedWeddings} wedding(s), created ${result.notificationsCreated} notification(s).`
    );
    process.exit(0);
  } else {
    console.error(`[ReminderWorker] Error: ${result.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[ReminderWorker] Unhandled exception:", err);
  process.exit(1);
});
