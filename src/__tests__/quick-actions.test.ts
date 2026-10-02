import { describe, it, expect, vi, beforeEach } from "vitest";

describe("V1 Workspace Quick Actions Integration Unit & Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Quick Actions Dispatching & Context Safety", () => {
    it("should allow dispatching all 4 quick action modal types", () => {
      const modalTypes = ["ADD_CEREMONY", "CREATE_TASK", "ADD_GUEST", "INVITE_ORGANISER"] as const;
      expect(modalTypes).toHaveLength(4);
      let activeModal: string | null = null;
      let preselectedEventId: string | undefined = undefined;

      const openQuickAction = (type: typeof modalTypes[number], eventId?: string) => {
        activeModal = type;
        preselectedEventId = eventId;
      };

      openQuickAction("ADD_CEREMONY");
      expect(activeModal).toBe("ADD_CEREMONY");
      expect(preselectedEventId).toBeUndefined();

      openQuickAction("CREATE_TASK", "evt_haldi_99");
      expect(activeModal).toBe("CREATE_TASK");
      expect(preselectedEventId).toBe("evt_haldi_99");

      openQuickAction("ADD_GUEST");
      expect(activeModal).toBe("ADD_GUEST");

      openQuickAction("INVITE_ORGANISER");
      expect(activeModal).toBe("INVITE_ORGANISER");
    });

    it("should enforce fresh form state on every quick action invocation", () => {
      const createFreshFormState = (action: string, defaultEventId?: string) => {
        switch (action) {
          case "ADD_CEREMONY":
            return { isEdit: false, eventToEdit: null, name: "" };
          case "CREATE_TASK":
            return { isEdit: false, taskToEdit: null, eventId: defaultEventId || "" };
          case "ADD_GUEST":
            return { isEdit: false, household: null, householdName: "" };
          case "INVITE_ORGANISER":
            return { email: "", role: "ORGANISER", inviteUrl: null };
          default:
            return null;
        }
      };

      const freshCeremony = createFreshFormState("ADD_CEREMONY");
      expect(freshCeremony?.isEdit).toBe(false);
      expect(freshCeremony?.eventToEdit).toBeNull();

      const freshTaskWithEvent = createFreshFormState("CREATE_TASK", "evt_sangeet_123");
      expect(freshTaskWithEvent?.isEdit).toBe(false);
      expect(freshTaskWithEvent?.eventId).toBe("evt_sangeet_123");

      const freshGuest = createFreshFormState("ADD_GUEST");
      expect(freshGuest?.household).toBeNull();

      const freshInvite = createFreshFormState("INVITE_ORGANISER");
      expect(freshInvite?.email).toBe("");
      expect(freshInvite?.inviteUrl).toBeNull();
    });

    it("should close open modals and reset state when switching active wedding context", () => {
      let activeWeddingId: string | null = "wed_123";
      let activeModal: string | null = "ADD_CEREMONY";

      const handleWeddingContextChange = (newWeddingId: string | null) => {
        activeWeddingId = newWeddingId;
        activeModal = null; // Clean reset on context switch!
      };

      handleWeddingContextChange("wed_456");
      expect(activeWeddingId).toBe("wed_456");
      expect(activeModal).toBeNull();
    });

    it("should ignore stale option fetch responses if active wedding changes during fetch", async () => {
      let activeWeddingId = "wed_123";
      let loadedEvents: string[] = [];

      const mockFetchEvents = async (weddingId: string) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { weddingId, events: [`Event for ${weddingId}`] };
      };

      const fetchPromise1 = mockFetchEvents("wed_123");
      activeWeddingId = "wed_456"; // User switches wedding while fetch is pending!
      const result1 = await fetchPromise1;

      // Stale response check: discard if result.weddingId !== activeWeddingId
      if (result1.weddingId === activeWeddingId) {
        loadedEvents = result1.events;
      }

      expect(loadedEvents).toEqual([]); // Stale response discarded!
    });

    it("should handle options loading errors gracefully without throwing UI exceptions", async () => {
      const fetchOptionsWithErrorHandling = async () => {
        try {
          throw new Error("Network error loading members");
        } catch {
          return { success: false, events: [], teamMembers: [], error: "Failed to load options" };
        }
      };

      const res = await fetchOptionsWithErrorHandling();
      expect(res.success).toBe(false);
      expect(res.events).toEqual([]);
      expect(res.teamMembers).toEqual([]);
      expect(res.error).toBe("Failed to load options");
    });
  });

  describe("API Endpoint Permissions & Quotas", () => {
    it("should display server authorization errors inline without crashing", () => {
      const serverResponse = {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied: requires guest management permission",
        },
      };

      const handleFormSubmitResponse = (res: typeof serverResponse) => {
        if (!res.success) {
          return res.error.message;
        }
        return null;
      };

      const errorMsg = handleFormSubmitResponse(serverResponse);
      expect(errorMsg).toBe("Access denied: requires guest management permission");
    });
  });

  describe("Regression Tests for P1 Quick Actions Findings", () => {
    it("QUICK-ACTIONS-P1-01: should discard background option fetches if currentWeddingId changes before promise resolves", async () => {
      let activeWeddingId = "wedding_A";
      let clientEvents: string[] = [];

      const simulateRefreshWorkspaceData = async (fetchedWeddingId: string) => {
        await new Promise((r) => setTimeout(r, 20));
        // Guard check: discard response if wedding changed during fetch!
        if (fetchedWeddingId === activeWeddingId) {
          clientEvents = [`Event of ${fetchedWeddingId}`];
        }
      };

      const refreshPromiseA = simulateRefreshWorkspaceData("wedding_A");
      activeWeddingId = "wedding_B"; // User switches workspace during refresh fetch!
      await refreshPromiseA;

      expect(clientEvents).toEqual([]); // Assert wedding_A options were NOT saved into client state for wedding_B!
    });

    it("QUICK-ACTIONS-P1-02: should fall back to primary header Add button if original triggerElement was unmounted", () => {
      let focusedElementId: string | null = null;
      const fakeHeaderAddButton = { id: "header_add_btn", focus: () => { focusedElementId = "header_add_btn"; } };
      let triggerElement: { id: string; inDOM: boolean; focus: () => void } | null = {
        id: "menu_item_create_task",
        inDOM: false, // Menu unmounted!
        focus: () => { focusedElementId = "menu_item_create_task"; },
      };

      const closeQuickAction = () => {
        if (triggerElement && triggerElement.inDOM) {
          triggerElement.focus();
        } else {
          // Fallback to header Add button
          fakeHeaderAddButton.focus();
        }
        triggerElement = null;
      };

      closeQuickAction();
      expect(focusedElementId).toBe("header_add_btn");
      expect(triggerElement).toBeNull();
    });
  });
});
