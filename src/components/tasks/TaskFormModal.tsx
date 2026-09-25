"use client";

import React, { useState } from "react";
import { TaskDTO } from "@/modules/tasks/dto/task.dto";

interface TaskFormModalProps {
  weddingId: string;
  taskToEdit?: TaskDTO | null;
  events?: Array<{ id: string; name: string }>;
  teamMembers?: Array<{ userId: string; userName: string }>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: TaskDTO) => void;
}

export function TaskFormModal({
  weddingId,
  taskToEdit,
  events = [],
  teamMembers = [],
  isOpen,
  onClose,
  onSuccess,
}: TaskFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: taskToEdit?.title || "",
    description: taskToEdit?.description || "",
    eventId: taskToEdit?.eventId || "",
    assignedTo: taskToEdit?.assignedTo || "",
    priority: taskToEdit?.priority || "MEDIUM",
    status: taskToEdit?.status || "TODO",
    dueAt: taskToEdit?.dueAt ? taskToEdit.dueAt.slice(0, 10) : "",
    reminderAt: taskToEdit?.reminderAt ? taskToEdit.reminderAt.slice(0, 10) : "",
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = taskToEdit
        ? `/api/v1/weddings/${weddingId}/tasks/${taskToEdit.id}`
        : `/api/v1/weddings/${weddingId}/tasks`;
      const method = taskToEdit ? "PATCH" : "POST";

      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        eventId: formData.eventId || undefined,
        assignedTo: formData.assignedTo || undefined,
        priority: formData.priority,
        status: formData.status,
        dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : undefined,
        reminderAt: formData.reminderAt ? new Date(formData.reminderAt).toISOString() : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to save task.");
        setLoading(false);
        return;
      }

      onSuccess(data.data);
      onClose();
    } catch (err: unknown) {
      console.error("Error saving task:", err);
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-surface-container-high/60 pb-3">
          <h2 className="font-headline-sm text-lg font-bold text-on-surface">
            {taskToEdit ? "Edit Task" : "Add New Task"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-error">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Confirm Panditji Muhurat Samagri & Puja Checklist"
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Ceremony / Event
              </label>
              <select
                name="eventId"
                value={formData.eventId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface"
              >
                <option value="">None (Wedding-wide)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Assignee
              </label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface font-semibold"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface font-semibold"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                name="dueAt"
                value={formData.dueAt}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-surface-container-low border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Reminder Date
              </label>
              <input
                type="date"
                name="reminderAt"
                value={formData.reminderAt}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-surface-container-low border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Description / Notes
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Add task specifications, vendor contact info, or ceremony notes..."
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container-high/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-surface-container-high text-on-surface font-semibold hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />}
              <span>{taskToEdit ? "Save Changes" : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
