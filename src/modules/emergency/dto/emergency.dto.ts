import { IEmergencyContact, IEmergencyIssue } from "../models/emergency-contact.model";

export interface EmergencyContactDTO {
  id: string;
  weddingId: string;
  eventId?: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  priority: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicEmergencyContactDTO {
  id: string;
  eventId?: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  priority: number;
}

export interface EmergencyIssueDTO {
  id: string;
  weddingId: string;
  eventId?: string;
  title: string;
  description?: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  assignedTo?: string;
  emergencyContactId?: string;
  status: "OPEN" | "RESOLVED";
  resolutionNotes?: string;
  createdBy: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export function toEmergencyContactDTO(contact: IEmergencyContact): EmergencyContactDTO {
  return {
    id: contact._id.toString(),
    weddingId: contact.weddingId.toString(),
    eventId: contact.eventId ? contact.eventId.toString() : undefined,
    name: contact.name,
    role: contact.role,
    phone: contact.phone,
    email: contact.email,
    priority: contact.priority,
    notes: contact.notes,
    createdBy: contact.createdBy.toString(),
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export function toPublicEmergencyContactDTO(contact: IEmergencyContact): PublicEmergencyContactDTO {
  return {
    id: contact._id.toString(),
    eventId: contact.eventId ? contact.eventId.toString() : undefined,
    name: contact.name,
    role: contact.role,
    phone: contact.phone,
    email: contact.email,
    priority: contact.priority,
  };
}

export function toEmergencyIssueDTO(issue: IEmergencyIssue): EmergencyIssueDTO {
  return {
    id: issue._id.toString(),
    weddingId: issue.weddingId.toString(),
    eventId: issue.eventId ? issue.eventId.toString() : undefined,
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    assignedTo: issue.assignedTo ? issue.assignedTo.toString() : undefined,
    emergencyContactId: issue.emergencyContactId ? issue.emergencyContactId.toString() : undefined,
    status: issue.status,
    resolutionNotes: issue.resolutionNotes,
    createdBy: issue.createdBy.toString(),
    createdAt: issue.createdAt.toISOString(),
    resolvedAt: issue.resolvedAt ? issue.resolvedAt.toISOString() : undefined,
    resolvedBy: issue.resolvedBy ? issue.resolvedBy.toString() : undefined,
  };
}
