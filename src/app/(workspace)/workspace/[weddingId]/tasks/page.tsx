"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { TaskDTO, TaskSummaryDTO } from "@/modules/tasks/dto/task.dto";
import { EventDTO } from "@/modules/events/dto/event.dto";
import { TeamMemberDTO } from "@/modules/team/dto/team.dto";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { ChecklistModal } from "@/components/tasks/ChecklistModal";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";

export default function WorkspaceTasksPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = use(params);

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberDTO[]>([]);
  const [metrics, setMetrics] = useState<TaskSummaryDTO | null>(null);

  const [activeTab, setActiveTab] = useState<
    "ALL" | "MY_TASKS" | "BY_EVENT" | "OVERDUE" | "UPCOMING" | "COMPLETED"
  >("ALL");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState<TaskDTO | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [completedAccordionOpen, setCompletedAccordionOpen] = useState(false);

  const computeMetrics = (taskList: TaskDTO[]) => {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const totalTasks = taskList.length;
    const completedTasks = taskList.filter((t) => t.status === "COMPLETED").length;
    const inProgressTasks = taskList.filter((t) => t.status === "IN_PROGRESS").length;
    const todoTasks = taskList.filter((t) => t.status === "TODO").length;

    const overdueTasks = taskList.filter(
      (t) => t.status !== "COMPLETED" && t.dueAt && new Date(t.dueAt) < now
    ).length;

    const upcomingTasks = taskList.filter(
      (t) =>
        t.status !== "COMPLETED" &&
        t.dueAt &&
        new Date(t.dueAt) >= now &&
        new Date(t.dueAt) <= next7Days
    ).length;

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    setMetrics({
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      upcomingTasks,
      completionPercentage,
    });
  };

  const fetchWorkspaceData = useCallback(async () => {
    try {
      const [tasksRes, eventsRes, membersRes] = await Promise.all([
        fetch(`/api/v1/weddings/${weddingId}/tasks?limit=200`),
        fetch(`/api/v1/weddings/${weddingId}/events`),
        fetch(`/api/v1/weddings/${weddingId}/members`),
      ]);

      const [tasksData, eventsData, membersData] = await Promise.all([
        tasksRes.json(),
        eventsRes.json(),
        membersRes.json(),
      ]);

      if (tasksData.success) {
        setTasks(tasksData.data || []);
      }
      if (eventsData.success) {
        setEvents(eventsData.data || []);
      }
      if (membersData.success) {
        setTeamMembers(membersData.data || []);
      }
      computeMetrics(tasksData.data || []);
    } catch (err: unknown) {
      console.error("Error fetching tasks workspace data:", err);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchWorkspaceData();
      }
    };
    void load();

    return () => {
      isMounted = false;
    };
  }, [fetchWorkspaceData]);

  const handleToggleTaskStatus = async (task: TaskDTO) => {
    const nextStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? data.data : t))
        );
        computeMetrics(tasks.map((t) => (t.id === task.id ? data.data : t)));
      }
    } catch (err: unknown) {
      console.error("Error toggling task status:", err);
    }
  };

  const handleTaskCreated = (newTask: TaskDTO) => {
    const updated = [newTask, ...tasks];
    setTasks(updated);
    computeMetrics(updated);
  };

  const handleChecklistGenerated = () => {
    fetchWorkspaceData();
  };

  const handleTaskUpdated = (updatedTask: TaskDTO) => {
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    computeMetrics(updated);
    setSelectedTaskForDrawer(updatedTask);
  };

  const handleTaskDeleted = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    computeMetrics(updated);
  };

  // Filter & Search Logic
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filteredTasks = tasks.filter((task) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = task.title.toLowerCase().includes(q);
      const descMatch = task.description?.toLowerCase().includes(q);
      const assigneeMatch = task.assigneeName?.toLowerCase().includes(q);
      const eventMatch = task.eventName?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch && !assigneeMatch && !eventMatch) return false;
    }

    // Dropdown Filters
    if (selectedEventId && task.eventId !== selectedEventId) return false;
    if (selectedAssigneeId && task.assignedTo !== selectedAssigneeId) return false;
    if (selectedPriority && task.priority !== selectedPriority) return false;
    if (selectedStatus && task.status !== selectedStatus) return false;

    // View Tabs
    if (activeTab === "MY_TASKS") {
      // In guest/client demo, show assigned tasks or non-unassigned
      if (!task.assignedTo) return false;
    } else if (activeTab === "OVERDUE") {
      if (task.status === "COMPLETED" || !task.dueAt || new Date(task.dueAt) >= now) return false;
    } else if (activeTab === "UPCOMING") {
      if (
        task.status === "COMPLETED" ||
        !task.dueAt ||
        new Date(task.dueAt) < now ||
        new Date(task.dueAt) > next7Days
      )
        return false;
    } else if (activeTab === "COMPLETED") {
      if (task.status !== "COMPLETED") return false;
    }

    return true;
  });

  // Grouping for Display
  const overdueGroup = filteredTasks.filter(
    (t) => t.status !== "COMPLETED" && t.dueAt && new Date(t.dueAt) < now
  );
  const upcomingGroup = filteredTasks.filter(
    (t) =>
      t.status !== "COMPLETED" &&
      (!t.dueAt || (new Date(t.dueAt) >= now))
  );
  const completedGroup = filteredTasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6 text-on-surface antialiased font-body-md">
      {/* Workspace Header & Action Suite */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary-container px-2.5 py-0.5 rounded-full bg-primary-fixed font-bold">
              Milestone 2 Active
            </span>
            <span className="font-body-sm text-xs text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
              Hindu Vedic Rituals Synced
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl tracking-tight font-bold text-on-surface">
            Tasks
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant">
            Planning Engine • {metrics?.totalTasks || 0} Total Tasks • {metrics?.completedTasks || 0} Completed ({metrics?.completionPercentage || 0}%)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsChecklistModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-tertiary font-body-sm text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[19px] text-tertiary-container">bolt</span>
            <span>Generate Hindu Wedding Checklist</span>
          </button>
          <button
            onClick={() => setIsFormModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-body-sm text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[19px]">add</span>
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Metric Overview Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs flex flex-col justify-between border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Total Scope
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">checklist</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-headline-lg text-2xl font-bold text-on-surface">{metrics?.totalTasks || 0}</span>
            <span className="font-body-sm text-xs text-on-surface-variant">Allocated Tasks</span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary-container h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs flex flex-col justify-between border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              In Progress
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">pending_actions</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-headline-lg text-2xl font-bold text-on-surface">{metrics?.inProgressTasks || 0}</span>
            <span className="font-body-sm text-xs text-on-surface-variant">Active execution</span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full"
              style={{
                width: `${metrics?.totalTasks ? Math.round((metrics.inProgressTasks / metrics.totalTasks) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-error-container/30 p-4 rounded-2xl shadow-xs flex flex-col justify-between border border-error/20">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-error uppercase tracking-wider font-bold">
              Overdue Escalations
            </span>
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-headline-lg text-2xl font-bold text-error">{metrics?.overdueTasks || 0}</span>
            <span className="font-body-sm text-xs text-error/80">Needs intervention</span>
          </div>
          <div className="w-full bg-error-container h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-error h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs flex flex-col justify-between border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-secondary uppercase tracking-wider font-bold">
              Ceremonies Ready
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">task_alt</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-headline-lg text-2xl font-bold text-secondary">{metrics?.completedTasks || 0}</span>
            <span className="font-body-sm text-xs text-on-surface-variant">
              {metrics?.completionPercentage || 0}% resolved
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full"
              style={{ width: `${metrics?.completionPercentage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Segmented View Navigation Tabs */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 gap-4">
        <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg font-body-sm text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-surface-container-lowest text-on-surface shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>All Tasks</span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px]">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("MY_TASKS")}
            className={`px-3.5 py-1.5 rounded-lg font-body-sm text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "MY_TASKS"
                ? "bg-surface-container-lowest text-on-surface shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>My Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab("BY_EVENT")}
            className={`px-3.5 py-1.5 rounded-lg font-body-sm text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "BY_EVENT"
                ? "bg-surface-container-lowest text-on-surface shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>By Event</span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px]">
              {events.length} Events
            </span>
          </button>

          <button
            onClick={() => setActiveTab("OVERDUE")}
            className={`px-3.5 py-1.5 rounded-lg font-body-sm text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "OVERDUE"
                ? "bg-surface-container-lowest text-error shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>Overdue</span>
            <span className="px-1.5 py-0.5 rounded-full bg-error-container text-error font-label-sm text-[11px] font-bold">
              {metrics?.overdueTasks || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("UPCOMING")}
            className={`px-3.5 py-1.5 rounded-lg font-body-sm text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "UPCOMING"
                ? "bg-surface-container-lowest text-on-surface shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>Upcoming</span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px]">
              {metrics?.upcomingTasks || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-3.5 py-1.5 rounded-lg font-body-sm text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "COMPLETED"
                ? "bg-surface-container-lowest text-secondary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>Completed</span>
            <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold">
              {metrics?.completedTasks || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Search & Multi-tier Filter Suite */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-surface-container-high/60 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, assignee, ceremony or details..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface-container-low font-body-sm text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest shadow-xs transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Ceremony Filter */}
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-10 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-medium border-0 focus:ring-1 focus:ring-primary-container"
            >
              <option value="">Ceremony: All</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={selectedAssigneeId}
              onChange={(e) => setSelectedAssigneeId(e.target.value)}
              className="h-10 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-medium border-0 focus:ring-1 focus:ring-primary-container"
            >
              <option value="">Assignee: All</option>
              {teamMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.userName}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-10 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-medium border-0 focus:ring-1 focus:ring-primary-container"
            >
              <option value="">Priority: All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-medium border-0 focus:ring-1 focus:ring-primary-container"
            >
              <option value="">Status: All</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Structured Task Workspaces / Lists */}
      {loading ? (
        <div className="p-12 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-2">
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p>Loading tasks planning engine...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 bg-surface-container-lowest rounded-2xl border border-surface-container-high text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container mx-auto">
            <span className="material-symbols-outlined text-[24px]">task</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-on-surface">No tasks found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Get started by creating a custom task or generate the predefined Hindu Wedding Checklist.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setIsChecklistModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-tertiary hover:bg-[#3D1800] text-on-tertiary text-xs font-semibold shadow-xs transition-colors"
            >
              Generate Hindu Checklist
            </button>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold shadow-xs transition-colors"
            >
              Add Task
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ================= GROUP 1: OVERDUE ================= */}
          {overdueGroup.length > 0 && activeTab !== "COMPLETED" && (
            <div className="bg-surface-container-lowest rounded-2xl border border-error/30 shadow-xs overflow-hidden">
              <div className="bg-error-container/30 p-4 flex items-center justify-between border-b border-error/20">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-error text-[20px]">error</span>
                  <h2 className="font-headline-sm text-sm text-error font-bold">
                    Overdue ({overdueGroup.length} Critical Tasks)
                  </h2>
                  <span className="font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-error text-on-error font-semibold uppercase tracking-wider">
                    Requires Immediate Action
                  </span>
                </div>
              </div>

              <div className="divide-y divide-surface-container-high/40">
                {overdueGroup.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleTaskStatus(task)}
                    onOpenDetail={() => {
                      setSelectedTaskForDrawer(task);
                      setIsDrawerOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ================= GROUP 2: UPCOMING & IN PROGRESS ================= */}
          {upcomingGroup.length > 0 && activeTab !== "COMPLETED" && (
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-xs overflow-hidden">
              <div className="bg-surface-container-low p-4 flex items-center justify-between border-b border-surface-container-high/60">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    calendar_today
                  </span>
                  <h2 className="font-headline-sm text-sm text-on-surface font-bold">
                    Upcoming &amp; Active Execution ({upcomingGroup.length} Tasks)
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-surface-container-high/40">
                {upcomingGroup.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleTaskStatus(task)}
                    onOpenDetail={() => {
                      setSelectedTaskForDrawer(task);
                      setIsDrawerOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ================= GROUP 3: COMPLETED ================= */}
          {completedGroup.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-xs overflow-hidden">
              <button
                onClick={() => setCompletedAccordionOpen(!completedAccordionOpen)}
                className="w-full bg-surface-container-low hover:bg-surface-container p-4 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                  <h2 className="font-headline-sm text-sm text-on-surface font-bold">
                    Completed Tasks ({completedGroup.length})
                  </h2>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  {completedAccordionOpen || activeTab === "COMPLETED" ? "expand_less" : "expand_more"}
                </span>
              </button>

              {(completedAccordionOpen || activeTab === "COMPLETED") && (
                <div className="divide-y divide-surface-container-high/40">
                  {completedGroup.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggleTaskStatus(task)}
                      onOpenDetail={() => {
                        setSelectedTaskForDrawer(task);
                        setIsDrawerOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        weddingId={weddingId}
        events={events}
        teamMembers={teamMembers}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleTaskCreated}
      />

      {/* Hindu Checklist Modal */}
      <ChecklistModal
        weddingId={weddingId}
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        onSuccess={handleChecklistGenerated}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        weddingId={weddingId}
        task={selectedTaskForDrawer}
        events={events}
        teamMembers={teamMembers}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onOpenDetail,
}: {
  task: TaskDTO;
  onToggle: () => void;
  onOpenDetail: () => void;
}) {
  const isCompleted = task.status === "COMPLETED";
  const now = new Date();
  const isOverdue = !isCompleted && task.dueAt && new Date(task.dueAt) < now;

  return (
    <div className="p-4 hover:bg-surface-container-low/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
      <div className="flex items-start md:items-center gap-3 min-w-0">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={onToggle}
          className="mt-1 md:mt-0 w-4 h-4 rounded text-primary-container bg-surface-container-lowest cursor-pointer shrink-0"
        />
        <div className="space-y-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span
              onClick={onOpenDetail}
              className={`font-semibold text-sm hover:text-primary cursor-pointer truncate ${
                isCompleted ? "line-through text-on-surface-variant" : "text-on-surface"
              }`}
            >
              {task.title}
            </span>

            {task.eventName && (
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary-container font-semibold text-[10px]">
                {task.eventName}
              </span>
            )}

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                task.priority === "HIGH"
                  ? "bg-error/10 text-error"
                  : task.priority === "MEDIUM"
                  ? "bg-surface-container-high text-on-surface-variant"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {task.priority} Priority
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-4 text-on-surface-variant text-xs">
            {task.dueAt && (
              <span className={`flex items-center gap-1 font-medium ${isOverdue ? "text-error font-bold" : ""}`}>
                <span className="material-symbols-outlined text-[14px]">
                  {isOverdue ? "event_busy" : "event"}
                </span>
                <span>
                  Due {new Date(task.dueAt).toLocaleDateString()}
                  {isOverdue ? " (Overdue)" : ""}
                </span>
              </span>
            )}

            {Boolean(task.documentCount) && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">attach_file</span>
                <span>{task.documentCount} docs</span>
              </span>
            )}

            {Boolean(task.commentCount) && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">chat_bubble_outline</span>
                <span>{task.commentCount} comments</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pl-7 md:pl-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary-container font-bold text-[10px] flex items-center justify-center">
            {task.assigneeName ? task.assigneeName.slice(0, 2).toUpperCase() : "TM"}
          </div>
          <span className="font-semibold text-on-surface">
            {task.assigneeName || "Unassigned"}
          </span>
        </div>
        <button
          onClick={onOpenDetail}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          title="Open Task Details"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
