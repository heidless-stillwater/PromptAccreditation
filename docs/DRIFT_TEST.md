# Sovereign Sentinel: Drift Testing & Manual Verification

This document outlines the protocol for manual verification of the **Sovereign Sentinel** hardening across the Stillwater App Suite. These tests validate the real-time technical gating (GATT) and UI-lock mechanisms when a compliance breach is detected in the central registry.

## 1. Environment Baseline (Green)
Verify that the satellites are correctly communicating with the `PromptAccreditation` hub and that access is unrestricted.

- **Endpoint**: `http://localhost:3002/api/compliance/sovereign` (PromptResources)
- **Check**: Run the following command:
  ```bash
  curl -s http://localhost:3002/api/compliance/sovereign
  ```
- **Expectation**: `{"success":true,"gated":false,...}`
- **UI**: Navigate to `http://localhost:3002`. The app should load and function normally.

---

## 2. Triggering a Compliance Drift (Red)
Simulate a critical legislative breach (Online Safety Act) by updating the status in the central registry.

### Execution Command
Run this from the `/PromptAccreditation` root directory:

```bash
npx tsx scripts/toggle-compliance.ts red
```

### Verification
1. **Satellite API**: Run the `curl` command again. It should return `gated: true` with a descriptive breach message.
2. **UI Lock**: Refresh `http://localhost:3002`. A full-screen **Sovereign Lock** overlay should be active, blocking all access.
3. **Action Gating**: Attempt to perform a restricted action (e.g., adding an asset). The API should return `403 Forbidden` with the GATT message.

---

## 3. Remediation & Recovery (Green)
Restore the system to a compliant state to verify self-healing recovery.

### Execution Command
Run this from the `/PromptAccreditation` root directory:

```bash
npx tsx scripts/toggle-compliance.ts green
```

### Verification
- **UI**: Refresh `http://localhost:3002`. The Sovereign Lock should be removed automatically.
- **API**: The compliance endpoint should return `gated: false`.

---

## Technical Appendix: GATT Implementation
- **Controller**: `PromptAccreditation` (Registry Authority)
- **Enforcement**: `ComplianceService.ts` in satellite libs.
- **Telemetry**: `useSovereignStatus` hook (polling every 30s).
- **Physical Lock**: `SovereignLock.tsx` (Root-level z-index interceptor).
