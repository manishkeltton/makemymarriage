"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TaskDTO, TaskCommentDTO } from "@/modules/tasks/dto/task.dto";
import { DocumentDTO } from "@/modules/documents/dto/document.dto";

interface TaskDetailDrawerProps {
  weddingId: string;
  task: TaskDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (updatedTask: TaskDTO) => void;
  onTaskDeleted: (taskId: string) => void;
  events?: Array<{ id: string; name: string }>;
  teamMembers?: Array<{ userId: string; userName: string }>;
}

export function TaskDetailDrawer({
  weddingId,
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  events = [],
  teamMembers = [],
}: TaskDetailDrawerProps) {
  const [comments, setComments] = useState<TaskCommentDTO[]>([]);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState("CONTRACT");
  const [addingDoc, setAddingDoc] = useState(false);
  const [showAddDocForm, setShowAddDocForm] = useState(false);

  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!task) return;
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/tasks/${task.id}/comments`);
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.data || []);
      }
    } catch (err: unknown) {
      console.error("Error fetching task comments:", err);
    } finally {
      setLoadingComments(false);
    }
  }, [weddingId, task]);

  const fetchTaskDocuments = useCallback(async () => {
    if (!task) return;
    try {
      const query = new URLSearchParams({
        relatedType: "TASK",
        relatedId: task.id,
      });
      const res = await fetch(`/api/v1/weddings/${weddingId}/documents?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDocuments(data.data || []);
      }
    } catch (err: unknown) {
      console.error("Error fetching task documents:", err);
    }
  }, [weddingId, task]);

  useEffect(() => {
    if (isOpen && task) {
      const loadDrawerData = async () => {
        await Promise.all([fetchComments(), fetchTaskDocuments()]);
      };
      void loadDrawerData();
    }
  }, [isOpen, task, fetchComments, fetchTaskDocuments]);

  const handleFieldChange = async (field: keyof TaskDTO, value: unknown) => {
    if (!task) return;
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to update task.");
        return;
      }
      onTaskUpdated(data.data);
    } catch (err) {
      console.error("Error updating task field:", err);
      setError("Failed to update task field.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newCommentBody.trim()) return;

    setPostingComment(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newCommentBody.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) => [...prev, data.data]);
        setNewCommentBody("");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newDocTitle.trim()) return;

    setAddingDoc(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle.trim(),
          type: newDocType,
          relatedTo: {
            type: "TASK",
            id: task.id,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDocuments((prev) => [data.data, ...prev]);
        setNewDocTitle("");
        setShowAddDocForm(false);
      }
    } catch (err) {
      console.error("Error adding document:", err);
    } finally {
      setAddingDoc(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) return;

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/tasks/${task.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onTaskDeleted(task.id);
        onClose();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/30 backdrop-blur-xs flex justify-end">
      <div className="bg-surface-container-lowest w-full max-w-2xl h-full shadow-2xl border-l border-surface-container-high flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header Bar */}
        <div className="p-4 px-6 border-b border-surface-container-high/60 flex items-center justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-fixed text-primary-container font-bold">
              Task Details
            </span>
            {updating && <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              className="p-1.5 rounded-lg text-error hover:bg-error-container/40 transition-colors"
              title="Delete Task"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-error">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Title Edit */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Task Title
            </label>
            <input
              type="text"
              defaultValue={task.title}
              onBlur={(e) => e.target.value !== task.title && handleFieldChange("title", e.target.value)}
              className="w-full text-lg font-bold text-on-surface bg-transparent border-b border-transparent hover:border-surface-container-high focus:border-primary-container focus:outline-none py-1"
            />
          </div>

          {/* Quick Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-container-low/60 border border-surface-container-high/60">
            {/* Status */}
            <div>
              <span className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">Status</span>
              <select
                value={task.status}
                onChange={(e) => handleFieldChange("status", e.target.value)}
                className="w-full bg-surface-container-lowest border border-surface-container-high rounded px-2 py-1 font-semibold text-on-surface"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <span className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">Priority</span>
              <select
                value={task.priority}
                onChange={(e) => handleFieldChange("priority", e.target.value)}
                className="w-full bg-surface-container-lowest border border-surface-container-high rounded px-2 py-1 font-semibold text-on-surface"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <span className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">Assignee</span>
              <select
                value={task.assignedTo || ""}
                onChange={(e) => handleFieldChange("assignedTo", e.target.value || null)}
                className="w-full bg-surface-container-lowest border border-surface-container-high rounded px-2 py-1 text-on-surface"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userName}
                  </option>
                ))}
              </select>
            </div>

            {/* Event */}
            <div>
              <span className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">Ceremony</span>
              <select
                value={task.eventId || ""}
                onChange={(e) => handleFieldChange("eventId", e.target.value || null)}
                className="w-full bg-surface-container-lowest border border-surface-container-high rounded px-2 py-1 text-on-surface"
              >
                <option value="">None</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Reminder */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Due Date
              </label>
              <input
                type="date"
                defaultValue={task.dueAt ? task.dueAt.slice(0, 10) : ""}
                onBlur={(e) => handleFieldChange("dueAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high font-medium text-on-surface"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Reminder Date
              </label>
              <input
                type="date"
                defaultValue={task.reminderAt ? task.reminderAt.slice(0, 10) : ""}
                onBlur={(e) => handleFieldChange("reminderAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high font-medium text-on-surface"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Description &amp; Specifications
            </label>
            <textarea
              rows={3}
              defaultValue={task.description || ""}
              onBlur={(e) => handleFieldChange("description", e.target.value || null)}
              placeholder="Add details, vendor instructions, or ceremony notes..."
              className="w-full p-3 rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
            />
          </div>

          {/* Linked Documents / Attachments */}
          <div className="space-y-3 pt-3 border-t border-surface-container-high/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[18px]">attach_file</span>
                <span className="font-bold text-on-surface">Documents &amp; Attachments ({documents.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDocForm(!showAddDocForm)}
                className="text-xs text-primary-container font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Attach File</span>
              </button>
            </div>

            {showAddDocForm && (
              <form onSubmit={handleAddDocument} className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Document Title (e.g. DJ Contract, Menu Quote)"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface-container-lowest border border-surface-container-high text-on-surface"
                />
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="bg-surface-container-lowest border border-surface-container-high rounded px-2 py-1 text-on-surface"
                  >
                    <option value="CONTRACT">Contract</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="RECEIPT">Receipt</option>
                    <option value="QUOTATION">Quotation</option>
                    <option value="MENU">Menu</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <button
                    type="submit"
                    disabled={addingDoc}
                    className="px-3 py-1 bg-primary-container text-on-primary font-semibold rounded hover:bg-primary transition-colors disabled:opacity-50"
                  >
                    {addingDoc ? "Saving..." : "Save Document"}
                  </button>
                </div>
              </form>
            )}

            {documents.length === 0 ? (
              <p className="text-on-surface-variant italic text-xs">No documents attached yet.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="material-symbols-outlined text-primary-container text-[20px]">description</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-on-surface truncate">{doc.title}</p>
                        <span className="text-[10px] text-on-surface-variant">{doc.type}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">verified</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity & Comments Stream */}
          <div className="space-y-4 pt-4 border-t border-surface-container-high/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">chat_bubble_outline</span>
              <span className="font-bold text-on-surface">Task Comments ({comments.length})</span>
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handlePostComment} className="space-y-2">
              <textarea
                rows={2}
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="Write a comment or mention @team member..."
                className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={postingComment || !newCommentBody.trim()}
                  className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {postingComment && <span className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />}
                  <span>Post Comment</span>
                </button>
              </div>
            </form>

            {/* Stream */}
            {loadingComments ? (
              <p className="text-on-surface-variant italic">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-on-surface-variant italic">No comments yet. Start the conversation!</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-surface-container-low/40 border border-surface-container-high/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-bold text-[10px] flex items-center justify-center">
                          {c.authorName ? c.authorName.slice(0, 2).toUpperCase() : "TM"}
                        </div>
                        <span className="font-semibold text-on-surface">{c.authorName || "Team Member"}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-on-surface leading-relaxed pl-8">{c.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
