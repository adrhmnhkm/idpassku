-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "encryptedVaultKey" TEXT,
ADD COLUMN IF NOT EXISTS "backupVaultKey" TEXT,
ADD COLUMN IF NOT EXISTS "recoveryKeyHash" TEXT;

