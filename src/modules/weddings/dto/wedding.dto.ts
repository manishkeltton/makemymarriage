import { IWedding, IGeneralLocation } from "../models/wedding.model";
import { IWeddingMember, IWeddingMemberPermissions } from "../models/wedding-member.model";

export interface WeddingDTO {
  id: string;
  title: string;
  bride: {
    name: string;
  };
  groom: {
    name: string;
  };
  primaryWeddingDate: string;
  generalLocation?: IGeneralLocation;
  coverMediaId?: string;
  status: "PLANNING" | "COMPLETED" | "ARCHIVED";
  preferredLanguage: "en" | "hi";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingMemberDTO {
  id: string;
  weddingId: string;
  userId: string;
  role: "ADMIN" | "MANAGER" | "ORGANISER";
  permissions: IWeddingMemberPermissions;
  eventScope: {
    allEvents: boolean;
    eventIds: string[];
  };
  status: "ACTIVE" | "REMOVED";
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export function toWeddingDTO(wedding: IWedding): WeddingDTO {
  const loc = wedding.generalLocation;
  return {
    id: wedding._id.toString(),
    title: wedding.title,
    bride: {
      name: wedding.bride?.name || "",
    },
    groom: {
      name: wedding.groom?.name || "",
    },
    primaryWeddingDate: wedding.primaryWeddingDate instanceof Date
      ? wedding.primaryWeddingDate.toISOString()
      : new Date(wedding.primaryWeddingDate).toISOString(),
    generalLocation: loc
      ? {
          name: loc.name,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }
      : undefined,
    coverMediaId: wedding.coverMediaId ? wedding.coverMediaId.toString() : undefined,
    status: wedding.status,
    preferredLanguage: wedding.preferredLanguage,
    createdBy: wedding.createdBy ? wedding.createdBy.toString() : "",
    createdAt: wedding.createdAt instanceof Date ? wedding.createdAt.toISOString() : new Date(wedding.createdAt).toISOString(),
    updatedAt: wedding.updatedAt instanceof Date ? wedding.updatedAt.toISOString() : new Date(wedding.updatedAt).toISOString(),
  };
}

export function toWeddingMemberDTO(member: IWeddingMember): WeddingMemberDTO {
  const p = member.permissions;
  return {
    id: member._id.toString(),
    weddingId: member.weddingId ? member.weddingId.toString() : "",
    userId: member.userId ? member.userId.toString() : "",
    role: member.role,
    permissions: p
      ? {
          guests: Boolean(p.guests),
          vendors: Boolean(p.vendors),
          finance: Boolean(p.finance),
          gallery: Boolean(p.gallery),
          website: Boolean(p.website),
          guestbook: Boolean(p.guestbook),
          emergency: Boolean(p.emergency),
        }
      : {
          guests: true,
          vendors: true,
          finance: true,
          gallery: true,
          website: true,
          guestbook: true,
          emergency: true,
        },
    eventScope: {
      allEvents: member.eventScope?.allEvents ?? true,
      eventIds: (member.eventScope?.eventIds || []).map((id) => id.toString()),
    },
    status: member.status,
    joinedAt: member.joinedAt instanceof Date ? member.joinedAt.toISOString() : new Date(member.joinedAt).toISOString(),
    createdAt: member.createdAt instanceof Date ? member.createdAt.toISOString() : new Date(member.createdAt).toISOString(),
    updatedAt: member.updatedAt instanceof Date ? member.updatedAt.toISOString() : new Date(member.updatedAt).toISOString(),
  };
}
