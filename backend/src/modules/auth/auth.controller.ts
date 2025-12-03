import { Request, Response } from 'express';
import argon2 from 'argon2';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { prisma } from '../../utils/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AuthRequest } from '../../middlewares/auth';

function generateSalt(bytes = 16) {
  return crypto.randomBytes(bytes).toString('base64');
}

import { sendVerificationEmail, sendPasswordResetEmail } from '../../services/email.service';

export async function registerHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await argon2.hash(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const kdfSalt = generateSalt();
    const kdfParams = {
      algorithm: 'argon2id',
      memory: 65536,
      iterations: 3,
      parallelism: 1,
    };

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        kdfSalt,
        kdfParams,
        verificationToken,
        isVerified: false, // Explicitly false
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError: any) {
      // Rollback: Delete the user if email sending fails
      await prisma.user.delete({ where: { id: user.id } });
      console.error("Email sending failed, user deleted:", emailError);
      throw new Error(`Failed to send verification email: ${emailError.message}`);
    }

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: { id: user.id, email: user.email },
    });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return res.status(500).json({
      message: 'Registration failed',
      error: err.message || 'Internal server error'
    });
  }
}

export async function verifyEmailHandler(req: Request, res: Response) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return res.status(400).json({ message: 'Invalid token' });

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If your email is registered, you will receive a reset link.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken, resetPasswordExpires: expires },
    });

    await sendPasswordResetEmail(email, resetToken);

    return res.json({ message: 'If your email is registered, you will receive a reset link.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password required' });

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const passwordHash = await argon2.hash(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        isVerified: true, // Auto-verify since they proved email ownership via reset link
      },
    });

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first.' });
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2FA Check - only require 2FA if explicitly enabled AND secret exists
    // Debug logging
    console.log(`[Login] User ${user.id} - twoFactorEnabled: ${user.twoFactorEnabled}, hasSecret: ${!!user.twoFactorSecret}`);
    
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const { twoFactorToken } = req.body;
      if (!twoFactorToken) {
        console.log(`[Login] User ${user.id} - 2FA required but no token provided`);
        return res.status(202).json({ requireTwoFactor: true, message: '2FA token required' });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
      });

      if (!verified) {
        console.log(`[Login] User ${user.id} - Invalid 2FA token`);
        return res.status(401).json({ message: 'Invalid 2FA token' });
      }
      
      console.log(`[Login] User ${user.id} - 2FA verified successfully`);
    } else if (user.twoFactorEnabled && !user.twoFactorSecret) {
      // Safety check: if 2FA is enabled but secret is missing, disable 2FA automatically
      console.warn(`[Login] User ${user.id} has twoFactorEnabled=true but no secret. Auto-disabling 2FA.`);
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: false },
      });
      // Continue with login without 2FA
    } else {
      console.log(`[Login] User ${user.id} - 2FA not enabled, proceeding without 2FA`);
    }

    const accessToken = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id, user.email);
    const refreshHash = await argon2.hash(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt,
      },
    });

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    });
  } catch (err: any) {
    console.error('Login Error:', err);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    let matchedToken = null;
    for (const t of tokens) {
      const ok = await argon2.verify(t.tokenHash, refreshToken);
      if (ok) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      return res.status(401).json({ message: 'Refresh token not recognized' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccess = signAccessToken(user.id, user.email);

    return res.json({ accessToken: newAccess });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    const tokens = await prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    for (const t of tokens) {
      const ok = await argon2.verify(t.tokenHash, refreshToken);
      if (ok) {
        await prisma.refreshToken.update({
          where: { id: t.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function meHandler(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Fetch user to get 2FA status
  const user = await prisma.user.findUnique({ 
    where: { id: req.user.id },
    select: { 
      id: true, 
      email: true, 
      twoFactorEnabled: true 
    }
  });
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  return res.json({ 
    id: user.id, 
    email: user.email,
    twoFactorEnabled: user.twoFactorEnabled || false
  });
}

export async function setupTwoFactor(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const secret = speakeasy.generateSecret({
      name: `Indo-Vault (${req.user?.email})`,
    });

    if (!secret.base32) {
      return res.status(500).json({ message: 'Failed to generate secret' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });
  } catch (error) {
    console.error('2FA Setup Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function verifyTwoFactor(req: AuthRequest, res: Response) {
  try {
    const { token } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
    });

    if (verified) {
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });
      res.json({ message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('2FA Verify Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Disable 2FA for the current user.
// For development convenience we only require a valid session (access token).
// In production, consider requiring the user's password or a fresh 2FA token.
export async function disableTwoFactor(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[Disable 2FA] User ${userId} - Current status: twoFactorEnabled=${user.twoFactorEnabled}, hasSecret=${!!user.twoFactorSecret}`);

    // If 2FA is already disabled, just return success
    if (!user.twoFactorEnabled) {
      console.log(`[Disable 2FA] User ${userId} - Already disabled`);
      return res.json({ message: '2FA is already disabled' });
    }

    // Use raw SQL to ensure update happens directly in database
    // This bypasses any potential Prisma caching or transaction issues
    try {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL 
        WHERE id = ${userId}
      `;
      console.log(`[Disable 2FA] Raw SQL update executed for user ${userId}`);
    } catch (rawError) {
      console.error(`[Disable 2FA] Raw SQL update failed, trying Prisma update:`, rawError);
      // Fallback to Prisma update
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });
    }

    // Verify the update by fetching fresh data directly from database
    const verifyUser = await prisma.$queryRaw`
      SELECT "twoFactorEnabled", "twoFactorSecret" 
      FROM "User" 
      WHERE id = ${userId}
    ` as any[];
    
    if (verifyUser && verifyUser.length > 0) {
      const dbUser = verifyUser[0];
      const isEnabled = dbUser.twoFactorEnabled === true || dbUser.twoFactorEnabled === 'true';
      const hasSecret = !!dbUser.twoFactorSecret;
      
      console.log(`[Disable 2FA] Raw DB Verification - User ${userId} - twoFactorEnabled: ${dbUser.twoFactorEnabled} (${typeof dbUser.twoFactorEnabled}), hasSecret: ${hasSecret}`);
      
      if (isEnabled) {
        console.error(`[Disable 2FA] ERROR: Update verification failed! Database still shows twoFactorEnabled=true for user ${userId}`);
        // Force update one more time
        await prisma.$executeRawUnsafe(
          `UPDATE "User" SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL WHERE id = $1`,
          userId
        );
        console.log(`[Disable 2FA] Force update attempted with executeRawUnsafe for user ${userId}`);
      } else {
        console.log(`[Disable 2FA] SUCCESS: Verified that 2FA is disabled for user ${userId}`);
      }
    }

    return res.json({ 
      message: '2FA disabled successfully',
      twoFactorEnabled: false // Explicitly return the new status
    });
  } catch (error: any) {
    console.error('[Disable 2FA] Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


