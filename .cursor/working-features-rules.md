# Working Features Preservation Rules

## ⚠️ CRITICAL: DO NOT MODIFY THESE WORKING FEATURES

This document defines rules to preserve features that are currently working correctly. 
Any changes to these features must be carefully reviewed and tested.

---

## 🔐 Extension Autofill Feature

### Current Working Implementation
- **Location**: `extension/content.js` and `extension/background.js`
- **Status**: ✅ WORKING - Do not modify without extensive testing

### Critical Components to Preserve

#### 1. Login Status Check Before Capture
```javascript
// MUST REMAIN: Check if user is logged in before capturing credentials
async function isUserLoggedIn() {
    const result = await chrome.storage.local.get(['token', 'user']);
    return !!(result.token && result.user);
}
```
- **Rule**: Extension MUST check login status before:
  - Capturing credentials from forms
  - Attempting autofill
  - Checking pending credentials
- **Why**: Prevents extension from working when user is not logged in

#### 2. URL Encryption in Vault Items
- **Location**: `frontend/src/lib/crypto.ts`, `extension/background.js`
- **Payload Structure**: MUST include `url` field in encrypted payload
```typescript
{
  password: string,
  note: string,
  url: string  // REQUIRED for autofill domain matching
}
```
- **Rule**: 
  - Frontend Add/Edit item forms MUST include URL field
  - Extension save MUST include `url: window.location.href` in payload
  - Backend stores only ciphertext (URL is encrypted, not plaintext)

#### 3. Domain Matching for Autofill
- **Location**: `extension/background.js` - `decryptLoginItemsForDomain()`
- **Rule**: 
  - Decrypt vault items and extract `url` from payload
  - Match domain using `normalizeDomain()` function
  - Only return credentials where domain matches current page
- **DO NOT**: Change domain matching logic without testing across multiple websites

#### 4. Autofill Prompt UI
- **Location**: `extension/content.js` - `showAutofillPrompt()`
- **Rule**: 
  - MUST show prompt before autofilling (user consent)
  - MUST support multiple credentials selection if multiple matches
  - MUST use Shadow DOM for isolation
  - MUST handle SPA navigation (URL changes)

---

## 💾 Credential Capture Feature

### Current Working Implementation
- **Location**: `extension/content.js` - `captureCredentials()`
- **Status**: ✅ WORKING - Do not modify without extensive testing

### Critical Rules

#### 1. Login Check Before Capture
```javascript
// MUST REMAIN: Check login before capturing
const loggedIn = await isUserLoggedIn();
if (!loggedIn) {
    console.log("Indo-Vault: User not logged in, skipping credential capture");
    return;
}
```
- **Rule**: NEVER capture credentials if user is not logged in
- **Why**: Prevents unnecessary data collection and popups

#### 2. Form Detection Logic
- **Location**: `findUsernameField()` function
- **Rule**: 
  - MUST handle try-catch properly (fixed syntax error)
  - MUST filter visible inputs only
  - MUST prioritize email type, then keyword matching, then nearest text input
- **DO NOT**: Change detection priorities without testing on multiple websites

#### 3. Save Confirmation Prompt
- **Location**: `extension/content.js` - `showSaveConfirmation()`
- **Rule**: 
  - MUST only show if user is logged in
  - MUST use Shadow DOM
  - MUST handle SPA navigation (MutationObserver)
  - MUST include "Save" and "Never" buttons

---

## 🔒 2FA Disable Feature

### Current Working Implementation
- **Location**: 
  - Backend: `backend/src/modules/auth/auth.controller.ts` - `disableTwoFactor()`
  - Frontend: `frontend/src/components/two-factor-setup.tsx`
- **Status**: ✅ WORKING - Do not modify without extensive testing

### Critical Rules

#### 1. Database Update Logic
- **Rule**: MUST use raw SQL update to ensure database is updated:
```typescript
await prisma.$executeRaw`
  UPDATE "User" 
  SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL 
  WHERE id = ${userId}
`;
```
- **Why**: Prisma update sometimes doesn't persist, raw SQL ensures update happens
- **DO NOT**: Remove raw SQL fallback without extensive testing

#### 2. Verification After Update
- **Rule**: MUST verify update with raw SQL query:
```typescript
const verifyUser = await prisma.$queryRaw`
  SELECT "twoFactorEnabled", "twoFactorSecret" 
  FROM "User" 
  WHERE id = ${userId}
`;
```
- **Why**: Ensures update actually happened in database

#### 3. Login Handler 2FA Check
- **Location**: `backend/src/modules/auth/auth.controller.ts` - `loginHandler()`
- **Rule**: 
  - MUST check `user.twoFactorEnabled && user.twoFactorSecret` (both must be true)
  - MUST log 2FA status for debugging
  - MUST handle case where `twoFactorEnabled=true` but `twoFactorSecret=null` (auto-disable)

#### 4. Frontend Status Display
- **Location**: `frontend/src/components/two-factor-setup.tsx`
- **Rule**: 
  - MUST fetch status from `/auth/me` endpoint
  - MUST show current status (Aktif/Nonaktif)
  - MUST refresh status after disable
  - MUST disable buttons appropriately based on status

---

## 🔑 Extension Authentication Flow

### Current Working Implementation
- **Location**: `extension/popup.js`, `extension/background.js`
- **Status**: ✅ WORKING - Do not modify without extensive testing

### Critical Rules

#### 1. Token Management
- **Rule**: 
  - MUST store `token`, `encryptionKey`, `user`, `tokenExpiry`, `refreshToken` in `chrome.storage.local`
  - MUST validate token expiry before API calls
  - MUST refresh token if expiring soon (within 5 minutes)
  - MUST invalidate token on 401 errors

#### 2. Encryption Key Derivation
- **Location**: `extension/crypto.js` - `deriveKey()`
- **Rule**: 
  - MUST use same fixed salt as frontend (for MVP consistency)
  - MUST export key as JWK for storage
  - MUST import key from JWK when needed
- **DO NOT**: Change salt or key derivation without updating both frontend and extension

#### 3. Vault Sync
- **Location**: `extension/background.js` - `syncVaultItems()`
- **Rule**: 
  - MUST sync vault items after login
  - MUST store ciphertext items in `chrome.storage.local`
  - MUST clear decrypted cache on sync
  - MUST handle sync errors gracefully

---

## 🛡️ Security Rules (MUST PRESERVE)

### Zero-Knowledge Architecture
- **Rule**: 
  - Backend NEVER sees plaintext passwords, URLs, or notes
  - All sensitive data MUST be encrypted client-side before sending to backend
  - Master key MUST only exist in memory (sessionStorage for web, memory for extension)
  - Ciphertext stored in backend is safe (already encrypted)

### Content Script Isolation
- **Location**: `extension/content.js`
- **Rule**: 
  - MUST wrap all code in IIFE: `(function() { 'use strict'; ... })()`
  - MUST use try-catch for all functions
  - MUST check `chrome.runtime` availability
  - MUST use Shadow DOM for UI injection
- **Why**: Prevents conflicts with page scripts and other extensions

### Error Handling
- **Rule**: 
  - ALL async functions MUST have try-catch
  - ALL chrome API calls MUST handle errors
  - Console errors MUST be logged with "Indo-Vault:" prefix
  - User-facing errors MUST be user-friendly

---

## 📋 Database Schema Rules

### VaultItem Model
- **Rule**: 
  - `name` and `username` are plaintext metadata (for search/display)
  - `ciphertext` contains encrypted JSON: `{password, note, url}`
  - Backend NEVER decrypts ciphertext
  - URL is stored INSIDE ciphertext (encrypted), not as separate field

### User Model
- **Rule**: 
  - `twoFactorEnabled` and `twoFactorSecret` MUST be kept in sync
  - If `twoFactorEnabled=false`, `twoFactorSecret` SHOULD be `null`
  - Migration MUST include `encryptedVaultKey`, `backupVaultKey`, `recoveryKeyHash` fields

---

## 🧪 Testing Requirements Before Changes

### Before Modifying Any Working Feature:

1. **Test Extension Autofill**:
   - Login to extension
   - Create vault item with URL via dashboard
   - Visit matching website
   - Verify autofill prompt appears
   - Verify autofill works correctly

2. **Test Credential Capture**:
   - Login to extension
   - Visit website with login form
   - Submit form with credentials
   - Verify "Save to Indo-Vault?" prompt appears
   - Verify save works correctly

3. **Test 2FA Disable**:
   - Enable 2FA
   - Disable 2FA via dashboard
   - Verify status shows "Nonaktif"
   - Logout and login again
   - Verify NO 2FA prompt appears

4. **Test Login Status Check**:
   - Without logging in, visit website
   - Submit login form
   - Verify NO capture happens
   - Verify NO popup appears
   - Login to extension
   - Verify capture works after login

---

## 🚫 DO NOT MODIFY WITHOUT APPROVAL

The following code sections are CRITICAL and must not be modified without:
1. Extensive testing
2. Understanding the full impact
3. Approval from project maintainer

### Protected Code Sections:
- `extension/content.js`: `isUserLoggedIn()`, `captureCredentials()`, `requestAutofill()`
- `extension/background.js`: `decryptLoginItemsForDomain()`, `syncVaultItems()`, `normalizeDomain()`
- `backend/src/modules/auth/auth.controller.ts`: `disableTwoFactor()`, `loginHandler()` 2FA check
- `frontend/src/lib/crypto.ts`: `createVaultItemPayload()` (must include URL)
- `frontend/src/components/two-factor-setup.tsx`: Status check and disable logic

---

## 📝 Change Log Requirements

When modifying any working feature:
1. Document what was changed
2. Document why it was changed
3. Document test results
4. Update this file if behavior changes

---

## ✅ Current Working Features Checklist

- [x] Extension autofill with domain matching
- [x] Credential capture with login check
- [x] 2FA disable functionality
- [x] URL encryption in vault items
- [x] Extension login status verification
- [x] Vault sync after login
- [x] Autofill prompt UI
- [x] Save confirmation prompt
- [x] Content script isolation (IIFE, error handling)
- [x] Database migration for zero-knowledge fields

---

**Last Updated**: 2024-12-03
**Maintained By**: Development Team
**Status**: All features working correctly - PRESERVE THESE IMPLEMENTATIONS

