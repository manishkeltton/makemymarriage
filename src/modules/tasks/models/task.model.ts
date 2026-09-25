import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface ITask extends Document {
  weddingId: Types.ObjectId;
  eventId?: Types.ObjectId;
  title: string;
  description?: string;
  assignedTo?: Types.ObjectId;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt?: Date;
  reminderAt?: Date;
  dependencyIds?: Types.ObjectId[];
  completedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
      index: true,
    },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "COMPLETED"],
      default: "TODO",
      index: true,
    },
    dueAt: {
      type: Date,
      index: true,
    },
    reminderAt: {
      type: Date,
    },
    dependencyIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    completedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes specified in Database Design #16
TaskSchema.index({ weddingId: 1, status: 1 });
TaskSchema.index({ weddingId: 1, assignedTo: 1, status: 1 });
TaskSchema.index({ weddingId: 1, eventId: 1, status: 1 });
TaskSchema.index({ weddingId: 1, dueAt: 1 });
TaskSchema.index({ weddingId: 1, priority: 1 });

export const TaskModel: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
