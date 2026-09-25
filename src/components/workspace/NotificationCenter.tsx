"use client";

import React, { useState, useEffect, useRef } from "react";
import { NotificationDTO } from "@/modules/notifications/services/notification.service";

interface NotificationCenterProps {
  weddingId?: string;
}

export function NotificationCenter({ weddingId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (weddingId) query.append("weddingId", weddingId);
      query.append("limit", "20");

      const res = await fetch(`/api/v1/notifications?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err: unknown) {
      console.error("Error fetching notifications:", err);
    }
  }, [weddingId]);

  useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      if (isMounted) {
        await fetchNotifications();
      }
    };
    void loadNotifications();

    // Poll periodically for new notifications (every 30s)
    const interval = setInterval(() => {
      if (isMounted) {
        void fetchNotifications();
      }
    }, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const query = weddingId ? `?weddingId=${weddingId}` : "";
      const res = await fetch(`/api/v1/notifications/read-all${query}`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        title="Notifications"
        type="button"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high z-50 overflow-hidden flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-surface-container-high/60 flex items-center justify-between bg-surface-container-low/40">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-sm font-bold text-on-surface">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs text-primary-container hover:text-primary font-semibold hover:underline cursor-pointer disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-surface-container-high/40">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-on-surface-variant space-y-1">
                <span className="material-symbols-outlined text-[24px] opacity-40">notifications_off</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.readAt && handleMarkRead(item.id)}
                  className={`p-3 px-4 hover:bg-surface-container-low/50 transition-colors flex items-start gap-3 cursor-pointer ${
                    !item.readAt ? "bg-primary-fixed/10" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-primary-container mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">
                      {item.type === "TASK_ASSIGNED"
                        ? "assignment_ind"
                        : item.type === "TASK_COMMENT"
                        ? "chat_bubble"
                        : "notifications"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-xs text-on-surface truncate">{item.title}</p>
                      <span className="text-[10px] text-on-surface-variant shrink-0">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{item.message}</p>
                  </div>
                  {!item.readAt && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
