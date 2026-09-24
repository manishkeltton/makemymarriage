import { IWeddingMember } from "@/modules/weddings/models/wedding-member.model";
import { IWeddingMemberInvite } from "../models/wedding-member-invite.model";
import { IUser } from "@/lib/db/models/User";
import { IWedding } from "@/modules/weddings/models/wedding.model";

export interface TeamMemberDTO {
  id: string;
  weddingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: "ADMIN" | "MANAGER" | "ORGANISER";
  permissions: {
    guests: boolean;
    vendors: boolean;
    finance: boolean;
    gallery: boolean;
    website: boolean;
    guestbook: boolean;
    emergency: boolean;
  };
  eventScope: {
    allEvents: boolean;
    eventIds: string[];
  };
  status: "ACTIVE" | "REMOVED";
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingInviteDTO {
  id: string;
  weddingId: string;
  invitedEmail: string;
  role: "ADMIN" | "MANAGER" | "ORGANISER";
  permissions: {
    guests: boolean;
    vendors: boolean;
    finance: boolean;
    gallery: boolean;
    website: boolean;
    guestbook: boolean;
    emergency: boolean;
  };
  eventScope: {
    allEvents: boolean;
    eventIds: string[];
  };
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
  inviteUrl?: string;
}

export interface PublicInvitePreviewDTO {
  invitedEmail: string;
  role: "ADMIN" | "MANAGER" | "ORGANISER";
  wedding: {
    id: string;
    title: string;
    brideName: string;
    groomName: string;
  };
  invitedByName: string;
  expiresAt: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  isExpired: boolean;
  isInvitedUserRegistered?: boolean;
}

export function toTeamMemberDTO(
  member: IWeddingMember,
  user?: Partial<IUser> | null
): TeamMemberDTO {
  const doc = member.toObject ? member.toObject() : member;
  const p = doc.permissions || member.permissions;

  return {
    id: (doc._id || member._id).toString(),
    weddingId: (doc.weddingId || member.weddingId).toString(),
    userId: (doc.userId || member.userId).toString(),
    userName: user?.name || (typeof doc.userId === "object" && "name" in doc.userId ? (doc.userId as unknown as IUser).name : "Team Member"),
    userEmail: user?.email || (typeof doc.userId === "object" && "email" in doc.userId ? (doc.userId as unknown as IUser).email : ""),
    role: doc.role || member.role,
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
      allEvents: doc.eventScope?.allEvents ?? true,
      eventIds: (doc.eventScope?.eventIds || []).map((id: unknown) => id!.toString()),
    },
    status: doc.status || member.status,
    joinedAt:
      (doc.joinedAt || member.joinedAt) instanceof Date
        ? (doc.joinedAt || member.joinedAt).toISOString()
        : new Date(doc.joinedAt || member.joinedAt).toISOString(),
    createdAt:
      (doc.createdAt || member.createdAt) instanceof Date
        ? (doc.createdAt || member.createdAt).toISOString()
        : new Date(doc.createdAt || member.createdAt).toISOString(),
    updatedAt:
      (doc.updatedAt || member.updatedAt) instanceof Date
        ? (doc.updatedAt || member.updatedAt).toISOString()
        : new Date(doc.updatedAt || member.updatedAt).toISOString(),
  };
}

export function toPendingInviteDTO(invite: IWeddingMemberInvite): PendingInviteDTO {
  const doc = invite.toObject ? invite.toObject() : invite;
  const p = doc.permissions || invite.permissions;

  return {
    id: (doc._id || invite._id).toString(),
    weddingId: (doc.weddingId || invite.weddingId).toString(),
    invitedEmail: doc.invitedEmail || invite.invitedEmail,
    role: doc.role || invite.role,
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
      allEvents: doc.eventScope?.allEvents ?? true,
      eventIds: (doc.eventScope?.eventIds || []).map((id: unknown) => id!.toString()),
    },
    status: doc.status || invite.status,
    expiresAt:
      (doc.expiresAt || invite.expiresAt) instanceof Date
        ? (doc.expiresAt || invite.expiresAt).toISOString()
        : new Date(doc.expiresAt || invite.expiresAt).toISOString(),
    invitedBy: (doc.invitedBy || invite.invitedBy).toString(),
    createdAt:
      (doc.createdAt || invite.createdAt) instanceof Date
        ? (doc.createdAt || invite.createdAt).toISOString()
        : new Date(doc.createdAt || invite.createdAt).toISOString(),
  };
}

export function toPublicInvitePreviewDTO(
  invite: IWeddingMemberInvite,
  wedding: IWedding,
  inviterUser?: IUser | null,
  isInvitedUserRegistered: boolean = false
): PublicInvitePreviewDTO {
  const isExpired = new Date(invite.expiresAt).getTime() < Date.now();

  return {
    invitedEmail: invite.invitedEmail,
    role: invite.role,
    wedding: {
      id: wedding._id.toString(),
      title: wedding.title,
      brideName: wedding.bride?.name || "",
      groomName: wedding.groom?.name || "",
    },
    invitedByName: inviterUser?.name || "Wedding Host",
    expiresAt: invite.expiresAt instanceof Date ? invite.expiresAt.toISOString() : new Date(invite.expiresAt).toISOString(),
    status: isExpired && invite.status === "PENDING" ? "EXPIRED" : invite.status,
    isExpired,
    isInvitedUserRegistered,
  };
}
