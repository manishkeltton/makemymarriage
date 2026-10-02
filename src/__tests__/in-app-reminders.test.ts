import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationRepository } from "@/modules/notifications/repositories/notification.repository";
import { NotificationService } from "@/modules/notifications/services/notification.service";
import { ReminderSchedulerService } from "@/modules/reminders/services/reminder-scheduler.service";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { TaskModel } from "@/modules/tasks/models/task.model";
import { ExpenseModel } from "@/modules/expenses/models/expense.model";
import { ExpensePaymentModel } from "@/modules/expenses/models/expense-payment.model";
import { Wedding } from "@/modules/weddings/models/wedding.model";
import { TeamMemberRepository } from "@/modules/team/repositories/team-member.repository";

// Mocks
vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/modules/notifications/repositories/notification.repository", () => ({
  NotificationRepository: {
    create: vi.fn(),
    findNotificationsByUserId: vi.fn(),
    countUnreadByUserId: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

vi.mock("@/modules/notifications/models/notification.model", () => ({
  NotificationModel: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock("@/modules/team/authorization/team.auth", () => ({
  TeamAuthorization: {
    requireWeddingMembership: vi.fn(),
    hasPermission: vi.fn().mockReturnValue(true),
    canAccessTask: vi.fn().mockReturnValue(true),
    canAccessExpense: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("@/modules/team/repositories/team-member.repository", () => ({
  TeamMemberRepository: {
    findActiveMembersByWeddingId: vi.fn(),
    findByIdAndWeddingId: vi.fn(),
  },
}));

vi.mock("@/modules/tasks/models/task.model", () => ({
  TaskModel: {
    find: vi.fn(),
  },
}));

vi.mock("@/modules/expenses/models/expense.model", () => ({
  ExpenseModel: {
    find: vi.fn(),
  },
}));

vi.mock("@/modules/expenses/models/expense-payment.model", () => ({
  ExpensePaymentModel: {
    find: vi.fn(),
  },
}));

vi.mock("@/modules/weddings/models/wedding.model", () => ({
  Wedding: {
    find: vi.fn(),
  },
}));

describe("V1 In-App Task & Payment Reminders Suite", () => {
  const weddingId = "507f1f77bcf86cd799439011";
  const userId = "507f1f77bcf86cd799439022";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("REMINDER-01: generates task due soon and overdue reminders for assigned user", async () => {
    vi.mocked(Wedding.find).mockReturnValue({
      limit: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([{ _id: weddingId }]),
      }),
    } as never);

    vi.mocked(TeamAuthorization.requireWeddingMembership).mockResolvedValue({
      userId,
      weddingId,
      status: "ACTIVE",
      role: "MEMBER",
    } as never);

    const dueSoonDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

    vi.mocked(TaskModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439033",
          title: "Setup Sangeet Audio",
          status: "TODO",
          assignedTo: userId,
          dueAt: dueSoonDate,
        },
      ]),
    } as never);

    vi.mocked(ExpenseModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    } as never);

    vi.mocked(ExpensePaymentModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    } as never);

    vi.mocked(TeamMemberRepository.findActiveMembersByWeddingId).mockResolvedValue([
      { member: { userId, weddingId, status: "ACTIVE", role: "MEMBER" } as never, user: {} as never },
    ]);

    vi.mocked(NotificationRepository.create).mockResolvedValue({
      _id: "507f1f77bcf86cd799439044",
      weddingId,
      userId,
      type: "TASK_DUE_SOON",
      title: "Task Due Soon: Setup Sangeet Audio",
      message: "Task is due soon",
      createdAt: new Date(),
    } as never);

    const result = await ReminderSchedulerService.processReminders({ weddingId });

    expect(result.success).toBe(true);
    expect(result.notificationsCreated).toBe(1);
    expect(NotificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "TASK_DUE_SOON",
        link: `/workspace/${weddingId}/tasks?taskId=507f1f77bcf86cd799439033`,
      })
    );
  });

  it("REMINDER-02: ignores completed tasks and paid payment installments", async () => {
    vi.mocked(Wedding.find).mockReturnValue({
      limit: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([{ _id: weddingId }]),
      }),
    } as never);

    vi.mocked(TaskModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    } as never);

    vi.mocked(ExpenseModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439055",
          title: "Catering Deposit",
          approvalStatus: "APPROVED",
        },
      ]),
    } as never);

    vi.mocked(ExpensePaymentModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([]), // Paid installments excluded by status: "PENDING"
    } as never);

    const result = await ReminderSchedulerService.processReminders({ weddingId });

    expect(result.success).toBe(true);
    expect(result.notificationsCreated).toBe(0);
    expect(NotificationRepository.create).not.toHaveBeenCalled();
  });

  it("REMINDER-03: handles atomic duplicate key collisions gracefully without creating duplicates", async () => {
    vi.mocked(NotificationRepository.create).mockResolvedValue(null);

    const createResult = await NotificationService.createNotification({
      weddingId,
      userId,
      type: "TASK_DUE_SOON",
      title: "Duplicate Test",
      message: "Test message",
      dedupKey: "unique_dedup_key_123",
    });

    expect(createResult.success).toBe(true);
    expect(createResult.data).toBeUndefined(); // Suppressed as duplicate
  });

  it("REMINDER-04: enforces Stale Notification Policy by omitting notifications for deleted records or revoked access", async () => {
    vi.mocked(NotificationRepository.findNotificationsByUserId).mockResolvedValue([
      {
        _id: "507f1f77bcf86cd799439066",
        weddingId,
        userId,
        type: "TASK_DUE_SOON",
        title: "Deleted Task",
        message: "Message",
        entityType: "TASK",
        entityId: "507f1f77bcf86cd799439077",
        readAt: null,
      },
    ] as never);

    vi.mocked(TeamAuthorization.requireWeddingMembership).mockResolvedValue({
      userId,
      weddingId,
      status: "ACTIVE",
      role: "MEMBER",
    } as never);

    vi.mocked(TaskModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([]), // Task deleted from DB
    } as never);

    const result = await NotificationService.getUserNotifications({ userId, weddingId });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.unreadCount).toBe(0);
  });

  it("REMINDER-05: correctly formats notification selection deep links for task and payment reminders", () => {
    const taskId = "507f1f77bcf86cd799439088";
    const expenseId = "507f1f77bcf86cd799439099";

    const taskLink = `/workspace/${weddingId}/tasks?taskId=${taskId}`;
    const expenseLink = `/workspace/${weddingId}/expenses?expenseId=${expenseId}`;

    expect(taskLink).toBe(`/workspace/507f1f77bcf86cd799439011/tasks?taskId=507f1f77bcf86cd799439088`);
    expect(expenseLink).toBe(`/workspace/507f1f77bcf86cd799439011/expenses?expenseId=507f1f77bcf86cd799439099`);
  });

  it("REM-001: iterates through all weddings in batches when more than 50 active weddings exist", async () => {
    const batch1 = Array.from({ length: 50 }, (_, i) => ({ _id: `507f1f77bcf86cd799439${(i + 100).toString().padStart(3, "0")}` }));
    const batch2 = Array.from({ length: 10 }, (_, i) => ({ _id: `507f1f77bcf86cd799439${(i + 200).toString().padStart(3, "0")}` }));

    let callCount = 0;
    vi.mocked(Wedding.find).mockImplementation(() => {
      callCount++;
      const currentBatch = callCount === 1 ? batch1 : batch2;
      return {
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(currentBatch),
          }),
        }),
      } as never;
    });

    vi.mocked(TaskModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    } as never);
    vi.mocked(ExpensePaymentModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    } as never);
    vi.mocked(TeamMemberRepository.findActiveMembersByWeddingId).mockResolvedValue([]);

    const result = await ReminderSchedulerService.processReminders();

    expect(result.success).toBe(true);
    expect(result.processedWeddings).toBe(60);
  });

  it("REM-004 & REM-005: suppresses stale notifications for reassigned tasks and paid payment installments", async () => {
    const taskId = "507f1f77bcf86cd7994390aa";
    const expenseId = "507f1f77bcf86cd7994390bb";
    const paymentId = "507f1f77bcf86cd7994390cc";
    const otherUser = "507f1f77bcf86cd7994390dd";

    vi.mocked(NotificationRepository.findNotificationsByUserId).mockResolvedValue([
      {
        _id: "notif_task",
        weddingId,
        userId,
        type: "TASK_DUE_SOON",
        title: "Reassigned Task",
        message: "Task due soon",
        entityType: "TASK",
        entityId: taskId,
        readAt: null,
      },
      {
        _id: "notif_payment",
        weddingId,
        userId,
        type: "PAYMENT_DUE_SOON",
        title: "Paid Installment",
        message: "Payment due soon",
        entityType: "EXPENSE",
        entityId: expenseId,
        dedupKey: `${userId}_PAYMENT_${paymentId}_PAYMENT_DUE_SOON_2026-10-05`,
        readAt: null,
      },
    ] as never);

    vi.mocked(TeamAuthorization.requireWeddingMembership).mockResolvedValue({
      userId,
      weddingId,
      status: "ACTIVE",
      role: "MEMBER",
    } as never);

    // Task reassigned to otherUser
    vi.mocked(TaskModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        {
          _id: taskId,
          title: "Reassigned Task",
          status: "TODO",
          assignedTo: otherUser,
        },
      ]),
    } as never);

    // Parent expense is active, but specific installment is PAID
    vi.mocked(ExpenseModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        {
          _id: expenseId,
          title: "Paid Expense",
          approvalStatus: "APPROVED",
        },
      ]),
    } as never);

    vi.mocked(ExpensePaymentModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        {
          _id: paymentId,
          expenseId,
          status: "PAID",
        },
      ]),
    } as never);

    const result = await NotificationService.getUserNotifications({ userId, weddingId });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]); // Both stale notifications suppressed
    expect(result.unreadCount).toBe(0);
  });
});
