-- Direct SQL to disable 2FA for a user
-- Replace 'YOUR_USER_ID' with actual user ID from logs
-- Or use email: UPDATE "User" SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL WHERE email = 'your-email@example.com';

UPDATE "User" 
SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL 
WHERE id = 'cmijvgruo000cbm5tsy8w9s2e';

-- Verify
SELECT id, email, "twoFactorEnabled", "twoFactorSecret" IS NOT NULL as has_secret
FROM "User" 
WHERE id = 'cmijvgruo000cbm5tsy8w9s2e';

