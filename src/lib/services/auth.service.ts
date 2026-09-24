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
      };
    }
  | {
      success: false;
      error: string;
      code: string;
    };

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

    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      }
    };
  }

  /**
   * Generates a password reset token and "sends" it.
   */
  static async forgotPassword(email: string): Promise<void> {
    await connectToDatabase();
    
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    // Always return silently even if user doesn't exist
    if (!user) {
      return;
    }

    const { PasswordResetToken } = await import("../db/models/PasswordResetToken");
    import("crypto").then(crypto => {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      
      PasswordResetToken.create({
        userId: user._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour expiry
      });

      // TODO: Actually send email with token
      console.log(`[EMAIL JOB STUB] Password reset token for ${email}: ${token}`);
    });
  }

  /**
   * Resets the password using a valid token.
   */
  static async resetPassword(token: string, passwordPlain: string): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();
    const crypto = await import("crypto");
    const { PasswordResetToken } = await import("../db/models/PasswordResetToken");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken = await PasswordResetToken.findOne({ tokenHash, usedAt: { $exists: false } });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired reset token", code: "RESET_TOKEN_INVALID" };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    await User.updateOne({ _id: resetToken.userId }, { passwordHash });
    
    resetToken.usedAt = new Date();
    await resetToken.save();

    // Revoke all existing sessions for this user
    await Session.deleteMany({ userId: resetToken.userId });

    return { success: true };
  }
}
