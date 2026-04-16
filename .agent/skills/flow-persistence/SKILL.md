---
name: flow-persistence
description: Ensures developer focus is maintained across AI errors and session crashes by mirroring state to local markdown logs.
---

# 🛡️ Flow Persistence Skill

This skill MUST be active during all work on the PromptAccreditation suite to mitigate the impact of resource errors and interface crashes.

## 📝 Mandatory Behaviors

### 1. Mirroring Instructions (Shadow Logging)
- **Action**: Every time the agent provides complex instructions, test steps, or critical findings, it MUST also write those exact details to `docs/LAST_OPERATION_RESULTS.md`.
- **Reason**: To ensure the developer maintains visibility of the "last good instructions" if the chat window or session fails.

### 2. State Syncing (Save Pointing)
- **Action**: Before beginning any new implementation phase or major refactor, the agent MUST update `docs/FOCUS_RECOVERY_PLAN.md` with the current status and the immediate next step.
- **Reason**: Acts as a "Save Point" that acts as a handover document between crashed sessions.

### 3. Defensive Engineering (Atomic Edits)
- **Action**: The agent should prefer editing one file at a time and verifying success before moving to the next.
- **Reason**: Minimizes context bloat which is the leading cause of resource (Out of Memory) errors.

## 🆘 Recovery Protocol
If the developer reports a crash or focus loss:
1. Immediately read `docs/FOCUS_RECOVERY_PLAN.md`.
2. Provide a one-sentence summary of the current "Save Point".
3. Point the developer to `docs/LAST_OPERATION_RESULTS.md` for the current active instructions.
