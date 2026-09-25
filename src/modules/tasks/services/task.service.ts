import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { TaskRepository, TaskFilterParams, UpdateTaskParams } from "../repositories/task.repository";
import { TaskCommentRepository } from "../repositories/task-comment.repository";
import { TaskDTO, TaskCommentDTO, TaskSummaryDTO, toTaskDTO, toTaskCommentDTO } from "../dto/task.dto";
import { CreateTaskInput, UpdateTaskInput, CreateCommentInput, GenerateChecklistInput } from "../validation/task.schemas";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { EventRepository } from "@/modules/events/repositories/event.repository";
import { EventType } from "@/modules/events/models/event.model";
import { TeamMemberRepository } from "@/modules/team/repositories/team-member.repository";
import { NotificationService } from "@/modules/notifications/services/notification.service";
import { DocumentRepository } from "@/modules/documents/repositories/document.repository";

// Predefined Hindu Wedding Checklist Tasks Template
export const HINDU_WEDDING_CHECKLIST_TEMPLATES = [
  // Venue
  { category: "Venue", title: "Shortlist Venues for Wedding & Ceremonies", priority: "HIGH" as const, eventTypeMatch: "CUSTOM" },
  { category: "Venue", title: "Finalise Venue & Sign Booking Contract", priority: "HIGH" as const, eventTypeMatch: "CUSTOM" },
  { category: "Venue", title: "Pay Venue Deposit & Advance", priority: "HIGH" as const, eventTypeMatch: "CUSTOM" },
  { category: "Venue", title: "Confirm Venue Entry & Sound Cut-off Timings", priority: "MEDIUM" as const, eventTypeMatch: "CUSTOM" },

  // Catering
  { category: "Catering", title: "Finalise Wedding Caterer & Tasting Menu", priority: "HIGH" as const, eventTypeMatch: "CUSTOM" },
  { category: "Catering", title: "Finalise Sweets, Snacks & Chaat Stalls", priority: "MEDIUM" as const, eventTypeMatch: "CUSTOM" },
  { category: "Catering", title: "Confirm Final Guest Guarantee Count with Caterer", priority: "HIGH" as const, eventTypeMatch: "CUSTOM" },
  { category: "Catering", title: "Pay Catering Advance Payment", priority: "MEDIUM" as const, eventTypeMatch: "CUSTOM" },

  // Photography
  { category: "Photography", title: "Finalise Wedding Photographer & Cinematographer", priority: "HIGH" as const, eventTypeMatch: "CUSTOM" },
  { category: "Photography", title: "Sign Photography Agreement & Deliverables List", priority: "HIGH" as const, eventTypeMatch: "CUSTOM" },
  { category: "Photography", title: "Pay Photographer Booking Advance", priority: "MEDIUM" as const, eventTypeMatch: "CUSTOM" },
  { category: "Photography", title: "Share Shot List & Event Timings with Photography Team", priority: "MEDIUM" as const, eventTypeMatch: "CUSTOM" },

  // Decoration
  { category: "Decoration", title: "Finalise Stage & Mandap Decorator", priority: "HIGH" as const, eventTypeMatch: "WEDDING" },
  { category: "Decoration", title: "Approve Decor Concept & Floral Color Palettes", priority: "HIGH" as const, eventTypeMatch: "CUSTOM" },
  { category: "Decoration", title: "Pay Decorator Deposit", priority: "MEDIUM" as const, eventTypeMatch: "CUSTOM" },

  // Ceremony & Puja
  { category: "Ceremony & Puja", title: "Confirm Panditji for Wedding Muhurat & Rituals", priority: "HIGH" as const, eventTypeMatch: "WEDDING" },
  { category: "Ceremony & Puja", title: "Confirm Shubh Vivah Muhurat & Pheras Timing", priority: "HIGH" as const, eventTypeMatch: "WEDDING" },
  { category: "Ceremony & Puja", title: "Arrange Puja Samagri & Havan Requirements", priority: "HIGH" as const, eventTypeMatch: "WEDDING" },
  { category: "Ceremony & Puja", title: "Arrange Fresh Floral Varmalas (Jaimala)", priority: "HIGH" as const, eventTypeMatch: "WEDDING" },
  { category: "Ceremony & Puja", title: "Arrange Mandap Pooja Setup & Sacred Fire Provisions", priority: "HIGH" as const, eventTypeMatch: "WEDDING" },

  // Invitations
  { category: "Invitations", title: "Prepare Master Wedding Guest List & Families", priority: "HIGH" as const, eventTypeMatch: "CUSTOM" },
  { category: "Invitations", title: "Finalise Invitation Card Design & Digital E-Invite", priority: "MEDIUM" as const, eventTypeMatch: "CUSTOM" },
  { category: "Invitations", title: "Distribute Wedding Invitations & Send Digital Invites", priority: "HIGH" as const, eventTypeMatch: "CUSTOM" },
  { category: "Invitations", title: "Follow up on Guest RSVPs & Accommodation Needs", priority: "MEDIUM" as const, eventTypeMatch: "CUSTOM" },

  // Clothing
  { category: "Clothing", title: "Select & Purchase Bridal Lehenga & Jewelry", priority: "HIGH" as const, eventTypeMatch: "WEDDING" },
  { category: "Clothing", title: "Select & Purchase Groom Sherwani & Safa", priority: "HIGH" as const, eventTypeMatch: "WEDDING" },
  { category: "Clothing", title: "Coordinate Family & Close Relative Outfits", priority: "MEDIUM" as const, eventTypeMatch: "CUSTOM" },
  { category: "Clothing", title: "Schedule Final Outfit Fittings & Alterations", priority: "MEDIUM" as const, eventTypeMatch: "CUSTOM" },
];

export class TaskService {
  /**
   * Private helper to detect multi-hop circular dependencies in task graphs using BFS.
   */
  private static async checkHasCircularDependency(
    weddingId: string,
    targetTaskId: string,
    proposedDependencyIds: string[]
  ): Promise<string | null> {
    const visited = new Set<string>();
    const queue = [...proposedDependencyIds];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === targetTaskId) {
        const target = await TaskRepository.findByIdAndWeddingId({ weddingId, taskId: currentId });
        return target?.title || currentId;
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentTask = await TaskRepository.findByIdAndWeddingId({ weddingId, taskId: currentId });
      if (currentTask && currentTask.dependencyIds && currentTask.dependencyIds.length > 0) {
        for (const depId of currentTask.dependencyIds) {
          const depIdStr = depId.toString();
          if (!visited.has(depIdStr)) {
            queue.push(depIdStr);
          }
        }
      }
    }

    return null;
  }

  /**
   * Fetches tasks for a wedding workspace with filtering and enriched DTO info.
   */
  static async getTasks(
    weddingId: string,
    userId: string,
    filters: Omit<TaskFilterParams, "weddingId">
  ): Promise<{
    success: boolean;
    data?: TaskDTO[];
    nextCursor?: string;
    hasMore?: boolean;
    totalCount?: number;
    error?: string;
    code?: string;
  }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    try {
      const { tasks, nextCursor, hasMore, totalCount } = await TaskRepository.findTasksByFilters({
        weddingId,
        ...filters,
      });

      // Gather reference IDs for bulk enrichment
      const eventIds = Array.from(
        new Set(tasks.map((t) => t.eventId?.toString()).filter(Boolean) as string[])
      );
      const userIds = Array.from(
        new Set(tasks.map((t) => t.assignedTo?.toString()).filter(Boolean) as string[])
      );
      const taskIds = tasks.map((t) => t._id.toString());

      const [events, users, commentCounts, docCounts] = await Promise.all([
        eventIds.length ? EventRepository.findEventsByWeddingId({ weddingId }) : Promise.resolve([]),
        userIds.length ? User.find({ _id: { $in: userIds } }) : Promise.resolve([]),
        Promise.all(taskIds.map((tId) => TaskCommentRepository.countCommentsByTaskId({ weddingId, taskId: tId }))),
        Promise.all(
          taskIds.map((tId) =>
            DocumentRepository.countDocumentsByRelatedId({
              weddingId,
              relatedType: "TASK",
              relatedId: tId,
            })
          )
        ),
      ]);

      const eventMap = new Map(events.map((e) => [e._id.toString(), e.name]));
      const userMap = new Map(users.map((u) => [u._id.toString(), { name: u.name, email: u.email }]));

      const dtos = tasks.map((t, idx) => {
        const eId = t.eventId?.toString();
        const uId = t.assignedTo?.toString();
        const uInfo = uId ? userMap.get(uId) : undefined;

        return toTaskDTO(t, {
          eventName: eId ? eventMap.get(eId) : undefined,
          assigneeName: uInfo?.name,
          assigneeEmail: uInfo?.email,
          commentCount: commentCounts[idx] || 0,
          documentCount: docCounts[idx] || 0,
        });
      });

      return { success: true, data: dtos, nextCursor, hasMore, totalCount };
    } catch (err: unknown) {
      console.error("Error fetching tasks:", err);
      return { success: false, error: "Failed to fetch tasks", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Fetches a single task by ID.
   */
  static async getTaskById(
    weddingId: string,
    taskId: string,
    userId: string
  ): Promise<{ success: boolean; data?: TaskDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    try {
      const task = await TaskRepository.findByIdAndWeddingId({ weddingId, taskId });
      if (!task) {
        return { success: false, error: "Task not found", code: "NOT_FOUND" };
      }

      let eventName: string | undefined = undefined;
      if (task.eventId) {
        const ev = await EventRepository.findByIdAndWeddingId({ weddingId, eventId: task.eventId.toString() });
        eventName = ev?.name;
      }

      let assigneeName: string | undefined = undefined;
      let assigneeEmail: string | undefined = undefined;
      if (task.assignedTo) {
        const u = await User.findById(task.assignedTo);
        assigneeName = u?.name;
        assigneeEmail = u?.email;
      }

      const commentCount = await TaskCommentRepository.countCommentsByTaskId({ weddingId, taskId });
      const documentCount = await DocumentRepository.countDocumentsByRelatedId({
        weddingId,
        relatedType: "TASK",
        relatedId: taskId,
      });

      return {
        success: true,
        data: toTaskDTO(task, { eventName, assigneeName, assigneeEmail, commentCount, documentCount }),
      };
    } catch (err: unknown) {
      console.error("Error fetching task by ID:", err);
      return { success: false, error: "Failed to fetch task", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Creates a task in a wedding workspace with strict same-wedding validations.
   */
  static async createTask(
    weddingId: string,
    userId: string,
    payload: CreateTaskInput
  ): Promise<{ success: boolean; data?: TaskDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    // 1. Validate eventId belongs to same wedding
    if (payload.eventId) {
      const validEvent = await EventRepository.findByIdAndWeddingId({ weddingId, eventId: payload.eventId });
      if (!validEvent) {
        return { success: false, error: "Referenced event does not belong to this wedding workspace", code: "INVALID_EVENT" };
      }
    }

    // 2. Validate assignedTo is an active member of same wedding
    if (payload.assignedTo) {
      const targetMember = await TeamMemberRepository.findByUserIdAndWeddingId({
        weddingId,
        userId: payload.assignedTo,
      });
      if (!targetMember || targetMember.status !== "ACTIVE") {
        return { success: false, error: "Assigned user is not an active member of this wedding workspace", code: "INVALID_ASSIGNEE" };
      }
    }

    // 3. Validate dependencyIds belong to same wedding
    const dependencyObjectIds: Types.ObjectId[] = [];
    if (payload.dependencyIds && payload.dependencyIds.length > 0) {
      const validDeps = await TaskRepository.findTasksByIdsAndWeddingId({
        weddingId,
        taskIds: payload.dependencyIds,
      });
      if (validDeps.length !== payload.dependencyIds.length) {
        return { success: false, error: "One or more dependencies do not belong to this wedding workspace", code: "INVALID_DEPENDENCY" };
      }
      dependencyObjectIds.push(...validDeps.map((d) => d._id));
    }

    try {
      const wId = new Types.ObjectId(weddingId);
      const uId = new Types.ObjectId(userId);

      const task = await TaskRepository.create({
        weddingId: wId,
        eventId: payload.eventId ? new Types.ObjectId(payload.eventId) : undefined,
        title: payload.title,
        description: payload.description,
        assignedTo: payload.assignedTo ? new Types.ObjectId(payload.assignedTo) : undefined,
        priority: payload.priority,
        status: payload.status,
        dueAt: payload.dueAt ? new Date(payload.dueAt) : undefined,
        reminderAt: payload.reminderAt ? new Date(payload.reminderAt) : undefined,
        dependencyIds: dependencyObjectIds,
        completedAt: payload.status === "COMPLETED" ? new Date() : undefined,
        createdBy: uId,
      });

      // Notification on assignment
      if (payload.assignedTo && payload.assignedTo !== userId) {
        await NotificationService.createNotification({
          weddingId,
          userId: payload.assignedTo,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `You have been assigned to task "${task.title}"`,
          entityType: "TASK",
          entityId: task._id,
        });
      }

      return { success: true, data: toTaskDTO(task) };
    } catch (err: unknown) {
      console.error("Error creating task:", err);
      return { success: false, error: "Failed to create task", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Updates a task with circular dependency checks and status timestamp handling.
   */
  static async updateTask(
    weddingId: string,
    taskId: string,
    userId: string,
    payload: UpdateTaskInput
  ): Promise<{ success: boolean; data?: TaskDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    const existingTask = await TaskRepository.findByIdAndWeddingId({ weddingId, taskId });
    if (!existingTask) {
      return { success: false, error: "Task not found", code: "NOT_FOUND" };
    }

    const updateData: UpdateTaskParams = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.priority !== undefined) updateData.priority = payload.priority;

    // Validate eventId
    if (payload.eventId !== undefined) {
      if (payload.eventId === null) {
        updateData.eventId = null;
      } else {
        const validEvent = await EventRepository.findByIdAndWeddingId({ weddingId, eventId: payload.eventId });
        if (!validEvent) {
          return { success: false, error: "Referenced event does not belong to this wedding workspace", code: "INVALID_EVENT" };
        }
        updateData.eventId = new Types.ObjectId(payload.eventId);
      }
    }

    // Validate assignedTo
    if (payload.assignedTo !== undefined) {
      if (payload.assignedTo === null) {
        updateData.assignedTo = null;
      } else {
        const targetMember = await TeamMemberRepository.findByUserIdAndWeddingId({
          weddingId,
          userId: payload.assignedTo,
        });
        if (!targetMember || targetMember.status !== "ACTIVE") {
          return { success: false, error: "Assigned user is not an active member of this wedding workspace", code: "INVALID_ASSIGNEE" };
        }
        updateData.assignedTo = new Types.ObjectId(payload.assignedTo);
      }
    }

    // Validate dueAt & reminderAt
    if (payload.dueAt !== undefined) {
      updateData.dueAt = payload.dueAt ? new Date(payload.dueAt) : null;
    }
    if (payload.reminderAt !== undefined) {
      updateData.reminderAt = payload.reminderAt ? new Date(payload.reminderAt) : null;
    }

    // Handle status & completedAt
    if (payload.status !== undefined) {
      updateData.status = payload.status;
      if (payload.status === "COMPLETED" && existingTask.status !== "COMPLETED") {
        updateData.completedAt = new Date();
      } else if (payload.status !== "COMPLETED" && existingTask.status === "COMPLETED") {
        updateData.completedAt = null;
      }
    }

    // Validate dependencyIds with Non-Self & Multi-Hop Circular Dependency Checks
    if (payload.dependencyIds !== undefined) {
      if (payload.dependencyIds.includes(taskId)) {
        return { success: false, error: "A task cannot depend on itself", code: "SELF_DEPENDENCY" };
      }

      const validDeps = await TaskRepository.findTasksByIdsAndWeddingId({
        weddingId,
        taskIds: payload.dependencyIds,
      });
      if (validDeps.length !== payload.dependencyIds.length) {
        return { success: false, error: "One or more dependencies do not belong to this wedding workspace", code: "INVALID_DEPENDENCY" };
      }

      // Multi-hop circular dependency check via graph BFS traversal
      const cyclicTaskTitle = await TaskService.checkHasCircularDependency(
        weddingId,
        taskId,
        payload.dependencyIds
      );
      if (cyclicTaskTitle) {
        return {
          success: false,
          error: `Circular dependency detected involving task "${cyclicTaskTitle}"`,
          code: "CIRCULAR_DEPENDENCY",
        };
      }

      updateData.dependencyIds = validDeps.map((d) => d._id);
    }

    try {
      const updatedTask = await TaskRepository.updateByIdAndWeddingId({
        weddingId,
        taskId,
        updateData,
      });

      // Trigger notification if newly assigned to someone else
      if (
        payload.assignedTo &&
        payload.assignedTo !== userId &&
        payload.assignedTo !== existingTask.assignedTo?.toString()
      ) {
        await NotificationService.createNotification({
          weddingId,
          userId: payload.assignedTo,
          type: "TASK_ASSIGNED",
          title: "Task Assigned",
          message: `You have been assigned to task "${updatedTask!.title}"`,
          entityType: "TASK",
          entityId: updatedTask!._id,
        });
      }

      return { success: true, data: toTaskDTO(updatedTask!) };
    } catch (err: unknown) {
      console.error("Error updating task:", err);
      return { success: false, error: "Failed to update task", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Deletes a task and its comments.
   */
  static async deleteTask(
    weddingId: string,
    taskId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    const existingTask = await TaskRepository.findByIdAndWeddingId({ weddingId, taskId });
    if (!existingTask) {
      return { success: false, error: "Task not found", code: "NOT_FOUND" };
    }

    // Role check: Only Admin, Manager, or task creator can delete tasks
    if (
      member.role !== "ADMIN" &&
      member.role !== "MANAGER" &&
      existingTask.createdBy?.toString() !== userId
    ) {
      return { success: false, error: "Only admins, managers, or task creator can delete this task", code: "FORBIDDEN" };
    }

    try {
      const deleted = await TaskRepository.deleteByIdAndWeddingId({ weddingId, taskId });
      if (!deleted) {
        return { success: false, error: "Task not found", code: "NOT_FOUND" };
      }

      return { success: true };
    } catch (err: unknown) {
      console.error("Error deleting task:", err);
      return { success: false, error: "Failed to delete task", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Generates predefined Hindu Wedding Checklist tasks.
   */
  static async generateChecklist(
    weddingId: string,
    userId: string,
    payload: GenerateChecklistInput
  ): Promise<{ success: boolean; generatedCount?: number; data?: TaskDTO[]; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    if (member.role !== "ADMIN" && member.role !== "MANAGER") {
      return { success: false, error: "Only admins or managers can generate automated checklists", code: "FORBIDDEN" };
    }

    try {
      const mode = payload.duplicateHandling || "SKIP_EXISTING";
      const wId = new Types.ObjectId(weddingId);
      const uId = new Types.ObjectId(userId);

      // Fetch existing tasks and events for matching
      const [existingTasks, existingEvents] = await Promise.all([
        TaskRepository.findTasksByFilters({ weddingId, limit: 500 }),
        EventRepository.findEventsByWeddingId({ weddingId }),
      ]);

      const existingTitleMap = new Map(existingTasks.tasks.map((t) => [t.title.toLowerCase().trim(), t]));
      const eventMap = new Map(existingEvents.map((e) => [e.type, e._id]));

      let templatesToProcess = HINDU_WEDDING_CHECKLIST_TEMPLATES;
      if (payload.categories && payload.categories.length > 0) {
        const catSet = new Set(payload.categories.map((c) => c.toLowerCase().trim()));
        templatesToProcess = templatesToProcess.filter((t) => catSet.has(t.category.toLowerCase().trim()));
      }

      const createdTasks: TaskDTO[] = [];

      for (const tmpl of templatesToProcess) {
        const normalizedTitle = tmpl.title.toLowerCase().trim();
        const existing = existingTitleMap.get(normalizedTitle);

        if (existing && mode === "SKIP_EXISTING") {
          continue; // Skip existing
        }

        const matchedEventId = tmpl.eventTypeMatch && tmpl.eventTypeMatch !== "CUSTOM"
          ? eventMap.get(tmpl.eventTypeMatch as EventType)
          : undefined;

        if (existing && mode === "REPLACE_EXISTING") {
          // Update in-place to preserve task ObjectId, comments, attachments & dependency pointers
          const updatedTask = await TaskRepository.updateByIdAndWeddingId({
            weddingId,
            taskId: existing._id.toString(),
            updateData: {
              title: tmpl.title,
              description: `Predefined Hindu Wedding Checklist (${tmpl.category})`,
              priority: tmpl.priority,
              eventId: matchedEventId || null,
              updatedBy: uId,
            },
          });

          if (updatedTask) {
            createdTasks.push(toTaskDTO(updatedTask));
          }
          continue;
        }

        const newTask = await TaskRepository.create({
          weddingId: wId,
          eventId: matchedEventId,
          title: tmpl.title,
          description: `Predefined Hindu Wedding Checklist (${tmpl.category})`,
          priority: tmpl.priority,
          status: "TODO",
          createdBy: uId,
        });

        createdTasks.push(toTaskDTO(newTask));
      }

      return {
        success: true,
        generatedCount: createdTasks.length,
        data: createdTasks,
      };
    } catch (err: unknown) {
      console.error("Error generating Hindu Wedding Checklist:", err);
      return { success: false, error: "Failed to generate checklist", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Fetches comments for a task.
   */
  static async getComments(
    weddingId: string,
    taskId: string,
    userId: string
  ): Promise<{ success: boolean; data?: TaskCommentDTO[]; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    try {
      const comments = await TaskCommentRepository.findCommentsByTaskId({ weddingId, taskId });

      // Gather author IDs & attachment IDs for bulk enrichment
      const authorIds = Array.from(new Set(comments.map((c) => c.authorId.toString())));
      const attachmentIds = Array.from(
        new Set(comments.flatMap((c) => (c.attachmentIds || []).map((id) => id.toString())))
      );

      const [authors, documents] = await Promise.all([
        User.find({ _id: { $in: authorIds } }),
        attachmentIds.length
          ? DocumentRepository.findDocumentsByIdsAndWeddingId({ weddingId, documentIds: attachmentIds })
          : Promise.resolve([]),
      ]);

      const authorMap = new Map(authors.map((u) => [u._id.toString(), { name: u.name, email: u.email }]));
      const docMap = new Map(
        documents.map((d) => [
          d._id.toString(),
          { id: d._id.toString(), title: d.title, type: d.type, fileKey: d.fileKey, mimeType: d.mimeType },
        ])
      );

      const dtos = comments.map((c) => {
        const aInfo = authorMap.get(c.authorId.toString());
        const attachedDocs = (c.attachmentIds || [])
          .map((id) => docMap.get(id.toString()))
          .filter(Boolean) as Array<{ id: string; title: string; type: string; fileKey?: string; mimeType?: string }>;

        return toTaskCommentDTO(c, {
          authorName: aInfo?.name || "Team Member",
          authorEmail: aInfo?.email,
          attachments: attachedDocs,
        });
      });

      return { success: true, data: dtos };
    } catch (err: unknown) {
      console.error("Error fetching comments:", err);
      return { success: false, error: "Failed to fetch comments", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Creates a comment on a task.
   */
  static async createComment(
    weddingId: string,
    taskId: string,
    userId: string,
    payload: CreateCommentInput
  ): Promise<{ success: boolean; data?: TaskCommentDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    const task = await TaskRepository.findByIdAndWeddingId({ weddingId, taskId });
    if (!task) {
      return { success: false, error: "Task not found", code: "NOT_FOUND" };
    }

    // Validate attachmentIds belong to the same wedding workspace
    if (payload.attachmentIds && payload.attachmentIds.length > 0) {
      const validDocs = await DocumentRepository.findDocumentsByIdsAndWeddingId({
        weddingId,
        documentIds: payload.attachmentIds,
      });
      if (validDocs.length !== payload.attachmentIds.length) {
        return {
          success: false,
          error: "One or more attachment documents do not belong to this wedding workspace",
          code: "INVALID_ATTACHMENT",
        };
      }
    }

    try {
      const wId = new Types.ObjectId(weddingId);
      const tId = new Types.ObjectId(taskId);
      const uId = new Types.ObjectId(userId);

      const attachmentObjectIds = (payload.attachmentIds || []).map((id) => new Types.ObjectId(id));

      const comment = await TaskCommentRepository.create({
        weddingId: wId,
        taskId: tId,
        authorId: uId,
        body: payload.body,
        attachmentIds: attachmentObjectIds,
      });

      const authorUser = await User.findById(userId);

      // Trigger notification for task assignee if different from comment author
      if (task.assignedTo && task.assignedTo.toString() !== userId) {
        await NotificationService.createNotification({
          weddingId,
          userId: task.assignedTo.toString(),
          type: "TASK_COMMENT",
          title: "New Comment on Task",
          message: `${authorUser?.name || "Someone"} commented on "${task.title}"`,
          entityType: "TASK",
          entityId: task._id,
        });
      }

      return {
        success: true,
        data: toTaskCommentDTO(comment, {
          authorName: authorUser?.name || "Team Member",
          authorEmail: authorUser?.email,
        }),
      };
    } catch (err: unknown) {
      console.error("Error creating comment:", err);
      return { success: false, error: "Failed to create comment", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Deletes a comment.
   */
  static async deleteComment(
    weddingId: string,
    taskId: string,
    commentId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    try {
      const targetComment = await TaskCommentRepository.findByIdAndWeddingId({
        weddingId,
        taskId,
        commentId,
      });

      if (!targetComment) {
        return { success: false, error: "Comment not found", code: "NOT_FOUND" };
      }

      // Check permission: Admin/Manager or author
      if (
        member.role !== "ADMIN" &&
        member.role !== "MANAGER" &&
        targetComment.authorId.toString() !== userId
      ) {
        return { success: false, error: "Only admins, managers, or author can delete this comment", code: "FORBIDDEN" };
      }

      await TaskCommentRepository.deleteByIdAndWeddingId({ weddingId, taskId, commentId });
      return { success: true };
    } catch (err: unknown) {
      console.error("Error deleting comment:", err);
      return { success: false, error: "Failed to delete comment", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Gets workspace task summary metrics.
   */
  static async getTaskMetrics(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: TaskSummaryDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    try {
      const counts = await TaskRepository.countTaskMetrics(weddingId);
      const completionPercentage = counts.totalTasks > 0
        ? Math.round((counts.completedTasks / counts.totalTasks) * 100)
        : 0;

      return {
        success: true,
        data: {
          ...counts,
          completionPercentage,
        },
      };
    } catch (err: unknown) {
      console.error("Error fetching task metrics:", err);
      return { success: false, error: "Failed to fetch task metrics", code: "INTERNAL_ERROR" };
    }
  }
}
