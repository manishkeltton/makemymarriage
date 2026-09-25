import { Types } from "mongoose";
import { NotificationModel, INotification } from "../models/notification.model";

export interface CreateNotificationParams {
  weddingId: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: Types.ObjectId;
}

export class NotificationRepository {
  /**
   * Creates an in-app notification.
   */
  static async create(params: CreateNotificationParams): Promise<INotification> {
    const notification = new NotificationModel({
      weddingId: params.weddingId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      entityType: params.entityType,
      entityId: params.entityId,
    });

    return await notification.save();
  }

  /**
   * Finds notifications for a user.
   */
  static async findNotificationsByUserId({
    userId,
    weddingId,
    unreadOnly = false,
    limit = 20,
  }: {
    userId: string | Types.ObjectId;
    weddingId?: string | Types.ObjectId;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<INotification[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const uId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

    const query: Record<string, unknown> = { userId: uId };

    if (weddingId && Types.ObjectId.isValid(weddingId)) {
      query.weddingId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    }

    if (unreadOnly) {
      query.readAt = null;
    }

    return await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .exec();
  }

  /**
   * Counts unread notifications for a user.
   */
  static async countUnreadByUserId({
    userId,
    weddingId,
  }: {
    userId: string | Types.ObjectId;
    weddingId?: string | Types.ObjectId;
  }): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) return 0;
    const uId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

    const query: Record<string, unknown> = { userId: uId, readAt: null };

    if (weddingId && Types.ObjectId.isValid(weddingId)) {
      query.weddingId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    }

    return await NotificationModel.countDocuments(query);
  }

  /**
   * Marks a notification as read.
   */
  static async markAsRead({
    userId,
    notificationId,
  }: {
    userId: string | Types.ObjectId;
    notificationId: string | Types.ObjectId;
  }): Promise<INotification | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(notificationId)) {
      return null;
    }
    const uId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const nId = typeof notificationId === "string" ? new Types.ObjectId(notificationId) : notificationId;

    return await NotificationModel.findOneAndUpdate(
      { _id: nId, userId: uId },
      { $set: { readAt: new Date() } },
      { new: true }
    ).exec();
  }

  /**
   * Marks all notifications as read for a user.
   */
  static async markAllAsRead({
    userId,
    weddingId,
  }: {
    userId: string | Types.ObjectId;
    weddingId?: string | Types.ObjectId;
  }): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) return 0;
    const uId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

    const query: Record<string, unknown> = { userId: uId, readAt: null };
    if (weddingId && Types.ObjectId.isValid(weddingId)) {
      query.weddingId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    }

    const res = await NotificationModel.updateMany(query, { $set: { readAt: new Date() } }).exec();
    return res.modifiedCount;
  }
}
