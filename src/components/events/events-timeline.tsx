"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EventDTO } from "@/modules/events/dto/event.dto";
import { EventFormModal } from "./event-form-modal";
import { DeleteEventModal } from "./delete-event-modal";

interface EventsTimelineProps {
  weddingId: string;
  initialEvents: EventDTO[];
}

function formatDate(isoString: string) {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { dateStr: "", timeStr: "", dayNum: "", monthShort: "" };

  const monthShort = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dayNum = d.getDate().toString().padStart(2, "0");
  const dateStr = d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { dateStr, timeStr, dayNum, monthShort };
}

function getTypeBadgeStyle(type: string) {
  switch (type) {
    case "WEDDING":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200";
    case "SANGEET":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200";
    case "MEHENDI":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200";
    case "HALDI":
      return "bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-200";
    case "RECEPTION":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200";
    case "ENGAGEMENT":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200";
    case "ROKA":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200";
    default:
      return "bg-primary-fixed text-on-primary-fixed-variant border-primary-container/20";
  }
}

export function EventsTimeline({ weddingId, initialEvents }: EventsTimelineProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventDTO[]>(initialEvents);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventDTO | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventDTO | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");

  const refreshEvents = async () => {
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/events`);
      const data = await res.json();
      if (data.success && data.data) {
        setEvents(data.data);
      }
      router.refresh();
    } catch (err) {
      console.error("Error refreshing events:", err);
      router.refresh();
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (filterType === "ALL") return true;
    return ev.type === filterType;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[24px]">
              event_available
            </span>
            <h1 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Events &amp; Timeline
            </h1>
          </div>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Manage all functions, scheduling, venues, and dress codes for the wedding workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEventToEdit(null);
              setIsCreateOpen(true);
            }}
            type="button"
            className="h-[42px] px-5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (If events exist) */}
      {events.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === "ALL"
                ? "bg-primary-container text-on-primary shadow-xs"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            All Events ({events.length})
          </button>
          {["WEDDING", "SANGEET", "MEHENDI", "HALDI", "ENGAGEMENT", "RECEPTION"].map((t) => {
            const count = events.filter((e) => e.type === t).length;
            if (count === 0) return null;
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === t
                    ? "bg-primary-container text-on-primary shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {t} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-12 text-center border border-surface-container-high/60 max-w-xl mx-auto space-y-5 my-8 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container mx-auto">
            <span className="material-symbols-outlined text-[36px]">event_busy</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-headline-lg text-xl font-bold text-on-surface">
              No events scheduled yet
            </h3>
            <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
              Start adding wedding ceremonies and functions to build your timeline, coordinate vendors, and organize invitations.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setEventToEdit(null);
                setIsCreateOpen(true);
              }}
              type="button"
              className="px-6 py-3 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Add Your First Event</span>
            </button>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-surface-container-high text-on-surface-variant text-sm">
          No events found for the selected filter.
        </div>
      ) : (
        /* Timeline List */
        <div className="relative pl-4 sm:pl-8 space-y-6 before:absolute before:left-[15px] sm:before:left-[31px] before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-container-high">
          {filteredEvents.map((event, index) => {
            const { dateStr, timeStr, dayNum, monthShort } = formatDate(event.startAt);
            const badgeClass = getTypeBadgeStyle(event.type);

            return (
              <div key={event.id} className="relative flex items-start gap-4 sm:gap-6 group">
                {/* Timeline Dot Badge */}
                <div className="absolute -left-[20px] sm:-left-[36px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-lowest border-2 border-primary-container flex items-center justify-center text-primary-container text-xs font-bold shadow-xs z-10 group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>

                {/* Date Side Pill (Desktop) */}
                <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-surface-container-low border border-surface-container-high/60 shrink-0 text-center">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {monthShort}
                  </span>
                  <span className="text-xl font-bold font-headline-lg text-on-surface leading-none">
                    {dayNum}
                  </span>
                </div>

                {/* Event Card Content */}
                <div className="flex-1 bg-surface-container-lowest rounded-xl p-5 sm:p-6 border border-surface-container-high/60 shadow-xs hover:shadow-md transition-shadow space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${badgeClass}`}
                        >
                          {event.type}
                        </span>
                        <span className="md:hidden text-xs font-medium text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            schedule
                          </span>
                          {dateStr} • {timeStr}
                        </span>
                      </div>
                      <Link
                        href={`/workspace/${weddingId}/events/${event.id}`}
                        className="group-hover:text-primary-container transition-colors inline-block"
                      >
                        <h3 className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface">
                          {event.name}
                        </h3>
                      </Link>
                    </div>

                    {/* Quick Card Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Link
                        href={`/workspace/${weddingId}/events/${event.id}`}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center gap-1 transition-colors border border-surface-container-high/60"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>View</span>
                      </Link>
                      <button
                        onClick={() => {
                          setEventToEdit(event);
                          setIsCreateOpen(true);
                        }}
                        type="button"
                        className="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors border border-surface-container-high/60"
                        title="Edit event"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setEventToDelete(event)}
                        type="button"
                        className="w-8 h-8 rounded-lg bg-error-container/30 hover:bg-error-container/60 text-error flex items-center justify-center transition-colors border border-error/20"
                        title="Delete event"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="font-body-md text-xs sm:text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Event Details Meta Pills */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-surface-container-high/40 text-xs text-on-surface-variant">
                    <div className="hidden md:flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px] text-primary-container">
                        schedule
                      </span>
                      <span>{dateStr} at {timeStr}</span>
                    </div>

                    {event.venue?.name && (
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="material-symbols-outlined text-[16px] text-primary-container">
                          location_on
                        </span>
                        <span>
                          {event.venue.name}
                          {event.venue.city ? `, ${event.venue.city}` : ""}
                        </span>
                      </div>
                    )}

                    {event.dressCode && (
                      <div className="flex items-center gap-1.5 font-medium bg-surface-container-low px-2.5 py-1 rounded-md border border-surface-container-high/50">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          checkroom
                        </span>
                        <span>{event.dressCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <EventFormModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEventToEdit(null);
        }}
        onSuccess={refreshEvents}
        weddingId={weddingId}
        eventToEdit={eventToEdit}
      />

      {eventToDelete && (
        <DeleteEventModal
          isOpen={Boolean(eventToDelete)}
          onClose={() => setEventToDelete(null)}
          onSuccess={refreshEvents}
          weddingId={weddingId}
          eventId={eventToDelete.id}
          eventName={eventToDelete.name}
        />
      )}
    </div>
  );
}
