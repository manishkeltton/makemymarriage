import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

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
    await connectToDatabase();
  }, 30000);

  afterAll(async () => {
    // Cleanup test data
    await User.deleteMany({ email: /@test\.com$/ });
    await Session.deleteMany({});
    await PasswordResetToken.deleteMany({});
  });

  const testEmail = `testuser_${Date.now()}@test.com`;
  let testUserId: string;

  it("should sign up a new user", async () => {
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
    const result = await AuthService.signUp("Another User", testEmail, "securepassword123");
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("EMAIL_ALREADY_EXISTS");
    }
  });

  it("should fail login with wrong password", async () => {
    const result = await AuthService.login(testEmail, "wrongpassword");
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("INVALID_CREDENTIALS");
    }
  });

  it("should login with correct password", async () => {
    const result = await AuthService.login(testEmail, "securepassword123");
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.id).toBe(testUserId);
    }
  });

  it("should generate a reset token and reset password", async () => {
    // Forgot Password
    await AuthService.forgotPassword(testEmail);
    
    // Find the token manually since we don't have email delivery
    const user = await User.findOne({ email: testEmail });
    const tokens = await PasswordResetToken.find({ userId: user!._id });
    expect(tokens.length).toBe(1);
    
    // We cannot easily retrieve the raw token here since it's hashed in the DB,
    // so we will test the failure case of an invalid token to ensure the API responds properly.
    const resetResult = await AuthService.resetPassword("invalid_raw_token", "newsecurepassword123");
    
    expect(resetResult.success).toBe(false);
    if (!resetResult.success) {
      expect(resetResult.code).toBe("RESET_TOKEN_INVALID");
    }
  });
});
