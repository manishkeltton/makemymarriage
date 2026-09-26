import { IGuestHousehold, GuestSide, InvitationStatus, RsvpStatus } from "../models/guest-household.model";

export { GUEST_SIDES, INVITATION_STATUSES, RSVP_STATUSES } from "../models/guest-household.model";
export type { GuestSide, InvitationStatus, RsvpStatus } from "../models/guest-household.model";

export interface GuestHouseholdMemberDTO {
  id: string;
  name: string;
}

export interface GuestHouseholdDTO {
  id: string;
  weddingId: string;
  householdName: string;
  primaryContact: {
    name: string;
    email?: string;
    phone?: string;
  };
  side: GuestSide;
  members: GuestHouseholdMemberDTO[];
  totalInvited: number;
  invitationStatus: InvitationStatus;
  invitationSentAt?: string;
  rsvp: {
    status: RsvpStatus;
    attendingCount: number;
    respondedAt?: string;
  };
  galleryAccess: boolean;
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicGuestAccessDTO {
  householdId: string;
  householdName: string;
  side: GuestSide;
  primaryContactName: string;
  members: GuestHouseholdMemberDTO[];
  totalInvited: number;
  invitationStatus: InvitationStatus;
  rsvp: {
    status: RsvpStatus;
    attendingCount: number;
    respondedAt?: string;
  };
  galleryAccess: boolean;
  wedding: {
    title: string;
    primaryWeddingDate?: string;
    brideName?: string;
    groomName?: string;
    locationName?: string;
    cityName?: string;
  };
}

export interface GuestStatsSummaryDTO {
  totalHouseholds: number;
  totalInvited: number;
  totalAttending: number;
  totalDeclined: number;
  totalAwaiting: number;
  totalSent: number;
  sideBreakdown: {
    bride: number;
    groom: number;
    both: number;
  };
}

export function toGuestHouseholdDTO(doc: IGuestHousehold): GuestHouseholdDTO {
  return {
    id: doc._id.toString(),
    weddingId: doc.weddingId.toString(),
    householdName: doc.householdName,
    primaryContact: {
      name: doc.primaryContact.name,
      email: doc.primaryContact.email || undefined,
      phone: doc.primaryContact.phone || undefined,
    },
    side: doc.side,
    members: (doc.members || []).map((m) => ({
      id: m._id ? m._id.toString() : "",
      name: m.name,
    })),
    totalInvited: doc.totalInvited,
    invitationStatus: doc.invitationStatus,
    invitationSentAt: doc.invitationSentAt ? doc.invitationSentAt.toISOString() : undefined,
    rsvp: {
      status: doc.rsvp.status,
      attendingCount: doc.rsvp.attendingCount ?? (doc.rsvp.status === "ATTENDING" ? doc.totalInvited : 0),
      respondedAt: doc.rsvp.respondedAt ? doc.rsvp.respondedAt.toISOString() : undefined,
    },
    galleryAccess: Boolean(doc.galleryAccess),
    notes: doc.notes || undefined,
    createdBy: doc.createdBy ? doc.createdBy.toString() : "",
    updatedBy: doc.updatedBy ? doc.updatedBy.toString() : undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicGuestAccessDTO(
  householdDoc: IGuestHousehold,
  weddingMeta: {
    title: string;
    primaryWeddingDate?: Date;
    brideName?: string;
    groomName?: string;
    locationName?: string;
    cityName?: string;
  }
): PublicGuestAccessDTO {
  return {
    householdId: householdDoc._id.toString(),
    householdName: householdDoc.householdName,
    side: householdDoc.side,
    primaryContactName: householdDoc.primaryContact.name,
    members: (householdDoc.members || []).map((m) => ({
      id: m._id ? m._id.toString() : "",
      name: m.name,
    })),
    totalInvited: householdDoc.totalInvited,
    invitationStatus: householdDoc.invitationStatus,
    rsvp: {
      status: householdDoc.rsvp.status,
      attendingCount: householdDoc.rsvp.attendingCount ?? (householdDoc.rsvp.status === "ATTENDING" ? householdDoc.totalInvited : 0),
      respondedAt: householdDoc.rsvp.respondedAt ? householdDoc.rsvp.respondedAt.toISOString() : undefined,
    },
    galleryAccess: Boolean(householdDoc.galleryAccess),
    wedding: {
      title: weddingMeta.title,
      primaryWeddingDate: weddingMeta.primaryWeddingDate ? weddingMeta.primaryWeddingDate.toISOString() : undefined,
      brideName: weddingMeta.brideName,
      groomName: weddingMeta.groomName,
      locationName: weddingMeta.locationName,
      cityName: weddingMeta.cityName,
    },
  };
}
