import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { NotificationRepository } from "../repositories/notification.repository";
import { INotification } from "../models/notification.model";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { TaskModel } from "@/modules/tasks/models/task.model";
import { ExpenseModel } from "@/modules/expenses/models/expense.model";
import { ExpensePaymentModel } from "@/modules/expenses/models/expense-payment.model";
import { GuestHouseholdModel } from "@/modules/guests/models/guest-household.model";
import { MediaModel } from "@/modules/media/models/media.model";

export interface NotificationDTO {
  id: string;
  weddingId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  link?: string;
  readAt?: string;
  createdAt: string;
}

export function toNotificationDTO(notification: INotification): NotificationDTO {
  const n = notification.toObject ? notification.toObject() : notification;

  return {
    id: (n._id || notification._id).toString(),
    weddingId: (n.weddingId || notification.weddingId).toString(),
    userId: (n.userId || notification.userId).toString(),
    type: n.type || notification.type,
    title: n.title || notification.title,
    message: n.message || notification.message,
    entityType: n.entityType || notification.entityType || undefined,
    entityId: n.entityId || notification.entityId ? (n.entityId || notification.entityId).toString() : undefined,
    link: n.link || notification.link || undefined,
    readAt: n.readAt || notification.readAt
      ? (n.readAt || notification.readAt) instanceof Date
        ? (n.readAt || notification.readAt).toISOString()
        : new Date(n.readAt || notification.readAt).toISOString()
      : undefined,
    createdAt:
      (n.createdAt || notification.createdAt) instanceof Date
        ? (n.createdAt || notification.createdAt).toISOString()
        : new Date(n.createdAt || notification.createdAt).toISOString(),
  };
}

export class NotificationService {
  /**
   * Creates an in-app notification atomically.
   */
  static async createNotification({
    weddingId,
    userId,
    type,
    title,
    message,
    entityType,
    entityId,
    link,
    dedupKey,
  }: {
    weddingId: string | Types.ObjectId;
    userId: string | Types.ObjectId;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string | Types.ObjectId;
    link?: string;
    dedupKey?: string;
  }): Promise<{ success: boolean; data?: NotificationDTO; error?: string }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid parameters" };
    }

    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const uId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const eId = entityId && Types.ObjectId.isValid(entityId)
      ? typeof entityId === "string" ? new Types.ObjectId(entityId) : entityId
      : undefined;

    try {
      const doc = await NotificationRepository.create({
        weddingId: wId,
        userId: uId,
        type,
        title,
        message,
        entityType,
        entityId: eId,
        link,
        dedupKey,
      });

      if (!doc) {
        // Duplicate suppressed
        return { success: true };
      }

      return { success: true, data: toNotificationDTO(doc) };
    } catch (err: unknown) {
      console.error("Error creating notification:", err);
      return { success: false, error: "Failed to create notification" };
    }
  }

  /**
   * Gets user notifications and unread count enforcing Stale Notification Policy & security scope filtering.
   */
  static async getUserNotifications({
    userId,
    weddingId,
    unreadOnly = false,
    limit = 50,
  }: {
    userId: string;
    weddingId?: string;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<{
    success: boolean;
    data?: NotificationDTO[];
    unreadCount?: number;
    error?: string;
  }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID" };
    }

    try {
      const rawNotifications = await NotificationRepository.findNotificationsByUserId({
        userId,
        weddingId,
        unreadOnly: false, // Fetch candidates to sanitize access
        limit: 100,
      });

      if (rawNotifications.length === 0) {
        return { success: true, data: [], unreadCount: 0 };
      }

      // Group notifications by weddingId
      const weddingMap = new Map<string, INotification[]>();
      for (const n of rawNotifications) {
        const wId = n.weddingId.toString();
        if (!weddingMap.has(wId)) {
          weddingMap.set(wId, []);
        }
        weddingMap.get(wId)!.push(n);
      }

      const accessibleNotifications: INotification[] = [];

      for (const [wId, nList] of weddingMap.entries()) {
        const member = await TeamAuthorization.requireWeddingMembership(wId, userId);
        if (!member || member.status !== "ACTIVE") {
          continue; // Revoked or non-member
        }

        // Collect Task, Expense, Household, and Media IDs for batch checks
        const taskIds = new Set<string>();
        const expenseIds = new Set<string>();
        const householdIds = new Set<string>();
        const mediaIds = new Set<string>();

        for (const n of nList) {
          if (n.entityId) {
            const eIdStr = n.entityId.toString();
            if (n.entityType === "TASK" || n.type.startsWith("TASK_")) {
              taskIds.add(eIdStr);
            } else if (n.entityType === "EXPENSE" || n.entityType === "PAYMENT" || n.type.startsWith("PAYMENT_")) {
              expenseIds.add(eIdStr);
            } else if (n.entityType === "GUEST" || n.entityType === "HOUSEHOLD" || n.type.startsWith("RSVP_")) {
              householdIds.add(eIdStr);
            } else if (n.entityType === "MEDIA" || n.type.startsWith("GUEST_UPLOAD")) {
              mediaIds.add(eIdStr);
            }
          }
        }

        const [tasks, expenses, payments, households, mediaList] = await Promise.all([
          taskIds.size > 0
            ? TaskModel.find({ _id: { $in: Array.from(taskIds).filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)) }, weddingId: wId }).exec()
            : [],
          expenseIds.size > 0
            ? ExpenseModel.find({ _id: { $in: Array.from(expenseIds).filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)) }, weddingId: wId }).exec()
            : [],
          expenseIds.size > 0
            ? ExpensePaymentModel.find({ expenseId: { $in: Array.from(expenseIds).filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)) }, weddingId: wId }).exec()
            : [],
          householdIds.size > 0
            ? GuestHouseholdModel.find({ _id: { $in: Array.from(householdIds).filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)) }, weddingId: wId }).exec()
            : [],
          mediaIds.size > 0
            ? MediaModel.find({ _id: { $in: Array.from(mediaIds).filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)) }, weddingId: wId }).exec()
            : [],
        ]);

        const taskMap = new Map(tasks.map((t) => [t._id.toString(), t]));
        const expenseMap = new Map(expenses.map((e) => [e._id.toString(), e]));
        const householdMap = new Map(households.map((h) => [h._id.toString(), h]));
        const mediaMap = new Map(mediaList.map((m) => [m._id.toString(), m]));

        for (const n of nList) {
          if (n.entityType === "TASK" || n.type.startsWith("TASK_")) {
            if (!member || member.status !== "ACTIVE") continue;
            if (n.entityId) {
              const task = taskMap.get(n.entityId.toString());
              if (!task) continue; // Task deleted
              if (!TeamAuthorization.canAccessTask(member, task)) continue; // Ceremony scope revoked
              if (task.assignedTo && task.assignedTo.toString() !== userId) continue; // Reassigned away
              if (n.type.startsWith("TASK_REMINDER") || n.type.startsWith("TASK_DUE") || n.type === "TASK_OVERDUE") {
                if (task.status === "COMPLETED") continue; // Task completed
              }
            }
          } else if (n.entityType === "EXPENSE" || n.entityType === "PAYMENT" || n.type.startsWith("PAYMENT_")) {
            if (!TeamAuthorization.hasPermission(member, "finance")) continue;
            if (n.entityId) {
              const expense = expenseMap.get(n.entityId.toString());
              if (!expense) continue; // Expense deleted
              if (expense.approvalStatus === "REJECTED") continue; // Expense rejected
              if (!TeamAuthorization.canAccessExpense(member, expense)) continue; // Ceremony scope revoked

              // Omit payment reminder if payment installment status is PAID
              if (n.dedupKey && n.dedupKey.includes("_PAYMENT_")) {
                const parts = n.dedupKey.split("_PAYMENT_");
                if (parts[1]) {
                  const paymentIdStr = parts[1].split("_")[0];
                  const paymentObj = payments.find((p) => p._id.toString() === paymentIdStr);
                  if (paymentObj && paymentObj.status === "PAID") continue; // Installment paid
                }
              }
            }
          } else if (n.entityType === "GUEST" || n.entityType === "HOUSEHOLD" || n.type.startsWith("RSVP_")) {
            if (!TeamAuthorization.hasPermission(member, "guests") && member.role !== "ADMIN") continue;
            if (n.entityId) {
              const household = householdMap.get(n.entityId.toString());
              if (!household) continue; // Household deleted from DB
            }
          } else if (n.entityType === "MEDIA" || n.type.startsWith("GUEST_UPLOAD")) {
            if (!TeamAuthorization.hasPermission(member, "gallery") && member.role !== "ADMIN") continue;
            if (n.entityId) {
              const media = mediaMap.get(n.entityId.toString());
              if (!media) continue; // Media item deleted from DB
            }
          }

          accessibleNotifications.push(n);
        }
      }

      // Calculate unread count strictly on accessible notifications
      const unreadCount = accessibleNotifications.filter((n) => !n.readAt).length;

      let filtered = accessibleNotifications;
      if (unreadOnly) {
        filtered = filtered.filter((n) => !n.readAt);
      }

      const dtos = filtered.slice(0, limit).map(toNotificationDTO);
      return { success: true, data: dtos, unreadCount };
    } catch (err: unknown) {
      console.error("Error fetching user notifications:", err);
      return { success: false, error: "Failed to fetch notifications" };
    }
  }

  /**
   * Marks a notification as read.
   */
  static async markRead({
    userId,
    notificationId,
  }: {
    userId: string;
    notificationId: string;
  }): Promise<{ success: boolean; data?: NotificationDTO; error?: string }> {
    await connectToDatabase();

    try {
      const updated = await NotificationRepository.markAsRead({ userId, notificationId });
      if (!updated) {
        return { success: false, error: "Notification not found" };
      }

      return { success: true, data: toNotificationDTO(updated) };
    } catch (err: unknown) {
      console.error("Error marking notification read:", err);
      return { success: false, error: "Failed to mark notification read" };
    }
  }

  /**
   * Marks all notifications as read for a user.
   */
  static async markAllRead({
    userId,
    weddingId,
  }: {
    userId: string;
    weddingId?: string;
  }): Promise<{ success: boolean; count?: number; error?: string }> {
    await connectToDatabase();

    try {
      const count = await NotificationRepository.markAllAsRead({ userId, weddingId });
      return { success: true, count };
    } catch (err: unknown) {
      console.error("Error marking all notifications read:", err);
      return { success: false, error: "Failed to mark all notifications read" };
    }
  }
}
