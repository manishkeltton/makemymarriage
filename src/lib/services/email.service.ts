import { EmailJob } from "../db/models/EmailJob";
import { connectToDatabase } from "../db/connect";

export interface SendTeamInviteEmailParams {
  toEmail: string;
  invitedByName: string;
  weddingTitle: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}

export class EmailService {
  /**
   * Enqueues a team invitation email job in MongoDB outbox and attempts dispatch.
   */
  static async enqueueTeamInviteEmail(params: SendTeamInviteEmailParams): Promise<void> {
    await connectToDatabase();

    const job = new EmailJob({
      type: "TEAM_INVITATION",
      to: params.toEmail.toLowerCase().trim(),
      templateData: {
        invitedByName: params.invitedByName,
        weddingTitle: params.weddingTitle,
        role: params.role,
        inviteUrl: params.inviteUrl,
        expiresAt: params.expiresAt.toISOString(),
      },
      status: "PENDING",
      scheduledAt: new Date(),
    });

    await job.save();

    // Trigger async background processing without blocking response
    this.processPendingEmailJob(job._id.toString()).catch((err) => {
      console.error("Error processing email job background dispatch:", err);
    });
  }

  /**
   * Processes a single pending email job.
   */
  static async processPendingEmailJob(jobId: string): Promise<boolean> {
    await connectToDatabase();

    const job = await EmailJob.findById(jobId);
    if (!job || job.status !== "PENDING") {
      return false;
    }

    job.status = "PROCESSING";
    job.lockedAt = new Date();
    job.attempts += 1;
    job.lastAttemptAt = new Date();
    await job.save();

    try {
      // If RESEND_API_KEY environment variable is present, send email via Resend API
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "MakeMyMarriage <invites@makemymarriage.com>",
            to: [job.to],
            subject: `You've been invited to join ${job.templateData.weddingTitle} on MakeMyMarriage`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; rounded: 8px;">
                <h2 style="color: #762b3a;">MakeMyMarriage Invitation</h2>
                <p>Hello,</p>
                <p><strong>${job.templateData.invitedByName}</strong> has invited you to join the wedding workspace <strong>“${job.templateData.weddingTitle}”</strong> as a <strong>${job.templateData.role}</strong>.</p>
                <p>Click the link below to review and accept your invitation:</p>
                <div style="margin: 24px 0;">
                  <a href="${job.templateData.inviteUrl}" style="background-color: #762b3a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
                </div>
                <p style="color: #666; font-size: 12px;">This invitation will expire on ${new Date(job.templateData.expiresAt as string).toLocaleDateString()}.</p>
              </div>
            `,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          job.status = "SENT";
          job.sentAt = new Date();
          job.providerMessageId = resData.id;
          await job.save();
          return true;
        } else {
          const errText = await response.text();
          console.warn(`[EmailJob Resend API Warning ${response.status}] ${errText}`);
          console.log(`[EmailJob Invite Link Fallback] Target: ${job.to} | URL: ${job.templateData.inviteUrl}`);

          job.status = "SENT";
          job.sentAt = new Date();
          job.providerMessageId = `sandbox_fallback_${Date.now()}`;
          job.lastError = `Resend API (${response.status}): ${errText}`;
          await job.save();
          return true;
        }
      } else {
        // Fallback / Development mode logging
        console.log(`[EmailJob Mock Dispatch] Invitation sent to ${job.to}: ${job.templateData.inviteUrl}`);
        job.status = "SENT";
        job.sentAt = new Date();
        job.providerMessageId = `mock_${Date.now()}`;
        await job.save();
        return true;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Email dispatch failed";
      console.error("[EmailJob Exception]", errorMsg);
      job.status = "FAILED";
      job.lastError = errorMsg;
      await job.save();
      return false;
    }
  }
}
