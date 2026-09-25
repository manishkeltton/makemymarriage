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

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export class EmailService {
  /**
   * Enqueues a team invitation email job in MongoDB outbox and attempts dispatch.
   */
  static async enqueueTeamInviteEmail(params: SendTeamInviteEmailParams): Promise<boolean> {
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

    // Await delivery so serverless runtimes cannot stop it after the response.
    return await this.processPendingEmailJob(job._id.toString());
  }

  /**
   * Processes a single pending email job.
   */
  static async processPendingEmailJob(jobId: string): Promise<boolean> {
    await connectToDatabase();

    const job = await EmailJob.findOneAndUpdate(
      { _id: jobId, status: "PENDING" },
      { $set: { status: "PROCESSING", lockedAt: new Date(), lastAttemptAt: new Date() }, $inc: { attempts: 1 } },
      { new: true },
    );
    if (!job) return false;

    try {
      // If RESEND_API_KEY environment variable is present, send email via Resend API
      const resendApiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL?.trim();
      if (!resendApiKey?.trim() || !from) {
        throw new Error("Email delivery requires RESEND_API_KEY and RESEND_FROM_EMAIL");
      }
      {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(15000),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from,
            to: [job.to],
            subject: `You've been invited to join ${escapeHtml(job.templateData.weddingTitle)} on MakeMyMarriage`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; rounded: 8px;">
                <h2 style="color: #762b3a;">MakeMyMarriage Invitation</h2>
                <p>Hello,</p>
                <p><strong>${escapeHtml(job.templateData.invitedByName)}</strong> has invited you to join the wedding workspace <strong>“${escapeHtml(job.templateData.weddingTitle)}”</strong> as a <strong>${escapeHtml(job.templateData.role)}</strong>.</p>
                <p>Click the link below to review and accept your invitation:</p>
                <div style="margin: 24px 0;">
                  <a href="${escapeHtml(job.templateData.inviteUrl)}" style="background-color: #762b3a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
                </div>
                <p style="color: #666; font-size: 12px;">This invitation will expire on ${new Date(job.templateData.expiresAt as string).toLocaleDateString()}.</p>
              </div>
            `,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (typeof resData.id !== "string" || !resData.id) throw new Error("Resend returned no message ID");
          job.status = "SENT";
          job.sentAt = new Date();
          job.providerMessageId = resData.id;
          await job.save();
          return true;
        } else {
          throw new Error(`Resend rejected email (HTTP ${response.status}); check the Resend dashboard and verified sender domain`);
        }
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
