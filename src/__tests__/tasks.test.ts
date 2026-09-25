import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { TaskService, HINDU_WEDDING_CHECKLIST_TEMPLATES } from "../modules/tasks/services/task.service";
import { TaskRepository } from "../modules/tasks/repositories/task.repository";
import { TaskCommentRepository } from "../modules/tasks/repositories/task-comment.repository";
import { DocumentRepository } from "../modules/documents/repositories/document.repository";
import { DocumentService } from "../modules/documents/services/document.service";
import { NotificationService } from "../modules/notifications/services/notification.service";
import { NotificationRepository } from "../modules/notifications/repositories/notification.repository";
import { EventRepository } from "../modules/events/repositories/event.repository";
import { TeamMemberRepository } from "../modules/team/repositories/team-member.repository";
import { createTaskSchema } from "../modules/tasks/validation/task.schemas";
import { connectToDatabase } from "../lib/db/connect";
import { IWeddingMember } from "../modules/weddings/models/wedding-member.model";
import { ITask } from "../modules/tasks/models/task.model";
import { IDocument } from "../modules/documents/models/document.model";
import { INotification } from "../modules/notifications/models/notification.model";

vi.mock("../lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("../lib/db/models/User", () => ({
  User: {
    findById: vi.fn(),
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(),
    exists: vi.fn().mockResolvedValue(false),
  },
}));

vi.mock("../modules/events/repositories/event.repository", () => ({
  EventRepository: {
    findByIdAndWeddingId: vi.fn(),
    findEventsByWeddingId: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../modules/team/repositories/team-member.repository", () => ({
  TeamMemberRepository: {
    findByUserIdAndWeddingId: vi.fn(),
  },
}));

describe("Planning Engine — Task, Checklist, Document & Notification Tests", () => {
  const fakeAdminUserId = new Types.ObjectId().toString();
  const fakeMemberUserId = new Types.ObjectId().toString();
  const fakeWeddingId = new Types.ObjectId().toString();
  const fakeEventId = new Types.ObjectId().toString();
  const fakeTaskId = new Types.ObjectId().toString();
  const fakeDepTaskId = new Types.ObjectId().toString();

  const fakeAdminMemberDoc = {
    _id: new Types.ObjectId(),
    weddingId: new Types.ObjectId(fakeWeddingId),
    userId: new Types.ObjectId(fakeAdminUserId),
    role: "ADMIN",
    status: "ACTIVE",
    permissions: { guests: true, vendors: true, finance: true, gallery: true, website: true, guestbook: true, emergency: true },
    eventScope: { allEvents: true, eventIds: [] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Zod Validation Schemas", () => {
    it("should validate valid create task payload", () => {
      const validPayload = {
        title: "Confirm Panditji for Vivah Muhurat",
        description: "Arrange Pooja Samagri and Jaimala",
        priority: "HIGH",
        status: "TODO",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
      };
      const result = createTaskSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject empty task title", () => {
      const invalidPayload = { title: "   ", priority: "HIGH" };
      const result = createTaskSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("should reject invalid priority enum", () => {
      const invalidPayload = { title: "Test", priority: "SUPER_URGENT" };
      const result = createTaskSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("Task Creation & Same-Wedding Reference Validation", () => {
    it("should create a task successfully when all references belong to same wedding", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      (EventRepository.findByIdAndWeddingId as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: fakeEventId, name: "Pheras" });

      const mockTaskDoc = {
        _id: new Types.ObjectId(fakeTaskId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        eventId: new Types.ObjectId(fakeEventId),
        title: "Arrange Mandap Floral Drape",
        priority: "HIGH",
        status: "TODO",
        dependencyIds: [],
        createdBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(TaskRepository, "create").mockResolvedValue(mockTaskDoc as unknown as ITask);

      const result = await TaskService.createTask(fakeWeddingId, fakeAdminUserId, {
        title: "Arrange Mandap Floral Drape",
        eventId: fakeEventId,
        priority: "HIGH",
      });

      expect(connectToDatabase).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Arrange Mandap Floral Drape");
    });

    it("should reject task creation if referenced event belongs to another wedding", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      (EventRepository.findByIdAndWeddingId as ReturnType<typeof vi.fn>).mockResolvedValue(null); // Invalid event

      const result = await TaskService.createTask(fakeWeddingId, fakeAdminUserId, {
        title: "Test Task",
        eventId: new Types.ObjectId().toString(),
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_EVENT");
    });

    it("should reject task creation if assignee is not an active member of same wedding", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId")
        .mockResolvedValueOnce(fakeAdminMemberDoc as unknown as IWeddingMember) // Caller check
        .mockResolvedValueOnce(null); // Assignee check fails

      const result = await TaskService.createTask(fakeWeddingId, fakeAdminUserId, {
        title: "Test Task",
        assignedTo: fakeMemberUserId,
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_ASSIGNEE");
    });
  });

  describe("Dependency Integrity & Circular Dependency Checks", () => {
    it("should reject task update if task is set to depend on itself", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);

      const mockExistingTask = {
        _id: new Types.ObjectId(fakeTaskId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Setup Mandap",
        status: "TODO",
      };

      vi.spyOn(TaskRepository, "findByIdAndWeddingId").mockResolvedValue(mockExistingTask as unknown as ITask);

      const result = await TaskService.updateTask(fakeWeddingId, fakeTaskId, fakeAdminUserId, {
        dependencyIds: [fakeTaskId],
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("SELF_DEPENDENCY");
    });

    it("should detect and reject circular dependency loops", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);

      const mockTaskA = {
        _id: new Types.ObjectId(fakeTaskId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Task A",
        status: "TODO",
        dependencyIds: [],
      };

      const mockTaskB = {
        _id: new Types.ObjectId(fakeDepTaskId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Task B",
        status: "TODO",
        dependencyIds: [new Types.ObjectId(fakeTaskId)], // B already depends on A!
      };

      vi.spyOn(TaskRepository, "findByIdAndWeddingId").mockImplementation(async ({ taskId }) => {
        if (taskId === fakeTaskId) return mockTaskA as unknown as ITask;
        if (taskId === fakeDepTaskId) return mockTaskB as unknown as ITask;
        return null;
      });
      vi.spyOn(TaskRepository, "findTasksByIdsAndWeddingId").mockResolvedValue([mockTaskB as unknown as ITask]);

      // Attempting to make A depend on B -> Circular Loop!
      const result = await TaskService.updateTask(fakeWeddingId, fakeTaskId, fakeAdminUserId, {
        dependencyIds: [fakeDepTaskId],
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("CIRCULAR_DEPENDENCY");
    });

    it("should detect multi-hop circular dependency loops (A -> B -> C -> A)", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);

      const idA = fakeTaskId;
      const idB = new Types.ObjectId().toString();
      const idC = new Types.ObjectId().toString();

      const taskA = { _id: new Types.ObjectId(idA), weddingId: new Types.ObjectId(fakeWeddingId), title: "Task A", dependencyIds: [] };
      const taskB = { _id: new Types.ObjectId(idB), weddingId: new Types.ObjectId(fakeWeddingId), title: "Task B", dependencyIds: [new Types.ObjectId(idA)] }; // B -> A
      const taskC = { _id: new Types.ObjectId(idC), weddingId: new Types.ObjectId(fakeWeddingId), title: "Task C", dependencyIds: [new Types.ObjectId(idB)] }; // C -> B

      vi.spyOn(TaskRepository, "findByIdAndWeddingId").mockImplementation(async ({ taskId }) => {
        if (taskId === idA) return taskA as unknown as ITask;
        if (taskId === idB) return taskB as unknown as ITask;
        if (taskId === idC) return taskC as unknown as ITask;
        return null;
      });
      vi.spyOn(TaskRepository, "findTasksByIdsAndWeddingId").mockResolvedValue([taskC as unknown as ITask]);

      // Setting A to depend on C creates 3-hop loop: A -> C -> B -> A!
      const result = await TaskService.updateTask(fakeWeddingId, idA, fakeAdminUserId, {
        dependencyIds: [idC],
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("CIRCULAR_DEPENDENCY");
    });
  });

  describe("Predefined Hindu Wedding Checklist Generator", () => {
    it("should generate predefined ceremonial tasks cleanly", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      vi.spyOn(TaskRepository, "findTasksByFilters").mockResolvedValue({
        tasks: [],
        hasMore: false,
        totalCount: 0,
      });

      vi.spyOn(TaskRepository, "create").mockImplementation(async (params) => {
        return {
          _id: new Types.ObjectId(),
          weddingId: params.weddingId,
          title: params.title,
          description: params.description,
          priority: params.priority || "MEDIUM",
          status: "TODO",
          createdBy: params.createdBy,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as ITask;
      });

      const result = await TaskService.generateChecklist(fakeWeddingId, fakeAdminUserId, {
        duplicateHandling: "SKIP_EXISTING",
      });

      expect(result.success).toBe(true);
      expect(result.generatedCount).toBe(HINDU_WEDDING_CHECKLIST_TEMPLATES.length);
      expect(TaskRepository.create).toHaveBeenCalled();
    });

    it("should skip existing task titles when duplicateHandling is SKIP_EXISTING", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);

      const existingTitle = HINDU_WEDDING_CHECKLIST_TEMPLATES[0].title;
      vi.spyOn(TaskRepository, "findTasksByFilters").mockResolvedValue({
        tasks: [{ _id: new Types.ObjectId(), title: existingTitle }] as unknown as ITask[],
        hasMore: false,
        totalCount: 1,
      });

      vi.spyOn(TaskRepository, "create").mockImplementation(async (params) => {
        return {
          _id: new Types.ObjectId(),
          weddingId: params.weddingId,
          title: params.title,
          priority: params.priority || "MEDIUM",
          status: "TODO",
          createdBy: params.createdBy,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as ITask;
      });

      const result = await TaskService.generateChecklist(fakeWeddingId, fakeAdminUserId, {
        duplicateHandling: "SKIP_EXISTING",
      });

      expect(result.success).toBe(true);
      expect(result.generatedCount).toBe(HINDU_WEDDING_CHECKLIST_TEMPLATES.length - 1);
    });

    it("should update in-place when duplicateHandling is REPLACE_EXISTING (PLAN-P1-02)", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);

      const existingTaskId = new Types.ObjectId();
      const existingTitle = HINDU_WEDDING_CHECKLIST_TEMPLATES[0].title;

      vi.spyOn(TaskRepository, "findTasksByFilters").mockResolvedValue({
        tasks: [{ _id: existingTaskId, title: existingTitle }] as unknown as ITask[],
        hasMore: false,
        totalCount: 1,
      });

      const updatedTaskDoc = {
        _id: existingTaskId,
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: existingTitle,
        description: "Updated Checklist Task",
        priority: "HIGH",
        status: "TODO",
        createdBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(TaskRepository, "updateByIdAndWeddingId").mockResolvedValue(updatedTaskDoc as unknown as ITask);

      const result = await TaskService.generateChecklist(fakeWeddingId, fakeAdminUserId, {
        duplicateHandling: "REPLACE_EXISTING",
      });

      expect(result.success).toBe(true);
      expect(TaskRepository.updateByIdAndWeddingId).toHaveBeenCalledWith(
        expect.objectContaining({
          weddingId: fakeWeddingId,
          taskId: existingTaskId.toString(),
        })
      );
    });
  });

  describe("Task Comments & Security (PLAN-P0-01)", () => {
    it("should create comment and notify assigned user", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);

      const mockTask = {
        _id: new Types.ObjectId(fakeTaskId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Shortlist Photographer",
        assignedTo: new Types.ObjectId(fakeMemberUserId),
      };

      const mockCommentDoc = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        taskId: new Types.ObjectId(fakeTaskId),
        authorId: new Types.ObjectId(fakeAdminUserId),
        body: "Please check portfolio links.",
        attachmentIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(TaskRepository, "findByIdAndWeddingId").mockResolvedValue(mockTask as unknown as ITask);
      vi.spyOn(TaskCommentRepository, "create").mockResolvedValue(mockCommentDoc as unknown as ReturnType<typeof TaskCommentRepository.create> extends Promise<infer T> ? T : never);
      vi.spyOn(NotificationService, "createNotification").mockResolvedValue({ success: true });

      const result = await TaskService.createComment(fakeWeddingId, fakeTaskId, fakeAdminUserId, {
        body: "Please check portfolio links.",
      });

      expect(result.success).toBe(true);
      expect(NotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          weddingId: fakeWeddingId,
          userId: fakeMemberUserId,
          type: "TASK_COMMENT",
        })
      );
    });

    it("should reject comment creation if attachment ID belongs to another wedding (PLAN-P0-01)", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);

      const mockTask = {
        _id: new Types.ObjectId(fakeTaskId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Task with attachment",
      };

      const foreignDocId = new Types.ObjectId().toString();

      vi.spyOn(TaskRepository, "findByIdAndWeddingId").mockResolvedValue(mockTask as unknown as ITask);
      vi.spyOn(DocumentRepository, "findDocumentsByIdsAndWeddingId").mockResolvedValue([]); // Foreign doc not found in this wedding!

      const result = await TaskService.createComment(fakeWeddingId, fakeTaskId, fakeAdminUserId, {
        body: "Check this document",
        attachmentIds: [foreignDocId],
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_ATTACHMENT");
    });
  });

  describe("Task Authorization & Role Restrictions (PLAN-P1-03)", () => {
    it("should deny task deletion for non-admin/non-manager members who did not create the task", async () => {
      const nonAdminMember = {
        ...fakeAdminMemberDoc,
        role: "ORGANISER",
      };

      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(nonAdminMember as unknown as IWeddingMember);

      const existingTask = {
        _id: new Types.ObjectId(fakeTaskId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        createdBy: new Types.ObjectId(), // Different creator
      };

      vi.spyOn(TaskRepository, "findByIdAndWeddingId").mockResolvedValue(existingTask as unknown as ITask);

      const result = await TaskService.deleteTask(fakeWeddingId, fakeTaskId, fakeAdminUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe("FORBIDDEN");
    });

    it("should reject access if user status is REMOVED", async () => {
      const removedMember = {
        ...fakeAdminMemberDoc,
        status: "REMOVED",
      };

      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(removedMember as unknown as IWeddingMember);

      const result = await TaskService.getTasks(fakeWeddingId, fakeAdminUserId, {});

      expect(result.success).toBe(false);
      expect(result.code).toBe("FORBIDDEN");
    });
  });

  describe("Document Vault & Tenant Authorization", () => {
    it("should create document record with valid same-wedding reference", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);

      const mockDoc = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        type: "CONTRACT",
        title: "Caterer Agreement 2027",
        uploadedBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(DocumentRepository, "create").mockResolvedValue(mockDoc as unknown as IDocument);

      const result = await DocumentService.createDocument({
        weddingId: fakeWeddingId,
        userId: fakeAdminUserId,
        payload: {
          title: "Caterer Agreement 2027",
          type: "CONTRACT",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Caterer Agreement 2027");
    });
  });

  describe("In-App Notifications Service", () => {
    it("should fetch user notifications and mark them read", async () => {
      const mockNotificationDoc = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        userId: new Types.ObjectId(fakeAdminUserId),
        type: "TASK_ASSIGNED",
        title: "Task Assigned",
        message: "You have been assigned a task",
        readAt: null,
        createdAt: new Date(),
      };

      vi.spyOn(NotificationRepository, "findNotificationsByUserId").mockResolvedValue([
        mockNotificationDoc as unknown as INotification,
      ]);
      vi.spyOn(NotificationRepository, "countUnreadByUserId").mockResolvedValue(1);
      vi.spyOn(NotificationRepository, "markAsRead").mockResolvedValue({
        ...mockNotificationDoc,
        readAt: new Date(),
      } as unknown as INotification);

      const fetchResult = await NotificationService.getUserNotifications({
        userId: fakeAdminUserId,
        weddingId: fakeWeddingId,
      });

      expect(fetchResult.success).toBe(true);
      expect(fetchResult.unreadCount).toBe(1);

      const markResult = await NotificationService.markRead({
        userId: fakeAdminUserId,
        notificationId: mockNotificationDoc._id.toString(),
      });

      expect(markResult.success).toBe(true);
      expect(markResult.data?.readAt).toBeDefined();
    });
  });
});

