if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/MakeMyMarriageDB";
}
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

import { AuthService } from "../lib/services/auth.service";
import { User } from "../lib/db/models/User";
import { Session } from "../lib/db/models/Session";
import { PasswordResetToken } from "../lib/db/models/PasswordResetToken";
import { connectToDatabase } from "../lib/db/connect";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Note: These tests hit the actual configured database.
describe("AuthService Integration Tests", () => {
  beforeAll(async () => {
    process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/makemymarriage";
    try {
      await Promise.race([
        connectToDatabase(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 800)),
      ]);
    } catch {
      console.warn("MongoDB not available; integration tests will be skipped.");
    }
  }, 10000);

  afterAll(async () => {
    // Cleanup test data if connected
    if (User.db.readyState === 1) {
      await User.deleteMany({ email: /@test\.com$/ });
      await Session.deleteMany({});
      await PasswordResetToken.deleteMany({});
    }
  });

  const testEmail = `testuser_${Date.now()}@test.com`;
  let testUserId: string;

  it("should sign up a new user", async () => {
    if (User.db.readyState !== 1) return;
    const result = await AuthService.signUp("Test User", testEmail, "securepassword123");
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user).toBeDefined();
      expect(result.user.name).toBe("Test User");
      expect(result.user.email).toBe(testEmail);
      testUserId = result.user.id;
    }
  });

  it("should fail signup with duplicate email", async () => {
    if (User.db.readyState !== 1) return;
    const result = await AuthService.signUp("Another User", testEmail, "securepassword123");
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("EMAIL_ALREADY_EXISTS");
    }
  });

  it("should fail login with wrong password", async () => {
    if (User.db.readyState !== 1) return;
    const result = await AuthService.login(testEmail, "wrongpassword");
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("INVALID_CREDENTIALS");
    }
  });

  it("should login with correct password", async () => {
    if (User.db.readyState !== 1) return;
    const result = await AuthService.login(testEmail, "securepassword123");
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.id).toBe(testUserId);
    }
  });

  it("should generate a reset token and sanitize outbox payloads", async () => {
    if (User.db.readyState !== 1) return; // Skip if offline DB

    const user = await User.findOne({ email: testEmail });
    expect(user).toBeTruthy();

    await AuthService.forgotPassword(testEmail);

    const tokens = await PasswordResetToken.find({ userId: user!._id });
    expect(tokens.length).toBeGreaterThanOrEqual(1);

    const { EmailJob } = await import("../lib/db/models/EmailJob");
    const emailJob = await EmailJob.findOne({ to: testEmail, type: "PASSWORD_RESET" });
    expect(emailJob).toBeTruthy();
    if (emailJob) {
      expect(emailJob.templateData.tokenHash).toBeDefined();
      expect(emailJob.templateData.rawToken).toBeUndefined();
      expect(emailJob.templateData.resetUrl).toBeUndefined();
    }
  });

  it("should prioritize APP_ORIGIN when generating reset URLs (RECOVERY-P1-01)", async () => {
    if (User.db.readyState !== 1) return;

    const { EmailService } = await import("../lib/services/email.service");
    const spy = vi.spyOn(EmailService, "enqueuePasswordResetEmail");

    vi.stubEnv("APP_ORIGIN", "https://app.makemymarriage.com/");
    delete process.env.NEXT_PUBLIC_APP_URL;

    await AuthService.forgotPassword(testEmail);

    expect(spy).toHaveBeenCalled();
    const callArg = spy.mock.calls[spy.mock.calls.length - 1][0];
    expect(callArg.resetUrl).toContain("https://app.makemymarriage.com/reset-password?token=");

    vi.unstubAllEnvs();
    spy.mockRestore();
  });

  it("should reject password reset with invalid or short password", async () => {
    if (User.db.readyState !== 1) return;

    const shortResult = await AuthService.resetPassword("invalid_token", "short");
    expect(shortResult.success).toBe(false);
    expect(shortResult.code).toBe("VALIDATION_ERROR");

    const invalidTokenResult = await AuthService.resetPassword("invalid_raw_token_xyz", "newsecurepassword123");
    expect(invalidTokenResult.success).toBe(false);
    expect(invalidTokenResult.code).toBe("RESET_TOKEN_INVALID");
  });

  it("should perform single-use reset, invalidate outstanding tokens, revoke sessions, and update credentials", async () => {
    if (User.db.readyState !== 1) return;

    const user = await User.findOne({ email: testEmail });
    expect(user).toBeTruthy();

    const crypto = await import("crypto");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Create 2 reset tokens (simulating multiple requests)
    await PasswordResetToken.create({
      userId: user!._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 3600000),
    });

    const secondRawToken = crypto.randomBytes(32).toString("hex");
    const secondTokenHash = crypto.createHash("sha256").update(secondRawToken).digest("hex");
    await PasswordResetToken.create({
      userId: user!._id,
      tokenHash: secondTokenHash,
      expiresAt: new Date(Date.now() + 3600000),
    });

    // Create an active session
    await Session.create({
      userId: user!._id,
      tokenHash: "sample_active_session_hash",
      expiresAt: new Date(Date.now() + 3600000),
    });

    // Perform successful reset using first token
    const resetResult = await AuthService.resetPassword(rawToken, "brandnewpassword123");
    expect(resetResult.success).toBe(true);

    // Verify token reuse fails (single-use)
    const reuseResult = await AuthService.resetPassword(rawToken, "brandnewpassword123");
    expect(reuseResult.success).toBe(false);
    expect(reuseResult.code).toBe("RESET_TOKEN_INVALID");

    // Verify outstanding second token was invalidated
    const secondTokenResult = await AuthService.resetPassword(secondRawToken, "anotherpassword123");
    expect(secondTokenResult.success).toBe(false);
    expect(secondTokenResult.code).toBe("RESET_TOKEN_INVALID");

    // Verify sessions were revoked
    const activeSessions = await Session.find({ userId: user!._id });
    expect(activeSessions.length).toBe(0);

    // Verify old credentials fail login
    const oldLogin = await AuthService.login(testEmail, "securepassword123");
    expect(oldLogin.success).toBe(false);

    // Verify new credentials succeed login
    const newLogin = await AuthService.login(testEmail, "brandnewpassword123");
    expect(newLogin.success).toBe(true);
  });
});
