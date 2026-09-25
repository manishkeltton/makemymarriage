import { Types } from "mongoose";
import { TaskCommentModel, ITaskComment } from "../models/task-comment.model";

export interface CreateCommentParams {
  weddingId: Types.ObjectId;
  taskId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  attachmentIds?: Types.ObjectId[];
}

export class TaskCommentRepository {
  /**
   * Creates a new comment for a task.
   */
  static async create(params: CreateCommentParams): Promise<ITaskComment> {
    const commentDoc = new TaskCommentModel({
      weddingId: params.weddingId,
      taskId: params.taskId,
      authorId: params.authorId,
      body: params.body,
      attachmentIds: params.attachmentIds || [],
    });

    return await commentDoc.save();
  }

  /**
   * Finds all comments for a task sorted by createdAt ascending.
   */
  static async findCommentsByTaskId({
    weddingId,
    taskId,
  }: {
    weddingId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
  }): Promise<ITaskComment[]> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(taskId)) {
      return [];
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const tId = typeof taskId === "string" ? new Types.ObjectId(taskId) : taskId;

    return await TaskCommentModel.find({ weddingId: wId, taskId: tId })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Finds a comment by ID scoped to weddingId and taskId.
   */
  static async findByIdAndWeddingId({
    weddingId,
    taskId,
    commentId,
  }: {
    weddingId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
    commentId: string | Types.ObjectId;
  }): Promise<ITaskComment | null> {
    if (
      !Types.ObjectId.isValid(weddingId) ||
      !Types.ObjectId.isValid(taskId) ||
      !Types.ObjectId.isValid(commentId)
    ) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const tId = typeof taskId === "string" ? new Types.ObjectId(taskId) : taskId;
    const cId = typeof commentId === "string" ? new Types.ObjectId(commentId) : commentId;

    return await TaskCommentModel.findOne({ _id: cId, weddingId: wId, taskId: tId }).exec();
  }

  /**
   * Updates a comment by ID scoped to weddingId and taskId.
   */
  static async updateByIdAndWeddingId({
    weddingId,
    taskId,
    commentId,
    body,
    attachmentIds,
  }: {
    weddingId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
    commentId: string | Types.ObjectId;
    body?: string;
    attachmentIds?: Types.ObjectId[];
  }): Promise<ITaskComment | null> {
    if (
      !Types.ObjectId.isValid(weddingId) ||
      !Types.ObjectId.isValid(taskId) ||
      !Types.ObjectId.isValid(commentId)
    ) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const tId = typeof taskId === "string" ? new Types.ObjectId(taskId) : taskId;
    const cId = typeof commentId === "string" ? new Types.ObjectId(commentId) : commentId;

    const updateData: Record<string, unknown> = {};
    if (body !== undefined) updateData.body = body;
    if (attachmentIds !== undefined) updateData.attachmentIds = attachmentIds;

    return await TaskCommentModel.findOneAndUpdate(
      { _id: cId, weddingId: wId, taskId: tId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Deletes a comment by ID scoped to weddingId and taskId.
   */
  static async deleteByIdAndWeddingId({
    weddingId,
    taskId,
    commentId,
  }: {
    weddingId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
    commentId: string | Types.ObjectId;
  }): Promise<boolean> {
    if (
      !Types.ObjectId.isValid(weddingId) ||
      !Types.ObjectId.isValid(taskId) ||
      !Types.ObjectId.isValid(commentId)
    ) {
      return false;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const tId = typeof taskId === "string" ? new Types.ObjectId(taskId) : taskId;
    const cId = typeof commentId === "string" ? new Types.ObjectId(commentId) : commentId;

    const res = await TaskCommentModel.deleteOne({ _id: cId, weddingId: wId, taskId: tId }).exec();
    return res.deletedCount > 0;
  }

  /**
   * Counts comments for a task.
   */
  static async countCommentsByTaskId({
    weddingId,
    taskId,
  }: {
    weddingId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
  }): Promise<number> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(taskId)) {
      return 0;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const tId = typeof taskId === "string" ? new Types.ObjectId(taskId) : taskId;

    return await TaskCommentModel.countDocuments({ weddingId: wId, taskId: tId });
  }
}
