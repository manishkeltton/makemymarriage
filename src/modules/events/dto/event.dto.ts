import { IEvent, EventType, IEventVenue } from "../models/event.model";

export interface EventDTO {
  id: string;
  weddingId: string;
  name: string;
  description?: string;
  type: EventType;
  startAt: string;
  endAt?: string;
  venue?: IEventVenue;
  dressCode?: string;
  coverMediaId?: string;
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export function toEventDTO(event: IEvent): EventDTO {
  const doc = event.toObject ? event.toObject() : event;
  const venue = doc.venue;

  return {
    id: (doc._id || event._id).toString(),
    weddingId: (doc.weddingId || event.weddingId).toString(),
    name: doc.name || event.name,
    description: doc.description || event.description || undefined,
    type: (doc.type || event.type || "CUSTOM") as EventType,
    startAt:
      (doc.startAt || event.startAt) instanceof Date
        ? (doc.startAt || event.startAt).toISOString()
        : new Date(doc.startAt || event.startAt).toISOString(),
    endAt: doc.endAt || event.endAt
      ? (doc.endAt || event.endAt) instanceof Date
        ? (doc.endAt || event.endAt).toISOString()
        : new Date(doc.endAt || event.endAt).toISOString()
      : undefined,
    venue: venue
      ? {
          name: venue.name || undefined,
          addressLine1: venue.addressLine1 || undefined,
          addressLine2: venue.addressLine2 || undefined,
          locality: venue.locality || undefined,
          city: venue.city || undefined,
          state: venue.state || undefined,
          postalCode: venue.postalCode || undefined,
          country: venue.country || undefined,
          latitude: venue.latitude !== undefined ? venue.latitude : undefined,
          longitude: venue.longitude !== undefined ? venue.longitude : undefined,
          mapUrl: venue.mapUrl || undefined,
          placeId: venue.placeId || undefined,
        }
      : undefined,
    dressCode: doc.dressCode || event.dressCode || undefined,
    coverMediaId: doc.coverMediaId || event.coverMediaId
      ? (doc.coverMediaId || event.coverMediaId).toString()
      : undefined,
    notes: doc.notes || event.notes || undefined,
    createdBy: (doc.createdBy || event.createdBy).toString(),
    updatedBy: doc.updatedBy || event.updatedBy
      ? (doc.updatedBy || event.updatedBy).toString()
      : undefined,
    createdAt:
      (doc.createdAt || event.createdAt) instanceof Date
        ? (doc.createdAt || event.createdAt).toISOString()
        : new Date(doc.createdAt || event.createdAt).toISOString(),
    updatedAt:
      (doc.updatedAt || event.updatedAt) instanceof Date
        ? (doc.updatedAt || event.updatedAt).toISOString()
        : new Date(doc.updatedAt || event.updatedAt).toISOString(),
  };
}
