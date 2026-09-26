import { Types } from "mongoose";
import { EmergencyContactRepository } from "../repositories/emergency.repository";
import { EmergencyContactDTO, PublicEmergencyContactDTO, toEmergencyContactDTO, toPublicEmergencyContactDTO } from "../dto/emergency.dto";
import { CreateEmergencyContactInput, UpdateEmergencyContactInput } from "../validation/emergency.validation";
import { AppError } from "@/shared/errors/app-error";

export class EmergencyService {
  static async createContact(
    weddingId: string,
    createdBy: string,
    input: CreateEmergencyContactInput
  ): Promise<EmergencyContactDTO> {
    const contact = await EmergencyContactRepository.create({
      weddingId: new Types.ObjectId(weddingId),
      eventId: input.eventId ? new Types.ObjectId(input.eventId) : undefined,
      name: input.name,
      role: input.role,
      phone: input.phone,
      email: input.email,
      priority: input.priority,
      notes: input.notes,
      createdBy: new Types.ObjectId(createdBy),
    });

    return toEmergencyContactDTO(contact);
  }

  static async getContacts(weddingId: string, eventId?: string): Promise<EmergencyContactDTO[]> {
    const contacts = await EmergencyContactRepository.findByWedding(weddingId, { eventId });
    return contacts.map(toEmergencyContactDTO);
  }

  static async getPublicContacts(weddingId: string, eventId?: string): Promise<PublicEmergencyContactDTO[]> {
    const contacts = await EmergencyContactRepository.findByWedding(weddingId, { eventId });
    return contacts.map(toPublicEmergencyContactDTO);
  }

  static async updateContact(
    weddingId: string,
    contactId: string,
    input: UpdateEmergencyContactInput
  ): Promise<EmergencyContactDTO> {
    const contact = await EmergencyContactRepository.findById(contactId);
    if (!contact || contact.weddingId.toString() !== weddingId) {
      throw new AppError("RESOURCE_NOT_FOUND", "Emergency contact not found in this wedding", 404);
    }

    const updated = await EmergencyContactRepository.update(contactId, {
      name: input.name,
      role: input.role,
      phone: input.phone,
      email: input.email,
      eventId: input.eventId ? new Types.ObjectId(input.eventId) : input.eventId === "" ? null : undefined,
      priority: input.priority,
      notes: input.notes,
    });

    if (!updated) {
      throw new AppError("INTERNAL_ERROR", "Failed to update emergency contact", 500);
    }

    return toEmergencyContactDTO(updated);
  }

  static async deleteContact(weddingId: string, contactId: string): Promise<boolean> {
    const contact = await EmergencyContactRepository.findById(contactId);
    if (!contact || contact.weddingId.toString() !== weddingId) {
      throw new AppError("RESOURCE_NOT_FOUND", "Emergency contact not found in this wedding", 404);
    }

    return EmergencyContactRepository.delete(contactId);
  }
}
