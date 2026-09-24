import { Types } from "mongoose";
import { EventModel, IEvent, EventType, IEventVenue } from "../models/event.model";

export interface CreateEventParams {
  weddingId: Types.ObjectId;
  name: string;
  description?: string;
  type?: EventType;
  startAt: Date;
  endAt?: Date;
  venue?: IEventVenue;
  dressCode?: string;
  coverMediaId?: Types.ObjectId;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface UpdateEventParams {
  name?: string;
  description?: string;
  type?: EventType;
  startAt?: Date;
  endAt?: Date;
  venue?: IEventVenue;
  dressCode?: string;
  coverMediaId?: Types.ObjectId;
  notes?: string;
  updatedBy?: Types.ObjectId;
}

export class EventRepository {
  /**
   * Creates a new Event record.
   */
  static async create(params: CreateEventParams): Promise<IEvent> {
    const eventDoc = new EventModel({
      weddingId: params.weddingId,
      name: params.name,
      description: params.description,
      type: params.type || "CUSTOM",
      startAt: params.startAt,
      endAt: params.endAt,
      venue: params.venue,
      dressCode: params.dressCode,
      coverMediaId: params.coverMediaId,
      notes: params.notes,
      createdBy: params.createdBy,
    });

    return await eventDoc.save();
  }

  /**
   * Finds all events belonging to a specific weddingId sorted by startAt ascending.
   */
  static async findEventsByWeddingId({
    weddingId,
  }: {
    weddingId: string | Types.ObjectId;
  }): Promise<IEvent[]> {
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    return await EventModel.find({ weddingId: wId }).sort({ startAt: 1 }).exec();
  }

  /**
   * Finds an event strictly scoped by weddingId and eventId.
   */
  static async findByIdAndWeddingId({
    weddingId,
    eventId,
  }: {
    weddingId: string | Types.ObjectId;
    eventId: string | Types.ObjectId;
  }): Promise<IEvent | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(eventId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const eId = typeof eventId === "string" ? new Types.ObjectId(eventId) : eventId;

    return await EventModel.findOne({ _id: eId, weddingId: wId }).exec();
  }

  /**
   * Updates an event strictly scoped by weddingId and eventId.
   */
  static async updateByIdAndWeddingId({
    weddingId,
    eventId,
    updateData,
  }: {
    weddingId: string | Types.ObjectId;
    eventId: string | Types.ObjectId;
    updateData: UpdateEventParams;
  }): Promise<IEvent | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(eventId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const eId = typeof eventId === "string" ? new Types.ObjectId(eventId) : eventId;

    return await EventModel.findOneAndUpdate(
      { _id: eId, weddingId: wId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Deletes an event strictly scoped by weddingId and eventId.
   */
  static async deleteByIdAndWeddingId({
    weddingId,
    eventId,
  }: {
    weddingId: string | Types.ObjectId;
    eventId: string | Types.ObjectId;
  }): Promise<boolean> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(eventId)) {
      return false;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const eId = typeof eventId === "string" ? new Types.ObjectId(eventId) : eventId;

    const res = await EventModel.deleteOne({ _id: eId, weddingId: wId }).exec();
    return res.deletedCount > 0;
  }

  /**
   * Finds the nearest future event for a wedding (or earliest starting event if all in future/past).
   */
  static async findNextUpcomingEvent({
    weddingId,
    fromDate = new Date(),
  }: {
    weddingId: string | Types.ObjectId;
    fromDate?: Date;
  }): Promise<IEvent | null> {
    if (!Types.ObjectId.isValid(weddingId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;

    // First try finding the next future event
    const upcoming = await EventModel.findOne({
      weddingId: wId,
      startAt: { $gte: fromDate },
    })
      .sort({ startAt: 1 })
      .exec();

    if (upcoming) return upcoming;

    // Fallback: return the latest event if all events are in the past
    return await EventModel.findOne({ weddingId: wId })
      .sort({ startAt: -1 })
      .exec();
  }
}
