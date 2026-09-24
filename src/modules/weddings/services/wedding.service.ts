import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { IGeneralLocation } from "../models/wedding.model";
import { WeddingRepository, UpdateWeddingParams } from "../repositories/wedding.repository";
import { WeddingMemberRepository } from "../repositories/wedding-member.repository";
import { WeddingDTO, WeddingMemberDTO, toWeddingDTO, toWeddingMemberDTO } from "../dto/wedding.dto";

import { EventRepository } from "@/modules/events/repositories/event.repository";
import { toEventDTO, EventDTO } from "@/modules/events/dto/event.dto";

export interface CreateWeddingDTO {
  title: string;
  bride: {
    name: string;
  };
  groom: {
    name: string;
  };
  primaryWeddingDate: string | Date;
  generalLocation?: IGeneralLocation;
  preferredLanguage?: "en" | "hi";
}

export interface DashboardSummaryDTO {
  wedding: {
    id: string;
    title: string;
    brideName: string;
    groomName: string;
    primaryWeddingDate: string;
    daysRemaining: number;
    location?: string;
    status: string;
  };
  userRole: "ADMIN" | "MANAGER" | "ORGANISER";
  nextEvent?: EventDTO | null;
  stats: {
    totalEvents: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalGuests: number;
    attendingGuests: number;
    totalTeamMembers: number;
  };
}

export class WeddingService {
  /**
   * Calculates UTC-safe days remaining until target date.
   */
  public static calculateDaysRemaining(targetDate: Date, currentDate: Date = new Date()): number {
    const targetUTC = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
    const currentUTC = Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate());
    const diffMs = targetUTC - currentUTC;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Creates a new Wedding workspace and assigns creator as ADMIN within a MongoDB transaction.
   */
  static async createWedding(
    userId: string,
    dto: CreateWeddingDTO
  ): Promise<{ success: boolean; wedding?: WeddingDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID", code: "INVALID_USER_ID" };
    }

    const primaryWeddingDate = new Date(dto.primaryWeddingDate);
    if (isNaN(primaryWeddingDate.getTime())) {
      return { success: false, error: "Invalid primary wedding date", code: "INVALID_DATE" };
    }

    const userObjectId = new Types.ObjectId(userId);

    let mongoSession: mongoose.ClientSession | null = null;
    try {
      mongoSession = await mongoose.startSession();
      let createdWedding: WeddingDTO | null = null;

      // Wrap in MongoDB transaction for atomicity
      await mongoSession.withTransaction(async () => {
        const weddingDoc = await WeddingRepository.create(
          {
            title: dto.title,
            bride: dto.bride,
            groom: dto.groom,
            primaryWeddingDate,
            generalLocation: dto.generalLocation,
            preferredLanguage: dto.preferredLanguage || "en",
            createdBy: userObjectId,
          },
          mongoSession!
        );

        await WeddingMemberRepository.create(
          {
            weddingId: weddingDoc._id,
            userId: userObjectId,
            role: "ADMIN",
            status: "ACTIVE",
          },
          mongoSession!
        );

        createdWedding = toWeddingDTO(weddingDoc);
      });

      return { success: true, wedding: createdWedding! };
    } catch (err: unknown) {
      console.error("Error creating wedding workspace (transaction error, trying fallback):", err);
      // Fallback for standalone MongoDB mode without replica set
      try {
        const weddingDoc = await WeddingRepository.create({
          title: dto.title,
          bride: dto.bride,
          groom: dto.groom,
          primaryWeddingDate,
          generalLocation: dto.generalLocation,
          preferredLanguage: dto.preferredLanguage || "en",
          createdBy: userObjectId,
        });

        await WeddingMemberRepository.create({
          weddingId: weddingDoc._id,
          userId: userObjectId,
          role: "ADMIN",
          status: "ACTIVE",
        });

        return { success: true, wedding: toWeddingDTO(weddingDoc) };
      } catch (fallbackErr: unknown) {
        console.error("Fallback creation failed:", fallbackErr);
        const errMsg = fallbackErr instanceof Error ? fallbackErr.message : "Failed to create wedding workspace";
        return { success: false, error: errMsg, code: "INTERNAL_ERROR" };
      }
    } finally {
      if (mongoSession) {
        mongoSession.endSession();
      }
    }
  }

  /**
   * Returns all active weddings for the given user, formatted with DTOs.
   */
  static async getUserWeddings(
    userId: string
  ): Promise<{ success: boolean; weddings?: Array<{ wedding: WeddingDTO; role: string }>; error?: string }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID" };
    }

    try {
      const activeMemberships = await WeddingMemberRepository.findActiveUserMemberships(userId);
      const result = activeMemberships.map((item) => ({
        wedding: toWeddingDTO(item.wedding),
        role: item.member.role,
      }));

      return { success: true, weddings: result };
    } catch (err: unknown) {
      console.error("Error fetching user weddings:", err);
      return { success: false, error: "Failed to fetch user weddings" };
    }
  }

  /**
   * Gets details of a single wedding if user is an active member.
   */
  static async getWeddingById(
    weddingId: string,
    userId: string
  ): Promise<{
    success: boolean;
    data?: { wedding: WeddingDTO; member: WeddingMemberDTO };
    error?: string;
    code?: string;
  }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid ID format", code: "INVALID_ID" };
    }

    try {
      const memberDoc = await WeddingMemberRepository.findMember(weddingId, userId);
      if (!memberDoc) {
        return { success: false, error: "Access denied or wedding not found", code: "FORBIDDEN" };
      }

      const weddingDoc = await WeddingRepository.findById(weddingId);
      if (!weddingDoc) {
        return { success: false, error: "Wedding not found", code: "NOT_FOUND" };
      }

      return {
        success: true,
        data: {
          wedding: toWeddingDTO(weddingDoc),
          member: toWeddingMemberDTO(memberDoc),
        },
      };
    } catch (err: unknown) {
      console.error("Error fetching wedding by ID:", err);
      return { success: false, error: "Internal server error", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Updates wedding details if the user is an ADMIN.
   */
  static async updateWedding(
    weddingId: string,
    userId: string,
    updateParams: UpdateWeddingParams
  ): Promise<{ success: boolean; wedding?: WeddingDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid ID format", code: "INVALID_ID" };
    }

    try {
      const memberDoc = await WeddingMemberRepository.findMember(weddingId, userId);
      if (!memberDoc || memberDoc.role !== "ADMIN") {
        return { success: false, error: "Only wedding ADMIN can update details", code: "FORBIDDEN" };
      }

      const updatedWeddingDoc = await WeddingRepository.updateById(weddingId, updateParams);
      if (!updatedWeddingDoc) {
        return { success: false, error: "Wedding not found", code: "NOT_FOUND" };
      }

      return { success: true, wedding: toWeddingDTO(updatedWeddingDoc) };
    } catch (err: unknown) {
      console.error("Error updating wedding:", err);
      return { success: false, error: "Internal server error", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Computes dashboard summary metrics safely.
   */
  static async getDashboardSummary(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: DashboardSummaryDTO; error?: string; code?: string }> {
    const access = await this.getWeddingById(weddingId, userId);
    if (!access.success || !access.data) {
      return { success: false, error: access.error, code: access.code };
    }

    const { wedding, member } = access.data;

    const daysRemaining = this.calculateDaysRemaining(new Date(wedding.primaryWeddingDate));
    const totalTeamMembers = await WeddingMemberRepository.countActiveMembers(weddingId);

    const allEvents = await EventRepository.findEventsByWeddingId({ weddingId });
    const totalEvents = allEvents.length;
    const nextEventDoc = await EventRepository.findNextUpcomingEvent({ weddingId });
    const nextEvent = nextEventDoc ? toEventDTO(nextEventDoc) : null;

    return {
      success: true,
      data: {
        wedding: {
          id: wedding.id,
          title: wedding.title,
          brideName: wedding.bride.name,
          groomName: wedding.groom.name,
          primaryWeddingDate: wedding.primaryWeddingDate,
          daysRemaining,
          location: wedding.generalLocation?.city || wedding.generalLocation?.name || undefined,
          status: wedding.status,
        },
        userRole: member.role,
        nextEvent,
        stats: {
          totalEvents,
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          totalGuests: 0,
          attendingGuests: 0,
          totalTeamMembers,
        },
      },
    };
  }
}
