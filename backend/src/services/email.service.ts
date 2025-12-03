import nodemailer from 'nodemailer';

// Create a transporter using Ethereal (for development)
// In production, use environment variables for SMTP config
let transporter: nodemailer.Transporter;

async function createTransporter() {
  if (transporter) return transporter;

  // Check for SMTP environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("Email Transporter created using SMTP config");
    return transporter;
  }

  // Fallback to Ethereal for development
  console.log("SMTP config not found, falling back to Ethereal...");
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("Email Transporter created with Ethereal account:", testAccount.user);
  return transporter;
}

export async function sendVerificationEmail(to: string, token: string) {
  const client = await createTransporter();
  const verificationLink = `http://localhost:3000/verify-email?token=${token}`;

  // Use SMTP_SENDER if available, otherwise SMTP_USER, otherwise fallback
  const senderEmail = process.env.SMTP_SENDER || process.env.SMTP_USER || 'security@indo-vault.com';
  const sender = `"Indo-Vault Security" <${senderEmail}>`;

  const info = await client.sendMail({
    from: sender,
    to: to,
    subject: "Verify your Indo-Vault Account",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to Indo-Vault!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy this link: ${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  });

  console.log("Verification email sent: %s", info.messageId);
  if (!process.env.SMTP_HOST) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
  return info;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const client = await createTransporter();
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  // Use SMTP_SENDER if available, otherwise SMTP_USER, otherwise fallback
  const senderEmail = process.env.SMTP_SENDER || process.env.SMTP_USER || 'security@indo-vault.com';
  const sender = `"Indo-Vault Security" <${senderEmail}>`;

  const info = await client.sendMail({
    from: sender,
    to: to,
    subject: "Reset your Password",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or copy this link: ${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });

  console.log("Reset password email sent: %s", info.messageId);
  if (!process.env.SMTP_HOST) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
  return info;
}
