import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { NotificationRepository } from "../repositories/notification.repository";
import { INotification } from "../models/notification.model";

export interface NotificationDTO {
  id: string;
  weddingId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
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
   * Creates an in-app notification.
   */
  static async createNotification({
    weddingId,
    userId,
    type,
    title,
    message,
    entityType,
    entityId,
  }: {
    weddingId: string | Types.ObjectId;
    userId: string | Types.ObjectId;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string | Types.ObjectId;
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
      });

      return { success: true, data: toNotificationDTO(doc) };
    } catch (err: unknown) {
      console.error("Error creating notification:", err);
      return { success: false, error: "Failed to create notification" };
    }
  }

  /**
   * Gets user notifications and unread count.
   */
  static async getUserNotifications({
    userId,
    weddingId,
    unreadOnly = false,
    limit = 20,
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
      const [notifications, unreadCount] = await Promise.all([
        NotificationRepository.findNotificationsByUserId({
          userId,
          weddingId,
          unreadOnly,
          limit,
        }),
        NotificationRepository.countUnreadByUserId({ userId, weddingId }),
      ]);

      const dtos = notifications.map(toNotificationDTO);
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
