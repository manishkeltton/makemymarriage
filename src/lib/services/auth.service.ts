import { User, IUser } from "../db/models/User";
import { Session } from "../db/models/Session";
import { connectToDatabase } from "../db/connect";
import bcrypt from "bcrypt";
import { 
  hashToken, 
  generateSessionToken, 
  setSessionCookie, 
  clearSessionCookie, 
  SESSION_MAX_AGE_MS 
} from "../auth/session";

export type AuthResult = 
  | {
      success: true;
      user: {
        id: string;
        name: string;
        email: string;
        preferredLanguage?: "en" | "hi";
      };
    }
  | {
      success: false;
      error: string;
      code: string;
    };

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  preferredLanguage: "en" | "hi";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export function toUserProfileDTO(user: IUser): UserProfileDTO {
  const u = user.toObject ? user.toObject() : user;
  const createdAt = (u.createdAt || user.createdAt) instanceof Date
    ? (u.createdAt || user.createdAt).toISOString()
    : new Date(u.createdAt || user.createdAt).toISOString();
  const updatedAt = (u.updatedAt || user.updatedAt) instanceof Date
    ? (u.updatedAt || user.updatedAt).toISOString()
    : new Date(u.updatedAt || user.updatedAt).toISOString();

  return {
    id: (u._id || user._id).toString(),
    name: u.name,
    email: u.email,
    preferredLanguage: u.preferredLanguage || "en",
    status: u.status || "ACTIVE",
    createdAt,
    updatedAt,
  };
}

export class AuthService {
  /**
   * Registers a new user and logs them in.
   */
  static async signUp(name: string, email: string, passwordPlain: string): Promise<AuthResult> {
    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return { 
        success: false, 
        error: "Email already in use",
        code: "EMAIL_ALREADY_EXISTS"
      };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    // Create user
    let newUser;
    try {
      newUser = await User.create({
        name,
        email: normalizedEmail,
        normalizedEmail,
        passwordHash,
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
        return { 
          success: false, 
          error: "Email already in use",
          code: "EMAIL_ALREADY_EXISTS"
        };
      }
      throw err;
    }

    // Create session
    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    
    await Session.create({
      userId: newUser._id,
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
    });

    // Set cookie
    await setSessionCookie(token);

    return {
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        preferredLanguage: newUser.preferredLanguage || "en",
      }
    };
  }

  /**
   * Validates credentials and creates a session.
   */
  static async login(email: string, passwordPlain: string): Promise<AuthResult> {
    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return { 
        success: false, 
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS"
      };
    }

    if (user.status === "SUSPENDED") {
      return {
        success: false,
        error: "Account suspended or missing",
        code: "ACCOUNT_SUSPENDED",
      };
    }

    // Check password
    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      return { 
        success: false, 
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS" 
      };
    }

    // Create session
    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    
    await Session.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
    });

    // Set cookie
    await setSessionCookie(token);

    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage || "en",
      }
    };
  }

  /**
   * Revokes a session and clears the cookie.
   */
  static async logout(token: string): Promise<void> {
    await connectToDatabase();
    
    if (token) {
      const tokenHash = hashToken(token);
      await Session.deleteOne({ tokenHash });
    }
    
    await clearSessionCookie();
  }

  /**
   * Verifies the current session token and returns the User if valid.
   */
  static async verifySession(token: string): Promise<AuthResult> {
    await connectToDatabase();

    if (!token) {
      return { success: false, code: "AUTH_REQUIRED", error: "Not authenticated" };
    }

    const tokenHash = hashToken(token);
    const session = await Session.findOne({ tokenHash }).populate("userId");

    if (!session || session.expiresAt < new Date()) {
      return { success: false, code: "SESSION_EXPIRED", error: "Session expired" };
    }

    const user = session.userId as unknown as IUser;

    if (!user || user.status === "SUSPENDED") {
      return { success: false, code: "ACCOUNT_SUSPENDED", error: "Account suspended or missing" };
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage || "en",
      }
    };
  }

  /**
   * Gets user profile for an authenticated user.
   */
  static async getProfile(userId: string): Promise<UserProfileDTO | null> {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user || user.status === "SUSPENDED") {
      return null;
    }

    return toUserProfileDTO(user);
  }

  /**
   * Updates user profile name and/or preferredLanguage.
   */
  static async updateProfile(
    userId: string,
    input: { name?: string; preferredLanguage?: "en" | "hi" }
  ): Promise<UserProfileDTO | null> {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user || user.status === "SUSPENDED") {
      return null;
    }

    const updates: Partial<{ name: string; preferredLanguage: "en" | "hi" }> = {};

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        throw new Error("Name must be between 2 and 100 characters long");
      }
      updates.name = trimmedName;
    }

    if (input.preferredLanguage !== undefined) {
      if (input.preferredLanguage !== "en" && input.preferredLanguage !== "hi") {
        throw new Error("Preferred language must be 'en' or 'hi'");
      }
      updates.preferredLanguage = input.preferredLanguage;
    }

    if (Object.keys(updates).length === 0) {
      return toUserProfileDTO(user);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return null;
    }

    return toUserProfileDTO(updatedUser);
  }

  /**
   * Generates a password reset token, persists hash, and dispatches reset email.
   */
  static async forgotPassword(email: string): Promise<void> {
    await connectToDatabase();
    
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    // Always return silently even if user doesn't exist
    if (!user) {
      return;
    }

    const crypto = await import("crypto");
    const { PasswordResetToken } = await import("../db/models/PasswordResetToken");
    const { EmailService } = await import("./email.service");

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiry

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    const baseUrl =
      process.env.APP_ORIGIN?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

    try {
      await EmailService.enqueuePasswordResetEmail({
        toEmail: user.email,
        userName: user.name,
        resetUrl,
        tokenHash,
        expiresAt,
      });
    } catch (err) {
      console.error("[AuthService.forgotPassword] Delivery dispatch exception:", err);
    }
  }

  /**
   * Resets the password using a valid token, invalidates outstanding tokens, and revokes sessions.
   */
  static async resetPassword(token: string, passwordPlain: string): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    if (!passwordPlain || passwordPlain.length < 8 || passwordPlain.length > 100) {
      return {
        success: false,
        error: "Password must be between 8 and 100 characters long",
        code: "VALIDATION_ERROR",
      };
    }

    const crypto = await import("crypto");
    const { PasswordResetToken } = await import("../db/models/PasswordResetToken");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Atomic single-use consumption under concurrent requests
    const resetToken = await PasswordResetToken.findOneAndUpdate(
      {
        tokenHash,
        usedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      },
      {
        $set: { usedAt: new Date() },
      },
      { new: true }
    );

    if (!resetToken) {
      return { success: false, error: "Invalid or expired reset token", code: "RESET_TOKEN_INVALID" };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    await User.updateOne({ _id: resetToken.userId }, { passwordHash });

    // Invalidate all remaining outstanding reset tokens for this user
    await PasswordResetToken.updateMany(
      { userId: resetToken.userId, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } }
    );

    // Revoke all existing active sessions for this user
    await Session.deleteMany({ userId: resetToken.userId });

    return { success: true };
  }
}
