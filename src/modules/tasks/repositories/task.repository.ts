import { Types } from "mongoose";
import { TaskModel, ITask, TaskPriority, TaskStatus } from "../models/task.model";

export interface CreateTaskParams {
  weddingId: Types.ObjectId;
  eventId?: Types.ObjectId;
  title: string;
  description?: string;
  assignedTo?: Types.ObjectId;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueAt?: Date;
  reminderAt?: Date;
  dependencyIds?: Types.ObjectId[];
  completedAt?: Date;
  createdBy: Types.ObjectId;
}

export interface UpdateTaskParams {
  title?: string;
  description?: string | null;
  eventId?: Types.ObjectId | null;
  assignedTo?: Types.ObjectId | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueAt?: Date | null;
  reminderAt?: Date | null;
  dependencyIds?: Types.ObjectId[];
  completedAt?: Date | null;
  updatedBy?: Types.ObjectId;
}

export interface TaskFilterParams {
  weddingId: string | Types.ObjectId;
  status?: TaskStatus;
  priority?: TaskPriority;
  eventId?: string;
  assignedTo?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  q?: string;
  limit?: number;
  cursor?: string;
  sort?: "dueAt" | "createdAt" | "priority" | "status" | "title";
  order?: "asc" | "desc";
}

export class TaskRepository {
  /**
   * Creates a new Task record.
   */
  static async create(params: CreateTaskParams): Promise<ITask> {
    const taskDoc = new TaskModel({
      weddingId: params.weddingId,
      eventId: params.eventId,
      title: params.title,
      description: params.description,
      assignedTo: params.assignedTo,
      priority: params.priority || "MEDIUM",
      status: params.status || "TODO",
      dueAt: params.dueAt,
      reminderAt: params.reminderAt,
      dependencyIds: params.dependencyIds || [],
      completedAt: params.completedAt || (params.status === "COMPLETED" ? new Date() : undefined),
      createdBy: params.createdBy,
    });

    return await taskDoc.save();
  }

  /**
   * Finds tasks matching filters with cursor pagination.
   */
  static async findTasksByFilters(
    params: TaskFilterParams
  ): Promise<{ tasks: ITask[]; nextCursor?: string; hasMore: boolean; totalCount: number }> {
    const wId = typeof params.weddingId === "string" ? new Types.ObjectId(params.weddingId) : params.weddingId;
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);

    const query: Record<string, unknown> = { weddingId: wId };

    if (params.status) {
      query.status = params.status;
    }

    if (params.priority) {
      query.priority = params.priority;
    }

    if (params.eventId && Types.ObjectId.isValid(params.eventId)) {
      query.eventId = new Types.ObjectId(params.eventId);
    }

    if (params.assignedTo && Types.ObjectId.isValid(params.assignedTo)) {
      query.assignedTo = new Types.ObjectId(params.assignedTo);
    }

    if (params.dueBefore || params.dueAfter) {
      const dueAtQuery: { $lte?: Date; $gte?: Date } = {};
      if (params.dueBefore) dueAtQuery.$lte = params.dueBefore;
      if (params.dueAfter) dueAtQuery.$gte = params.dueAfter;
      query.dueAt = dueAtQuery;
    }

    if (params.q && params.q.trim()) {
      const searchRegex = new RegExp(params.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Handle cursor pagination
    if (params.cursor && Types.ObjectId.isValid(params.cursor)) {
      query._id = { $gt: new Types.ObjectId(params.cursor) };
    }

    const sortField = params.sort || "createdAt";
    const sortOrder = params.order === "asc" ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortField]: sortOrder, _id: 1 };

    const totalCount = await TaskModel.countDocuments(query);
    const tasks = await TaskModel.find(query)
      .sort(sortObj)
      .limit(limit + 1)
      .exec();

    let hasMore = false;
    let nextCursor: string | undefined = undefined;

    if (tasks.length > limit) {
      hasMore = true;
      tasks.pop(); // Remove extra item
      const lastItem = tasks[tasks.length - 1];
      nextCursor = lastItem._id.toString();
    }

    return { tasks, nextCursor, hasMore, totalCount };
  }

  /**
   * Finds a task strictly scoped by weddingId and taskId.
   */
  static async findByIdAndWeddingId({
    weddingId,
    taskId,
  }: {
    weddingId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
  }): Promise<ITask | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(taskId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const tId = typeof taskId === "string" ? new Types.ObjectId(taskId) : taskId;

    return await TaskModel.findOne({ _id: tId, weddingId: wId }).exec();
  }

  /**
   * Finds multiple tasks by IDs strictly scoped to weddingId.
   */
  static async findTasksByIdsAndWeddingId({
    weddingId,
    taskIds,
  }: {
    weddingId: string | Types.ObjectId;
    taskIds: (string | Types.ObjectId)[];
  }): Promise<ITask[]> {
    if (!Types.ObjectId.isValid(weddingId) || !taskIds.length) {
      return [];
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const validTaskIds = taskIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => (typeof id === "string" ? new Types.ObjectId(id) : id));

    return await TaskModel.find({ _id: { $in: validTaskIds }, weddingId: wId }).exec();
  }

  /**
   * Updates a task strictly scoped by weddingId and taskId.
   */
  static async updateByIdAndWeddingId({
    weddingId,
    taskId,
    updateData,
  }: {
    weddingId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
    updateData: UpdateTaskParams;
  }): Promise<ITask | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(taskId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const tId = typeof taskId === "string" ? new Types.ObjectId(taskId) : taskId;

    return await TaskModel.findOneAndUpdate(
      { _id: tId, weddingId: wId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Deletes a task strictly scoped by weddingId and taskId.
   */
  static async deleteByIdAndWeddingId({
    weddingId,
    taskId,
  }: {
    weddingId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
  }): Promise<boolean> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(taskId)) {
      return false;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const tId = typeof taskId === "string" ? new Types.ObjectId(taskId) : taskId;

    const res = await TaskModel.deleteOne({ _id: tId, weddingId: wId }).exec();
    return res.deletedCount > 0;
  }

  /**
   * Calculates real task metrics for a wedding.
   */
  static async countTaskMetrics(weddingId: string | Types.ObjectId): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    overdueTasks: number;
    upcomingTasks: number;
  }> {
    if (!Types.ObjectId.isValid(weddingId)) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        overdueTasks: 0,
        upcomingTasks: 0,
      };
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const now = new Date();

    // Upcoming means incomplete tasks due from now through next 7 days
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [totalTasks, completedTasks, inProgressTasks, todoTasks, overdueTasks, upcomingTasks] =
      await Promise.all([
        TaskModel.countDocuments({ weddingId: wId }),
        TaskModel.countDocuments({ weddingId: wId, status: "COMPLETED" }),
        TaskModel.countDocuments({ weddingId: wId, status: "IN_PROGRESS" }),
        TaskModel.countDocuments({ weddingId: wId, status: "TODO" }),
        TaskModel.countDocuments({
          weddingId: wId,
          status: { $ne: "COMPLETED" },
          dueAt: { $lt: now },
        }),
        TaskModel.countDocuments({
          weddingId: wId,
          status: { $ne: "COMPLETED" },
          dueAt: { $gte: now, $lte: next7Days },
        }),
      ]);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      upcomingTasks,
    };
  }
}
