"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EventDTO } from "@/modules/events/dto/event.dto";
import { EventFormModal } from "./event-form-modal";
import { DeleteEventModal } from "./delete-event-modal";

interface EventDetailViewProps {
  weddingId: string;
  initialEvent: EventDTO;
}

type ActiveTab = "overview" | "tasks" | "vendors" | "expenses" | "documents";

function formatDateDetails(isoStart: string, isoEnd?: string) {
  const start = new Date(isoStart);
  const startDateStr = start.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const startTimeStr = start.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  let endTimeStr = "";
  if (isoEnd) {
    const end = new Date(isoEnd);
    endTimeStr = end.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return { startDateStr, startTimeStr, endTimeStr };
}

export function EventDetailView({ weddingId, initialEvent }: EventDetailViewProps) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDTO>(initialEvent);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const refreshEvent = async () => {
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/events/${event.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setEvent(data.data);
      }
      router.refresh();
    } catch (err) {
      console.error("Error refreshing event:", err);
      router.refresh();
    }
  };

  const handleDeleted = () => {
    router.push(`/workspace/${weddingId}/events`);
  };

  const { startDateStr, startTimeStr, endTimeStr } = formatDateDetails(
    event.startAt,
    event.endAt
  );

  return (
    <div className="space-y-6 w-full">
      {/* Back Link */}
      <div>
        <Link
          href={`/workspace/${weddingId}/events`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Events &amp; Timeline</span>
        </Link>
      </div>

      {/* Main Header Banner */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container-high/60 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-fixed text-on-primary-fixed-variant border border-primary-container/20">
                {event.type}
              </span>
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                {startDateStr}
              </span>
            </div>

            <h1 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              {event.name}
            </h1>

            {event.description && (
              <p className="font-body-md text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-start">
            <button
              onClick={() => setIsEditOpen(true)}
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center gap-1.5 transition-colors border border-surface-container-high/60 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Edit Event</span>
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              type="button"
              className="px-4 py-2 rounded-lg bg-error-container/30 hover:bg-error-container/60 text-error font-semibold text-xs flex items-center gap-1.5 transition-colors border border-error/20 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-surface-container-high/40 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-[18px] text-primary-container">
              schedule
            </span>
            <span>
              {startTimeStr} {endTimeStr ? ` - ${endTimeStr}` : ""}
            </span>
          </div>

          {event.venue?.name && (
            <div className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[18px] text-primary-container">
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
              <span className="material-symbols-outlined text-[18px] text-secondary">
                checkroom
              </span>
              <span>Dress Code: {event.dressCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-surface-container-high/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: "dashboard" },
          { id: "tasks", label: "Tasks", icon: "check_circle" },
          { id: "vendors", label: "Vendors", icon: "villa" },
          { id: "expenses", label: "Expenses", icon: "payments" },
          { id: "documents", label: "Documents", icon: "folder_open" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { if (tab.id === "tasks" || tab.id === "documents") router.push(`/workspace/${weddingId}/${tab.id}?eventId=${event.id}`); else setActiveTab(tab.id as ActiveTab); }}
            className={`px-4 py-3 font-label-md text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-primary-container text-primary-container"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Main Info Columns (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Timing & Schedule Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/60 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  calendar_clock
                </span>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Date &amp; Timing
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-surface-container-low space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">
                    Ceremony Date
                  </span>
                  <span className="text-sm font-bold text-on-surface">{startDateStr}</span>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-container-low space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">
                    Time Window
                  </span>
                  <span className="text-sm font-bold text-on-surface">
                    {startTimeStr} {endTimeStr ? ` to ${endTimeStr}` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Venue & Location Details */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/60 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    location_on
                  </span>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Venue Details
                  </h3>
                </div>
              </div>

              {event.venue && (event.venue.name || event.venue.city) ? (
                <div className="space-y-3">
                  {event.venue.name && (
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">
                        Venue Name
                      </span>
                      <span className="text-base font-bold text-on-surface">
                        {event.venue.name}
                      </span>
                    </div>
                  )}

                  {(event.venue.addressLine1 || event.venue.city || event.venue.state) && (
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">
                        Full Address
                      </span>
                      <p className="text-sm text-on-surface leading-relaxed">
                        {[
                          event.venue.addressLine1,
                          event.venue.addressLine2,
                          event.venue.locality,
                          event.venue.city,
                          event.venue.state,
                          event.venue.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic">
                  No venue details specified yet. Click Edit Event to add location info.
                </p>
              )}
            </div>

            {/* Internal Notes */}
            {event.notes && (
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/60 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    sticky_note_2
                  </span>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Internal Notes &amp; Instructions
                  </h3>
                </div>
                <p className="font-body-md text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                  {event.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Dress Code Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/60 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  checkroom
                </span>
                <h3 className="font-headline-sm text-sm font-bold text-on-surface">Dress Code</h3>
              </div>

              {event.dressCode ? (
                <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-container-high/50 text-center">
                  <span className="text-sm font-bold text-on-surface">{event.dressCode}</span>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic">No dress code specified.</p>
              )}
            </div>

            {/* Event Metadata */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/60 shadow-xs space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block pb-2 border-b border-surface-container-high/40">
                Information
              </span>
              <div className="text-xs space-y-2 text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Event ID:</span>
                  <span className="font-mono text-on-surface">{event.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created At:</span>
                  <span className="text-on-surface">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="text-on-surface">
                    {new Date(event.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-Overview Coming Soon Module States */}
      {activeTab !== "overview" && (
        <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-12 text-center border border-surface-container-high/60 max-w-xl mx-auto space-y-4 my-6 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center text-primary-container mx-auto">
            <span className="material-symbols-outlined text-[32px]">construction</span>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-headline-lg text-lg font-bold text-on-surface capitalize">
              {activeTab} for {event.name}
            </h3>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              This module is planned for an upcoming milestone. You will be able to associate dedicated {activeTab} specifically with this ceremony.
            </p>
          </div>
        </div>
      )}

      {/* Edit & Delete Modals */}
      <EventFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={refreshEvent}
        weddingId={weddingId}
        eventToEdit={event}
      />

      <DeleteEventModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={handleDeleted}
        weddingId={weddingId}
        eventId={event.id}
        eventName={event.name}
      />
    </div>
  );
}
