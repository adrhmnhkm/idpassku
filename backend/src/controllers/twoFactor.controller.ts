import { Response } from "express";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { prisma } from "../utils/prisma";
import { AuthRequest } from "../middlewares/auth";

// Setup 2FA: Generate secret and QR code
export const setupTwoFactor = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const secret = speakeasy.generateSecret({
            name: `Indo-Vault (${req.user?.email})`,
        });

        if (!secret.base32) {
            return res.status(500).json({ message: "Failed to generate secret" });
        }

        // Save secret temporarily (or permanently but disabled)
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 },
        });

        // Generate QR Code
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl,
        });
    } catch (error) {
        console.error("2FA Setup Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Verify 2FA: Enable 2FA if token is correct
export const verifyTwoFactor = async (req: AuthRequest, res: Response) => {
    try {
        const { token } = req.body;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ message: "2FA not set up" });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token: token,
        });

        if (verified) {
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: true },
            });
            res.json({ message: "2FA enabled successfully" });
        } else {
            res.status(400).json({ message: "Invalid token" });
        }
    } catch (error) {
        console.error("2FA Verify Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
