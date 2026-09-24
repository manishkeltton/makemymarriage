import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { EventService } from "../modules/events/services/event.service";
import { EventModel, IEvent } from "../modules/events/models/event.model";
import { EventRepository } from "../modules/events/repositories/event.repository";
import { WeddingMemberRepository } from "../modules/weddings/repositories/wedding-member.repository";
import { createEventSchema } from "../modules/events/validation/event.schemas";
import { connectToDatabase } from "../lib/db/connect";

vi.mock("../lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("../modules/events/models/event.model", () => ({
  EventModel: {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock("../modules/weddings/repositories/wedding-member.repository", () => ({
  WeddingMemberRepository: {
    findMember: vi.fn(),
  },
}));

describe("Event Management Unit & Integration Tests", () => {
  const fakeUserId = new Types.ObjectId().toString();
  const fakeWeddingId = new Types.ObjectId().toString();
  const fakeEventId = new Types.ObjectId().toString();
  const unrelatedWeddingId = new Types.ObjectId().toString();

  const fakeMemberDoc = {
    _id: new Types.ObjectId(),
    weddingId: new Types.ObjectId(fakeWeddingId),
    userId: new Types.ObjectId(fakeUserId),
    role: "ADMIN",
    status: "ACTIVE",
  };

  const createMockEventDoc = (override = {}) => ({
    _id: new Types.ObjectId(fakeEventId),
    weddingId: new Types.ObjectId(fakeWeddingId),
    name: "Sangeet Night",
    type: "SANGEET",
    description: "Fun filled evening with music and dance",
    startAt: new Date("2026-11-20T18:00:00.000Z"),
    endAt: new Date("2026-11-20T23:30:00.000Z"),
    venue: {
      name: "The Leela Palace",
      city: "Udaipur",
      state: "Rajasthan",
      country: "India",
      latitude: 24.5713,
      longitude: 73.6791,
    },
    dressCode: "Royal Indo-Western",
    notes: "Choreographer arriving at 5 PM",
    createdBy: new Types.ObjectId(fakeUserId),
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: function () {
      return this;
    },
    ...override,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation Schemas", () => {
    it("should pass valid create event payload", () => {
      const validPayload = {
        name: "Haldi Ceremony",
        type: "HALDI",
        startAt: "2026-12-10T10:00:00.000Z",
        endAt: "2026-12-10T13:00:00.000Z",
        venue: {
          name: "Poolside Lawn",
          latitude: 24.5,
          longitude: 73.6,
        },
        dressCode: "Yellow Ethnic",
      };

      const result = createEventSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject payload if endAt is before startAt", () => {
      const invalidPayload = {
        name: "Invalid Timing Event",
        startAt: "2026-12-10T14:00:00.000Z",
        endAt: "2026-12-10T10:00:00.000Z",
      };

      const result = createEventSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("End time must be after or equal to start time");
      }
    });

    it("should reject latitude out of bounds (-90 to 90)", () => {
      const invalidVenue = {
        name: "Test",
        startAt: "2026-12-10T10:00:00.000Z",
        venue: { latitude: 120, longitude: 50 },
      };

      const result = createEventSchema.safeParse(invalidVenue);
      expect(result.success).toBe(false);
    });
  });

  describe("EventService.createEvent", () => {
    it("should create an event when user is an active wedding member", async () => {
      (WeddingMemberRepository.findMember as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMemberDoc);
      
      const mockDoc = createMockEventDoc();
      vi.spyOn(EventRepository, "create").mockResolvedValue(mockDoc as unknown as IEvent);

      const result = await EventService.createEvent(fakeWeddingId, fakeUserId, {
        name: "Sangeet Night",
        type: "SANGEET",
        startAt: "2026-11-20T18:00:00.000Z",
        endAt: "2026-11-20T23:30:00.000Z",
      });

      expect(connectToDatabase).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Sangeet Night");
      expect(result.data?.weddingId).toBe(fakeWeddingId);
      expect(result.data?.createdBy).toBe(fakeUserId);
    });

    it("should deny creation if user is not a member of the wedding", async () => {
      (WeddingMemberRepository.findMember as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await EventService.createEvent(fakeWeddingId, fakeUserId, {
        name: "Unapproved Event",
        startAt: "2026-11-20T18:00:00.000Z",
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("FORBIDDEN");
    });
  });

  describe("EventService.getEventsByWeddingId", () => {
    it("should list events chronologically for authorized wedding member", async () => {
      (WeddingMemberRepository.findMember as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMemberDoc);

      const event1 = createMockEventDoc({ name: "Mehendi", startAt: new Date("2026-11-19T10:00:00Z") });
      const event2 = createMockEventDoc({ name: "Sangeet", startAt: new Date("2026-11-20T18:00:00Z") });

      const mockExec = vi.fn().mockResolvedValue([event1, event2]);
      const mockSort = vi.fn().mockReturnValue({ exec: mockExec });
      (EventModel.find as ReturnType<typeof vi.fn>).mockReturnValue({ sort: mockSort });

      const result = await EventService.getEventsByWeddingId(fakeWeddingId, fakeUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe("Mehendi");
      expect(result.data?.[1].name).toBe("Sangeet");
    });

    it("should isolate cross-tenant requests and forbid access if not member", async () => {
      (WeddingMemberRepository.findMember as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await EventService.getEventsByWeddingId(unrelatedWeddingId, fakeUserId);
      expect(result.success).toBe(false);
      expect(result.code).toBe("FORBIDDEN");
    });
  });

  describe("EventService.getEventById", () => {
    it("should retrieve single event strictly scoped by eventId and weddingId", async () => {
      (WeddingMemberRepository.findMember as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMemberDoc);

      const mockDoc = createMockEventDoc();
      const mockExec = vi.fn().mockResolvedValue(mockDoc);
      (EventModel.findOne as ReturnType<typeof vi.fn>).mockReturnValue({ exec: mockExec });

      const result = await EventService.getEventById(fakeWeddingId, fakeEventId, fakeUserId);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(fakeEventId);
      expect(result.data?.weddingId).toBe(fakeWeddingId);
    });

    it("should return NOT_FOUND if event exists in DB but under a different weddingId", async () => {
      (WeddingMemberRepository.findMember as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMemberDoc);

      const mockExec = vi.fn().mockResolvedValue(null); // findOne({ _id: eventId, weddingId }) returns null
      (EventModel.findOne as ReturnType<typeof vi.fn>).mockReturnValue({ exec: mockExec });

      const result = await EventService.getEventById(unrelatedWeddingId, fakeEventId, fakeUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe("NOT_FOUND");
    });
  });

  describe("EventService.updateEvent", () => {
    it("should allow partial updates to event details while preserving immutable fields", async () => {
      (WeddingMemberRepository.findMember as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMemberDoc);

      const existingDoc = createMockEventDoc();
      vi.spyOn(EventRepository, "findByIdAndWeddingId").mockResolvedValue(existingDoc as unknown as IEvent);

      const updatedDoc = createMockEventDoc({ name: "Grand Sangeet Gala" });
      vi.spyOn(EventRepository, "updateByIdAndWeddingId").mockResolvedValue(updatedDoc as unknown as IEvent);

      const result = await EventService.updateEvent(fakeWeddingId, fakeEventId, fakeUserId, {
        name: "Grand Sangeet Gala",
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Grand Sangeet Gala");
    });

    it("should reject update if endAt is set earlier than existing startAt", async () => {
      (WeddingMemberRepository.findMember as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMemberDoc);

      const existingDoc = createMockEventDoc({ startAt: new Date("2026-11-20T18:00:00Z") });
      vi.spyOn(EventRepository, "findByIdAndWeddingId").mockResolvedValue(existingDoc as unknown as IEvent);

      const result = await EventService.updateEvent(fakeWeddingId, fakeEventId, fakeUserId, {
        endAt: "2026-11-20T12:00:00Z", // 12:00 is before 18:00
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_DATE_RANGE");
    });
  });

  describe("EventService.deleteEvent", () => {
    it("should safely delete event scoped by weddingId and eventId", async () => {
      (WeddingMemberRepository.findMember as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMemberDoc);
      vi.spyOn(EventRepository, "deleteByIdAndWeddingId").mockResolvedValue(true);

      const result = await EventService.deleteEvent(fakeWeddingId, fakeEventId, fakeUserId);

      expect(result.success).toBe(true);
    });

    it("should return NOT_FOUND if event does not exist", async () => {
      (WeddingMemberRepository.findMember as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMemberDoc);
      vi.spyOn(EventRepository, "deleteByIdAndWeddingId").mockResolvedValue(false);

      const result = await EventService.deleteEvent(fakeWeddingId, fakeEventId, fakeUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe("NOT_FOUND");
    });
  });
});
