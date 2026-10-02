"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useWedding } from "./wedding-context";
import { EventDTO } from "@/modules/events/dto/event.dto";
import { TeamMemberDTO } from "@/modules/team/dto/team.dto";
import { EventFormModal } from "@/components/events/event-form-modal";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { GuestHouseholdFormModal } from "@/components/guests/GuestHouseholdFormModal";
import { InviteMemberModal } from "@/components/team/invite-member-modal";

export type QuickActionType =
  | "ADD_CEREMONY"
  | "CREATE_TASK"
  | "ADD_GUEST"
  | "INVITE_ORGANISER"
  | null;

interface QuickActionsContextValue {
  activeModal: QuickActionType;
  preselectedEventId?: string;
  events: EventDTO[];
  teamMembers: TeamMemberDTO[];
  loadingOptions: boolean;
  optionsError: string | null;
  openQuickAction: (
    action: QuickActionType,
    defaultEventId?: string,
    triggerEl?: HTMLElement | null
  ) => void;
  closeQuickAction: () => void;
  refreshWorkspaceData: () => Promise<void>;
}

const QuickActionsContext = createContext<QuickActionsContextValue | undefined>(
  undefined
);

export function QuickActionsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { activeWedding } = useWedding();

  const [activeModal, setActiveModal] = useState<QuickActionType>(null);
  const [preselectedEventId, setPreselectedEventId] = useState<string | undefined>(
    undefined
  );
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const [events, setEvents] = useState<EventDTO[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberDTO[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const currentWeddingId = activeWedding?.id;
  const currentWeddingIdRef = useRef(currentWeddingId);

  useEffect(() => {
    currentWeddingIdRef.current = currentWeddingId;
  }, [currentWeddingId]);

  const fetchWorkspaceOptions = useCallback(
    async (weddingId: string, isMountedRef: { current: boolean }) => {
      queueMicrotask(() => {
        if (!isMountedRef.current || weddingId !== currentWeddingIdRef.current) return;
        setLoadingOptions(true);
        setOptionsError(null);
      });

      try {
        const [eventsRes, membersRes] = await Promise.all([
          fetch(`/api/v1/weddings/${weddingId}/events`),
          fetch(`/api/v1/weddings/${weddingId}/members`),
        ]);

        const [eventsData, membersData] = await Promise.all([
          eventsRes.json().catch(() => ({ success: false })),
          membersRes.json().catch(() => ({ success: false })),
        ]);

        if (!isMountedRef.current || weddingId !== currentWeddingIdRef.current) return;

        if (eventsData.success) {
          setEvents(eventsData.data || []);
        }
        if (membersData.success) {
          setTeamMembers(membersData.data || []);
        }
      } catch (err: unknown) {
        if (!isMountedRef.current || weddingId !== currentWeddingIdRef.current) return;
        console.error("Error loading quick action options:", err);
        setOptionsError("Failed to load workspace options.");
      } finally {
        if (isMountedRef.current && weddingId === currentWeddingIdRef.current) {
          setLoadingOptions(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const isMountedRef = { current: true };

    queueMicrotask(() => {
      if (!isMountedRef.current) return;
      // Reset modals and state on wedding context change
      setActiveModal(null);
      setPreselectedEventId(undefined);
      setTriggerElement(null);

      if (currentWeddingId) {
        void fetchWorkspaceOptions(currentWeddingId, isMountedRef);
      } else {
        setEvents([]);
        setTeamMembers([]);
        setLoadingOptions(false);
      }
    });

    return () => {
      isMountedRef.current = false;
    };
  }, [currentWeddingId, fetchWorkspaceOptions]);

  const openQuickAction = useCallback(
    (
      action: QuickActionType,
      defaultEventId?: string,
      triggerEl?: HTMLElement | null
    ) => {
      if (!currentWeddingId) {
        console.warn("Cannot trigger quick action without an active wedding workspace.");
        return;
      }
      setPreselectedEventId(defaultEventId);
      if (triggerEl) {
        setTriggerElement(triggerEl);
      }
      setActiveModal(action);
    },
    [currentWeddingId]
  );

  const closeQuickAction = useCallback(() => {
    setActiveModal(null);
    setPreselectedEventId(undefined);
    if (triggerElement && document.body.contains(triggerElement)) {
      triggerElement.focus();
    } else {
      const fallbackBtn = document.querySelector<HTMLElement>(
        'button[aria-label="Add new workspace item"]'
      );
      if (fallbackBtn && document.body.contains(fallbackBtn)) {
        fallbackBtn.focus();
      }
    }
    setTriggerElement(null);
  }, [triggerElement]);

  const refreshWorkspaceData = useCallback(async () => {
    if (currentWeddingId) {
      const isMountedRef = { current: true };
      await fetchWorkspaceOptions(currentWeddingId, isMountedRef);
    }
    router.refresh();
  }, [currentWeddingId, fetchWorkspaceOptions, router]);

  const handleSuccess = useCallback(async () => {
    await refreshWorkspaceData();
  }, [refreshWorkspaceData]);

  return (
    <QuickActionsContext.Provider
      value={{
        activeModal,
        preselectedEventId,
        events,
        teamMembers,
        loadingOptions,
        optionsError,
        openQuickAction,
        closeQuickAction,
        refreshWorkspaceData,
      }}
    >
      {children}

      {/* Render Quick Action Modals */}
      {currentWeddingId && (
        <>
          <EventFormModal
            isOpen={activeModal === "ADD_CEREMONY"}
            weddingId={currentWeddingId}
            eventToEdit={null}
            onClose={closeQuickAction}
            onSuccess={handleSuccess}
          />

          <TaskFormModal
            isOpen={activeModal === "CREATE_TASK"}
            weddingId={currentWeddingId}
            events={events}
            teamMembers={teamMembers}
            defaultEventId={preselectedEventId}
            taskToEdit={null}
            onClose={closeQuickAction}
            onSuccess={handleSuccess}
          />

          <GuestHouseholdFormModal
            isOpen={activeModal === "ADD_GUEST"}
            weddingId={currentWeddingId}
            household={null}
            onClose={closeQuickAction}
            onSuccess={handleSuccess}
          />

          <InviteMemberModal
            isOpen={activeModal === "INVITE_ORGANISER"}
            weddingId={currentWeddingId}
            weddingEvents={events}
            onClose={closeQuickAction}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions() {
  const context = useContext(QuickActionsContext);
  if (!context) {
    throw new Error("useQuickActions must be used within a QuickActionsProvider");
  }
  return context;
}
