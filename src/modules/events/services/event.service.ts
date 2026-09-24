import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { WeddingMemberRepository } from "@/modules/weddings/repositories/wedding-member.repository";
import { EventRepository, UpdateEventParams } from "../repositories/event.repository";
import { EventDTO, toEventDTO } from "../dto/event.dto";
import { CreateEventInput, UpdateEventInput } from "../validation/event.schemas";

export class EventService {
  /**
   * Creates a new Event for a wedding.
   */
  static async createEvent(
    weddingId: string,
    userId: string,
    payload: CreateEventInput
  ): Promise<{ success: boolean; data?: EventDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid ID format", code: "INVALID_ID" };
    }

    try {
      const member = await WeddingMemberRepository.findMember(weddingId, userId);
      if (!member) {
        return { success: false, error: "Access denied or wedding not found", code: "FORBIDDEN" };
      }

      const startAtDate = new Date(payload.startAt);
      const endAtDate = payload.endAt ? new Date(payload.endAt) : undefined;

      if (endAtDate && endAtDate.getTime() < startAtDate.getTime()) {
        return {
          success: false,
          error: "End time must be after or equal to start time",
          code: "INVALID_DATE_RANGE",
        };
      }

      const eventDoc = await EventRepository.create({
        weddingId: new Types.ObjectId(weddingId),
        name: payload.name,
        description: payload.description || undefined,
        type: payload.type || "CUSTOM",
        startAt: startAtDate,
        endAt: endAtDate,
        venue: payload.venue
          ? {
              name: payload.venue.name || undefined,
              addressLine1: payload.venue.addressLine1 || undefined,
              addressLine2: payload.venue.addressLine2 || undefined,
              locality: payload.venue.locality || undefined,
              city: payload.venue.city || undefined,
              state: payload.venue.state || undefined,
              postalCode: payload.venue.postalCode || undefined,
              country: payload.venue.country || undefined,
              latitude: payload.venue.latitude ?? undefined,
              longitude: payload.venue.longitude ?? undefined,
              mapUrl: payload.venue.mapUrl || undefined,
              placeId: payload.venue.placeId || undefined,
            }
          : undefined,
        dressCode: payload.dressCode || undefined,
        coverMediaId: payload.coverMediaId ? new Types.ObjectId(payload.coverMediaId) : undefined,
        notes: payload.notes || undefined,
        createdBy: new Types.ObjectId(userId),
      });

      return { success: true, data: toEventDTO(eventDoc) };
    } catch (err: unknown) {
      console.error("Error creating event:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to create event";
      return { success: false, error: errMsg, code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Retrieves all events for a given wedding.
   */
  static async getEventsByWeddingId(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: EventDTO[]; error?: string; code?: string }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid ID format", code: "INVALID_ID" };
    }

    try {
      const member = await WeddingMemberRepository.findMember(weddingId, userId);
      if (!member) {
        return { success: false, error: "Access denied or wedding not found", code: "FORBIDDEN" };
      }

      const events = await EventRepository.findEventsByWeddingId({ weddingId });
      return { success: true, data: events.map(toEventDTO) };
    } catch (err: unknown) {
      console.error("Error fetching events:", err);
      return { success: false, error: "Failed to fetch events", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Retrieves a single event by weddingId and eventId.
   */
  static async getEventById(
    weddingId: string,
    eventId: string,
    userId: string
  ): Promise<{ success: boolean; data?: EventDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (
      !Types.ObjectId.isValid(weddingId) ||
      !Types.ObjectId.isValid(eventId) ||
      !Types.ObjectId.isValid(userId)
    ) {
      return { success: false, error: "Invalid ID format", code: "INVALID_ID" };
    }

    try {
      const member = await WeddingMemberRepository.findMember(weddingId, userId);
      if (!member) {
        return { success: false, error: "Access denied or wedding not found", code: "FORBIDDEN" };
      }

      const event = await EventRepository.findByIdAndWeddingId({ weddingId, eventId });
      if (!event) {
        return { success: false, error: "Event not found", code: "NOT_FOUND" };
      }

      return { success: true, data: toEventDTO(event) };
    } catch (err: unknown) {
      console.error("Error fetching event by ID:", err);
      return { success: false, error: "Internal server error", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Updates an existing event.
   */
  static async updateEvent(
    weddingId: string,
    eventId: string,
    userId: string,
    payload: UpdateEventInput
  ): Promise<{ success: boolean; data?: EventDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (
      !Types.ObjectId.isValid(weddingId) ||
      !Types.ObjectId.isValid(eventId) ||
      !Types.ObjectId.isValid(userId)
    ) {
      return { success: false, error: "Invalid ID format", code: "INVALID_ID" };
    }

    try {
      const member = await WeddingMemberRepository.findMember(weddingId, userId);
      if (!member) {
        return { success: false, error: "Access denied or wedding not found", code: "FORBIDDEN" };
      }

      const existingEvent = await EventRepository.findByIdAndWeddingId({ weddingId, eventId });
      if (!existingEvent) {
        return { success: false, error: "Event not found", code: "NOT_FOUND" };
      }

      const newStartAt = payload.startAt
        ? new Date(payload.startAt)
        : existingEvent.startAt;
      const newEndAt =
        payload.endAt !== undefined
          ? payload.endAt
            ? new Date(payload.endAt)
            : undefined
          : existingEvent.endAt;

      if (newEndAt && newEndAt.getTime() < newStartAt.getTime()) {
        return {
          success: false,
          error: "End time must be after or equal to start time",
          code: "INVALID_DATE_RANGE",
        };
      }

      const updateData: UpdateEventParams = {
        updatedBy: new Types.ObjectId(userId),
      };

      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.description !== undefined)
        updateData.description = payload.description || undefined;
      if (payload.type !== undefined) updateData.type = payload.type;
      if (payload.startAt !== undefined) updateData.startAt = newStartAt;
      if (payload.endAt !== undefined) updateData.endAt = newEndAt;
      if (payload.venue !== undefined) {
        updateData.venue = payload.venue
          ? {
              name: payload.venue.name || undefined,
              addressLine1: payload.venue.addressLine1 || undefined,
              addressLine2: payload.venue.addressLine2 || undefined,
              locality: payload.venue.locality || undefined,
              city: payload.venue.city || undefined,
              state: payload.venue.state || undefined,
              postalCode: payload.venue.postalCode || undefined,
              country: payload.venue.country || undefined,
              latitude: payload.venue.latitude ?? undefined,
              longitude: payload.venue.longitude ?? undefined,
              mapUrl: payload.venue.mapUrl || undefined,
              placeId: payload.venue.placeId || undefined,
            }
          : undefined;
      }
      if (payload.dressCode !== undefined)
        updateData.dressCode = payload.dressCode || undefined;
      if (payload.coverMediaId !== undefined)
        updateData.coverMediaId = payload.coverMediaId
          ? new Types.ObjectId(payload.coverMediaId)
          : undefined;
      if (payload.notes !== undefined) updateData.notes = payload.notes || undefined;

      const updatedDoc = await EventRepository.updateByIdAndWeddingId({
        weddingId,
        eventId,
        updateData,
      });

      if (!updatedDoc) {
        return { success: false, error: "Event not found", code: "NOT_FOUND" };
      }

      return { success: true, data: toEventDTO(updatedDoc) };
    } catch (err: unknown) {
      console.error("Error updating event:", err);
      return { success: false, error: "Failed to update event", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Deletes an event for a wedding.
   */
  static async deleteEvent(
    weddingId: string,
    eventId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    if (
      !Types.ObjectId.isValid(weddingId) ||
      !Types.ObjectId.isValid(eventId) ||
      !Types.ObjectId.isValid(userId)
    ) {
      return { success: false, error: "Invalid ID format", code: "INVALID_ID" };
    }

    try {
      const member = await WeddingMemberRepository.findMember(weddingId, userId);
      if (!member) {
        return { success: false, error: "Access denied or wedding not found", code: "FORBIDDEN" };
      }

      const deleted = await EventRepository.deleteByIdAndWeddingId({ weddingId, eventId });
      if (!deleted) {
        return { success: false, error: "Event not found", code: "NOT_FOUND" };
      }

      return { success: true };
    } catch (err: unknown) {
      console.error("Error deleting event:", err);
      return { success: false, error: "Failed to delete event", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Retrieves the next upcoming event for dashboard integration.
   */
  static async getNextUpcomingEvent(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: EventDTO | null; error?: string; code?: string }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid ID format", code: "INVALID_ID" };
    }

    try {
      const member = await WeddingMemberRepository.findMember(weddingId, userId);
      if (!member) {
        return { success: false, error: "Access denied or wedding not found", code: "FORBIDDEN" };
      }

      const event = await EventRepository.findNextUpcomingEvent({ weddingId });
      return { success: true, data: event ? toEventDTO(event) : null };
    } catch (err: unknown) {
      console.error("Error fetching next event:", err);
      return { success: false, error: "Failed to fetch next event", code: "INTERNAL_ERROR" };
    }
  }
}
