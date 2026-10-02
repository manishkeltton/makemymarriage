import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { TaskModel } from "@/modules/tasks/models/task.model";
import { ExpenseModel } from "@/modules/expenses/models/expense.model";
import { ExpensePaymentModel } from "@/modules/expenses/models/expense-payment.model";
import { Wedding, IWedding } from "@/modules/weddings/models/wedding.model";
import { IWeddingMember } from "@/modules/weddings/models/wedding-member.model";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { TeamMemberRepository } from "@/modules/team/repositories/team-member.repository";
import { NotificationService } from "@/modules/notifications/services/notification.service";
import { formatINR } from "@/lib/utils/money";

export interface ProcessRemindersResult {
  success: boolean;
  processedWeddings: number;
  notificationsCreated: number;
  error?: string;
}

export class ReminderSchedulerService {
  /**
   * Processes task and payment reminders for active weddings.
   * Can be invoked by protected CRON API, CLI worker, or local scheduler.
   */
  static async processReminders({
    weddingId,
    now = new Date(),
  }: {
    weddingId?: string;
    now?: Date;
  } = {}): Promise<ProcessRemindersResult> {
    await connectToDatabase();

    try {
      let weddingIds: string[] = [];

      if (weddingId && Types.ObjectId.isValid(weddingId)) {
        weddingIds = [weddingId];
      } else {
        // Fetch active weddings in batch iterations (chunk size 50) to process ALL weddings
        let skip = 0;
        const batchSize = 50;
        let batch: IWedding[] = [];
        do {
          batch = await Wedding.find({}).skip(skip).limit(batchSize).exec();
          for (const w of batch) {
            weddingIds.push(w._id.toString());
          }
          skip += batchSize;
        } while (batch.length === batchSize);
      }

      let totalNotificationsCreated = 0;

      for (const wId of weddingIds) {
        const createdCount = await this.processWeddingReminders(wId, now);
        totalNotificationsCreated += createdCount;
      }

      return {
        success: true,
        processedWeddings: weddingIds.length,
        notificationsCreated: totalNotificationsCreated,
      };
    } catch (err: unknown) {
      console.error("Error running reminder scheduler:", err);
      return {
        success: false,
        processedWeddings: 0,
        notificationsCreated: 0,
        error: "Failed to run reminder scheduler",
      };
    }
  }

  private static async processWeddingReminders(weddingId: string, now: Date): Promise<number> {
    let created = 0;

    // Batch fetch active workspace members once for this wedding
    const activeMemberObjs = await TeamMemberRepository.findActiveMembersByWeddingId(weddingId);
    const activeMembers = activeMemberObjs.map(({ member }) => member);
    const memberMap = new Map<string, IWeddingMember>();
    for (const m of activeMembers) {
      if (m.status === "ACTIVE") {
        memberMap.set(m.userId.toString(), m);
      }
    }

    const wQueryId = Types.ObjectId.isValid(weddingId) ? new Types.ObjectId(weddingId) : weddingId;

    // 1. Process Task Reminders
    const tasks = await TaskModel.find({
      weddingId: wQueryId,
      status: { $in: ["TODO", "IN_PROGRESS"] },
    }).exec();

    for (const task of tasks) {
      if (!task.assignedTo) continue;
      const recipientUserId = task.assignedTo.toString();

      // In-memory eligibility check
      const member = memberMap.get(recipientUserId);
      if (!member || member.status !== "ACTIVE") continue;
      if (!TeamAuthorization.canAccessTask(member, task)) continue;

      // a) Custom Reminder (reminderAt <= now)
      if (task.reminderAt) {
        const reminderTime = new Date(task.reminderAt).getTime();
        if (now.getTime() >= reminderTime) {
          const dedupKey = `${recipientUserId}_TASK_${task._id}_TASK_REMINDER_CUSTOM_${reminderTime}`;
          const res = await NotificationService.createNotification({
            weddingId,
            userId: recipientUserId,
            type: "TASK_REMINDER_CUSTOM",
            title: `Reminder: ${task.title}`,
            message: `Task "${task.title}" has a scheduled reminder set for ${new Date(task.reminderAt).toLocaleDateString()}.`,
            entityType: "TASK",
            entityId: task._id.toString(),
            link: `/workspace/${weddingId}/tasks?taskId=${task._id.toString()}`,
            dedupKey,
          });
          if (res.success && res.data) created++;
        }
      }

      // b) Due Soon (dueAt within 24h)
      if (task.dueAt) {
        const dueTime = new Date(task.dueAt).getTime();
        const nowTime = now.getTime();
        const timeDiff = dueTime - nowTime;

        // Due soon window: dueAt is in the future but within 24 hours
        if (timeDiff >= 0 && timeDiff <= 24 * 60 * 60 * 1000) {
          const dueDateStr = new Date(task.dueAt).toISOString().slice(0, 10);
          const dedupKey = `${recipientUserId}_TASK_${task._id}_TASK_DUE_SOON_${dueDateStr}`;
          const res = await NotificationService.createNotification({
            weddingId,
            userId: recipientUserId,
            type: "TASK_DUE_SOON",
            title: `Task Due Soon: ${task.title}`,
            message: `Task "${task.title}" is due soon on ${new Date(task.dueAt).toLocaleDateString()}.`,
            entityType: "TASK",
            entityId: task._id.toString(),
            link: `/workspace/${weddingId}/tasks?taskId=${task._id.toString()}`,
            dedupKey,
          });
          if (res.success && res.data) created++;
        }

        // c) Overdue (now > dueAt)
        if (nowTime > dueTime) {
          const dueDateStr = new Date(task.dueAt).toISOString().slice(0, 10);
          const dedupKey = `${recipientUserId}_TASK_${task._id}_TASK_OVERDUE_${dueDateStr}`;
          const res = await NotificationService.createNotification({
            weddingId,
            userId: recipientUserId,
            type: "TASK_OVERDUE",
            title: `Task Overdue: ${task.title}`,
            message: `Task "${task.title}" was due on ${new Date(task.dueAt).toLocaleDateString()} and is overdue.`,
            entityType: "TASK",
            entityId: task._id.toString(),
            link: `/workspace/${weddingId}/tasks?taskId=${task._id.toString()}`,
            dedupKey,
          });
          if (res.success && res.data) created++;
        }
      }
    }

    // 2. Process Payment Reminders in Bulk
    const pendingPayments = await ExpensePaymentModel.find({
      weddingId: wQueryId,
      status: "PENDING",
    }).exec();

    if (pendingPayments.length > 0) {
      const expenseIds = Array.from(new Set(pendingPayments.map((p) => p.expenseId.toString())));
      const expenses = await ExpenseModel.find({
        _id: { $in: expenseIds.map((id) => Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id) },
        weddingId: wQueryId,
        approvalStatus: { $ne: "REJECTED" },
      }).exec();

      const expenseMap = new Map(expenses.map((e) => [e._id.toString(), e]));

      for (const payment of pendingPayments) {
        if (!payment.dueAt) continue;
        const expense = expenseMap.get(payment.expenseId.toString());
        if (!expense) continue; // Skip if parent expense not found or REJECTED

        const dueTime = new Date(payment.dueAt).getTime();
        const nowTime = now.getTime();
        const timeDiff = dueTime - nowTime;

        let eligibleUserIds: string[] = [];

        if (payment.paidBy?.type === "MEMBER" && payment.paidBy.userId) {
          eligibleUserIds = [payment.paidBy.userId.toString()];
        } else {
          // Notify finance members with ceremony access
          eligibleUserIds = activeMembers
            .filter((m: IWeddingMember) => m.status === "ACTIVE" && TeamAuthorization.canAccessExpense(m, expense))
            .map((m: IWeddingMember) => m.userId.toString());
        }

        const dueDateStr = new Date(payment.dueAt).toISOString().slice(0, 10);

        for (const recipientUserId of eligibleUserIds) {
          const member = memberMap.get(recipientUserId);
          if (!member || member.status !== "ACTIVE") continue;
          if (!TeamAuthorization.canAccessExpense(member, expense)) continue;

          // Payment Due Soon (within 24h)
          if (timeDiff >= 0 && timeDiff <= 24 * 60 * 60 * 1000) {
            const dedupKey = `${recipientUserId}_PAYMENT_${payment._id}_PAYMENT_DUE_SOON_${dueDateStr}`;
            const res = await NotificationService.createNotification({
              weddingId,
              userId: recipientUserId,
              type: "PAYMENT_DUE_SOON",
              title: `Payment Due Soon: ${expense.title}`,
              message: `Payment installment of ${formatINR(payment.amountPaise)} for "${expense.title}" is due on ${new Date(payment.dueAt).toLocaleDateString()}.`,
              entityType: "EXPENSE",
              entityId: expense._id.toString(),
              link: `/workspace/${weddingId}/expenses?expenseId=${expense._id.toString()}`,
              dedupKey,
            });
            if (res.success && res.data) created++;
          }

          // Payment Overdue (now > dueAt)
          if (nowTime > dueTime) {
            const dedupKey = `${recipientUserId}_PAYMENT_${payment._id}_PAYMENT_OVERDUE_${dueDateStr}`;
            const res = await NotificationService.createNotification({
              weddingId,
              userId: recipientUserId,
              type: "PAYMENT_OVERDUE",
              title: `Payment Overdue: ${expense.title}`,
              message: `Payment installment of ${formatINR(payment.amountPaise)} for "${expense.title}" was due on ${new Date(payment.dueAt).toLocaleDateString()} and is overdue.`,
              entityType: "EXPENSE",
              entityId: expense._id.toString(),
              link: `/workspace/${weddingId}/expenses?expenseId=${expense._id.toString()}`,
              dedupKey,
            });
            if (res.success && res.data) created++;
          }
        }
      }
    }

    return created;
  }
}
