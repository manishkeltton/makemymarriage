import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmailService } from "../lib/services/email.service";
import { EmailJob } from "../lib/db/models/EmailJob";
vi.mock("../lib/db/connect", () => ({ connectToDatabase: vi.fn() }));
vi.mock("../lib/db/models/EmailJob", () => ({ EmailJob: { findOneAndUpdate: vi.fn() } }));
describe("invitation email delivery", () => {
  let job: any;
  beforeEach(() => {
    job = { to: "guest@example.com", templateData: { weddingTitle: "<img src=x>", inviteUrl: "https://example.com/invite/token" }, save: vi.fn(), status: "PROCESSING" };
    vi.mocked(EmailJob.findOneAndUpdate).mockResolvedValue(job);
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("RESEND_FROM_EMAIL", "invites@example.com");
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("records missing configuration as failed without sending", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(await EmailService.processPendingEmailJob("job")).toBe(false);
    expect(job.status).toBe("FAILED");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("records a provider rejection as failed", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("Forbidden", { status: 403 }));
    expect(await EmailService.processPendingEmailJob("job")).toBe(false);
    expect(job.status).toBe("FAILED");
    expect(job.sentAt).toBeUndefined();
  });
  it("records network failures", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("timeout"));
    expect(await EmailService.processPendingEmailJob("job")).toBe(false);
    expect(job.status).toBe("FAILED");
  });
  it("records provider acceptance and escapes user supplied HTML", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ id: "message-id" }));
    expect(await EmailService.processPendingEmailJob("job")).toBe(true);
    expect(job.providerMessageId).toBe("message-id");
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body.html).toContain("&lt;img src=x&gt;");
    expect(job.status).toBe("SENT");
  });
  it("does not send a job already claimed by another dispatcher", async () => {
    vi.mocked(EmailJob.findOneAndUpdate).mockResolvedValue(null);
    expect(await EmailService.processPendingEmailJob("job")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});
