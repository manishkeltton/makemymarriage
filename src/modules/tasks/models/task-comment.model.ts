import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ITaskComment extends Document {
  weddingId: Types.ObjectId;
  taskId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  attachmentIds?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskCommentSchema = new Schema<ITaskComment>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    attachmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes specified in Database Design #17
TaskCommentSchema.index({ weddingId: 1, taskId: 1, createdAt: 1 });
TaskCommentSchema.index({ authorId: 1, createdAt: 1 });

export const TaskCommentModel: Model<ITaskComment> =
  mongoose.models.TaskComment ||
  mongoose.model<ITaskComment>("TaskComment", TaskCommentSchema);
