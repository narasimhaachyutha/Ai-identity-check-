# Security Specification: Veridoxa AI Border Screening

## 1. Data Invariants
- A verification record must belong to the authenticated immigration officer (`inspectorId == request.auth.uid`).
- The document ID path variable must be a valid sanitized identifier (`isValidId(id)`).
- Users can only read and query their own verification logs unless they are an authorized supervisor/admin.
- User profile records can only be created by the authenticated owner (`request.auth.uid == userId`).
- Users cannot elevate their own role (`incoming().role == existing().role`).
- Immutability of core audit fields: `createdAt`, `inspectorId`, and `id` cannot be modified once written.
- String boundaries and lengths must strictly follow the `firebase-blueprint.json` definitions.

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated Read**: Anonymous user attempts `get /verifications/{id}` -> Expect PERMISSION_DENIED.
2. **Unauthenticated List**: Anonymous user attempts `list /verifications` -> Expect PERMISSION_DENIED.
3. **Inspector Impersonation on Create**: User A creates record with `inspectorId = "user_B"` -> Expect PERMISSION_DENIED.
4. **Cross-Inspector Read**: User A attempts to `get /verifications/{docOfUserB}` -> Expect PERMISSION_DENIED.
5. **Cross-Inspector Query Scrape**: User A queries `/verifications` without matching `inspectorId == request.auth.uid` -> Expect PERMISSION_DENIED.
6. **Malicious Giant ID (Denial of Wallet)**: Attacker attempts to create `/verifications/{100KB_string}` -> Expect PERMISSION_DENIED via `isValidId()`.
7. **Ghost Field Injection (Shadow Update)**: Attacker updates verification with unapproved ghost fields like `bypassAudit: true` -> Expect PERMISSION_DENIED.
8. **Tampering with Audit Timestamps**: Attacker updates `createdAt` on an existing record -> Expect PERMISSION_DENIED.
9. **Inspector ID Mutation**: Attacker attempts to transfer record ownership during update -> Expect PERMISSION_DENIED.
10. **Self-Assigned Admin Role on Profile Create**: User creates profile with `role = "admin"` -> Expect PERMISSION_DENIED / Restricted role validation.
11. **Privilege Escalation on Profile Update**: Standard officer updates profile to `role: "admin"` -> Expect PERMISSION_DENIED.
12. **Foreign User Profile Modification**: User A attempts to edit User B's `/users/{userB}` document -> Expect PERMISSION_DENIED.
