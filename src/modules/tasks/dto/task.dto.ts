import { ITask, TaskPriority, TaskStatus } from "../models/task.model";
import { ITaskComment } from "../models/task-comment.model";

export interface TaskDTO {
  id: string;
  weddingId: string;
  eventId?: string;
  eventName?: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt?: string;
  reminderAt?: string;
  dependencyIds?: string[];
  completedAt?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
  documentCount?: number;
}

export interface TaskCommentDTO {
  id: string;
  weddingId: string;
  taskId: string;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  body: string;
  attachmentIds?: string[];
  attachments?: Array<{
    id: string;
    title: string;
    type: string;
    fileKey?: string;
    mimeType?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummaryDTO {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
  completionPercentage: number;
}

export function toTaskDTO(
  task: ITask,
  options?: {
    eventName?: string;
    assigneeName?: string;
    assigneeEmail?: string;
    commentCount?: number;
    documentCount?: number;
  }
): TaskDTO {
  const doc = task.toObject ? task.toObject() : task;

  return {
    id: (doc._id || task._id).toString(),
    weddingId: (doc.weddingId || task.weddingId).toString(),
    eventId: doc.eventId || task.eventId ? (doc.eventId || task.eventId).toString() : undefined,
    eventName: options?.eventName,
    title: doc.title || task.title,
    description: doc.description || task.description || undefined,
    assignedTo: doc.assignedTo || task.assignedTo ? (doc.assignedTo || task.assignedTo).toString() : undefined,
    assigneeName: options?.assigneeName,
    assigneeEmail: options?.assigneeEmail,
    priority: (doc.priority || task.priority || "MEDIUM") as TaskPriority,
    status: (doc.status || task.status || "TODO") as TaskStatus,
    dueAt: doc.dueAt || task.dueAt
      ? (doc.dueAt || task.dueAt) instanceof Date
        ? (doc.dueAt || task.dueAt).toISOString()
        : new Date(doc.dueAt || task.dueAt).toISOString()
      : undefined,
    reminderAt: doc.reminderAt || task.reminderAt
      ? (doc.reminderAt || task.reminderAt) instanceof Date
        ? (doc.reminderAt || task.reminderAt).toISOString()
        : new Date(doc.reminderAt || task.reminderAt).toISOString()
      : undefined,
    dependencyIds: (doc.dependencyIds || task.dependencyIds || []).map((id: unknown) => id!.toString()),
    completedAt: doc.completedAt || task.completedAt
      ? (doc.completedAt || task.completedAt) instanceof Date
        ? (doc.completedAt || task.completedAt).toISOString()
        : new Date(doc.completedAt || task.completedAt).toISOString()
      : undefined,
    createdBy: (doc.createdBy || task.createdBy).toString(),
    updatedBy: doc.updatedBy || task.updatedBy ? (doc.updatedBy || task.updatedBy).toString() : undefined,
    createdAt:
      (doc.createdAt || task.createdAt) instanceof Date
        ? (doc.createdAt || task.createdAt).toISOString()
        : new Date(doc.createdAt || task.createdAt).toISOString(),
    updatedAt:
      (doc.updatedAt || task.updatedAt) instanceof Date
        ? (doc.updatedAt || task.updatedAt).toISOString()
        : new Date(doc.updatedAt || task.updatedAt).toISOString(),
    commentCount: options?.commentCount,
    documentCount: options?.documentCount,
  };
}

export function toTaskCommentDTO(
  comment: ITaskComment,
  options?: {
    authorName?: string;
    authorEmail?: string;
    attachments?: Array<{
      id: string;
      title: string;
      type: string;
      fileKey?: string;
      mimeType?: string;
    }>;
  }
): TaskCommentDTO {
  const doc = comment.toObject ? comment.toObject() : comment;

  return {
    id: (doc._id || comment._id).toString(),
    weddingId: (doc.weddingId || comment.weddingId).toString(),
    taskId: (doc.taskId || comment.taskId).toString(),
    authorId: (doc.authorId || comment.authorId).toString(),
    authorName: options?.authorName,
    authorEmail: options?.authorEmail,
    body: doc.body || comment.body,
    attachmentIds: (doc.attachmentIds || comment.attachmentIds || []).map((id: unknown) => id!.toString()),
    attachments: options?.attachments,
    createdAt:
      (doc.createdAt || comment.createdAt) instanceof Date
        ? (doc.createdAt || comment.createdAt).toISOString()
        : new Date(doc.createdAt || comment.createdAt).toISOString(),
    updatedAt:
      (doc.updatedAt || comment.updatedAt) instanceof Date
        ? (doc.updatedAt || comment.updatedAt).toISOString()
        : new Date(doc.updatedAt || comment.updatedAt).toISOString(),
  };
}
