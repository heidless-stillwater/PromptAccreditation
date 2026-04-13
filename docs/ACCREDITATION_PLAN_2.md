# PromptAccreditation v2.0 — Active Policy Controller
## Complete Rebuild Implementation Plan

> **Generated:** 2026-04-13  
> **Target:** Full rebuild of `~/projects/PromptAccreditation`  
> **Database:** `promptaccreditation-db-0` (NOT `(default)`)  
> **Aesthetic:** Premium Control Room — Glassmorphism, dark mode, high-density telemetry  
> **Stack:** Next.js 16 + React 19 + Tailwind CSS v4 + Firebase Admin SDK + Stripe + Gemini 1.5 Pro

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Ecosystem Integration Map](#2-ecosystem-integration-map)
3. [Phase 1 — Foundation & Infrastructure](#3-phase-1--foundation--infrastructure)
4. [Phase 2 — Policy Engine & Data Model](#4-phase-2--policy-engine--data-model)
5. [Phase 3 — Policy Management Wizard](#5-phase-3--policy-management-wizard)
6. [Phase 4 — Monitoring, Audit & Active Remediation](#6-phase-4--monitoring-audit--active-remediation)
7. [Phase 5 — Knowledge Base & Policy AI Chat](#7-phase-5--knowledge-base--policy-ai-chat)
8. [Phase 6 — SaaS, Stripe & Launch](#8-phase-6--saas-stripe--launch)
9. [Design System Specification](#9-design-system-specification)
10. [Firestore Schema](#10-firestore-schema)
11. [File & Directory Structure](#11-file--directory-structure)
12. [Verification Plan](#12-verification-plan)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PROMPT ACCREDITATION v2.0                         │
│                  "Active Policy Controller"                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─── Client Layer (React 19 Server Components) ──────────────────┐ │
│  │  Dashboard │ Policy Hub │ Wizard │ Tickets │ AI Chat │ Settings │ │
│  └─────────────────────────────────┬──────────────────────────────┘ │
│                                    │                                 │
│  ┌─── Server Layer (Next.js App Router) ──────────────────────────┐ │
│  │  Server Actions │ API Routes │ Middleware (Auth + Entitlements) │ │
│  └─────────────────────────────────┬──────────────────────────────┘ │
│                                    │                                 │
│  ┌─── Service Layer ──────────────────────────────────────────────┐ │
│  │  PolicyService │ MonitoringService │ TicketService │ KBService  │ │
│  │  RemediationService │ AuditService │ ProbeService              │ │
│  └─────────────────────────────────┬──────────────────────────────┘ │
│                                    │                                 │
│  ┌─── Integration Layer ──────────────────────────────────────────┐ │
│  │  Firebase Admin (Multi-DB) │ Stripe │ Gemini 1.5 Pro │ Crypto  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
         │              │              │              │
    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │PromptTool│  │Resources │  │ Master  │   │ Global  │
    │  DB      │  │   DB     │  │  SPA DB │   │(default)│
    │prompttool│  │promptres-│  │promptma-│   │ secrets │
    │ -db-0    │  │ources-  │  │ster-db-0│   │ & users │
    └──────────┘  │  db-0    │  └─────────┘   └─────────┘
                  └──────────┘
```

### Core Design Principles

1. **Server-First:** All data fetching and mutations happen in Server Components and Server Actions. No client-side Firestore SDK.
2. **Multi-Database Hub:** Single Firebase Admin SDK instance with named database accessors for cross-app governance.
3. **Active Controller Pattern:** This app doesn't just report — it **pushes** configuration changes to sister apps via their Firestore databases.
4. **Centralized Secrets:** All API keys fetched from `(default)` database's `system_config/global_secrets` collection with AES-256-GCM decryption.
5. **SaaS-Gated:** Premium features gated via Stripe subscription checks against the `(default)` identity store.

---

## 2. Ecosystem Integration Map

### Database Registry

| App | Database ID | Access Pattern | What Accreditation Reads/Writes |
|:---|:---|:---|:---|
| **PromptAccreditation** | `promptaccreditation-db-0` | Primary (read/write) | Policies, tickets, audit logs, KB documents, wizard state |
| **PromptTool** | `prompttool-db-0` | Cross-app (read/write) | Security headers, API config, feature flags |
| **PromptResources** | `promptresources-db-0` | Cross-app (read/write) | Age verification config, content moderation rules, storage security |
| **PromptMasterSPA** | `promptmaster-db-0` | Cross-app (read/write) | Encryption enforcement, compliance settings, admin audit |
| **Global Identity** | `(default)` | Read-only | User profiles, subscription/entitlement data, encrypted secrets |

### Existing Patterns to Preserve

| Pattern | Location | Description |
|:---|:---|:---|
| **Secret Management** | `src/lib/config-helper.ts` | `getSecret()` fetches from `(default)/system_config/global_secrets`, decrypts with AES-256-GCM, caches 5 min |
| **Crypto Module** | `src/lib/crypto.ts` | `v2:iv:authTag:content` format, uses `CONFIG_ENCRYPTION_KEY` env var |
| **Stripe Singleton** | `src/lib/stripe.ts` | Lazy-init Stripe with secret from config-helper, `apiVersion: '2024-06-20'` |
| **Firebase Admin Multi-DB** | `src/lib/firebase-admin.ts` | Single `initializeApp()`, multiple `getFirestore(app, 'db-id')` exports |
| **Auth Pattern** | PromptTool `auth-context.tsx` | Google OAuth via Firebase Auth, profile sync to `(default)/users/{uid}` |
| **Entitlement Check** | PromptTool/Resources `entitlements.ts` | `checkAppAccess(uid, app)` against `(default)` DB, checks `suiteSubscription.activeSuites[]` |
| **Design System** | `src/app/globals.css` | Tailwind v4 `@theme` tokens, glass-card utility, RAG status colors, Geist font family |

---

## 3. Phase 1 — Foundation & Infrastructure

### 3.1 Project Scaffold (Clean Rebuild)

> **IMPORTANT:** This is a full rebuild. Wipe `src/` and regenerate from scratch, preserving `.env.local`, `package.json` dependencies, and Firebase config.

#### [KEEP] Root Configuration Files
- `.env.local` — All environment variables (Firebase, Stripe, NanoBanana, encryption key)
- `package.json` — Dependencies are correct (Next.js 16, React 19, Firebase 12, Stripe 22, Tailwind 4)
- `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- `PROJECT_ECOSYSTEM.md` — Ecosystem registry

#### [REBUILD] Source Directory Structure

```
src/
├── app/
│   ├── globals.css              # Design system tokens & utilities
│   ├── layout.tsx               # Root layout with AuthProvider + Sidebar
│   ├── page.tsx                 # Command Center Dashboard
│   ├── api/
│   │   ├── auth/
│   │   │   └── session/route.ts # Cookie-based session management
│   │   ├── checkout/route.ts    # Stripe checkout session creation
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts  # Stripe webhook handler
│   │   ├── scan/route.ts        # Trigger suite-wide compliance scan
│   │   └── chat/route.ts        # Policy AI Chat (streaming)
│   ├── policies/
│   │   ├── page.tsx             # Policy Hub — grid of all policies
│   │   └── [slug]/
│   │       ├── page.tsx         # Policy Detail — definition + RAG checks + dial
│   │       └── wizard/
│   │           └── page.tsx     # Policy Implementation Wizard
│   ├── tickets/
│   │   ├── page.tsx             # Resolution Center — open tickets
│   │   └── [id]/
│   │       └── page.tsx         # Ticket Detail — diagnostics + evidence + timeline
│   ├── monitoring/
│   │   └── page.tsx             # Suite Monitoring — live telemetry view
│   ├── knowledge/
│   │   ├── page.tsx             # Knowledge Base — document browser
│   │   └── chat/
│   │       └── page.tsx         # Policy AI Chat interface
│   └── settings/
│       └── page.tsx             # Settings — subscription, preferences
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx          # Navigation sidebar with active states
│   │   ├── header.tsx           # Page header component
│   │   └── auth-guard.tsx       # Client-side auth gate
│   ├── dashboard/
│   │   ├── compliance-ring.tsx  # Animated circular compliance meter
│   │   ├── status-grid.tsx      # Live RAG status overview
│   │   ├── controller-log.tsx   # Terminal-style log console
│   │   └── suite-health.tsx     # App-by-app health cards
│   ├── policies/
│   │   ├── policy-card.tsx      # Policy grid card with RAG indicator
│   │   ├── intensity-dial.tsx   # Soft/Hard/Systemic toggle
│   │   ├── rag-badge.tsx        # Red/Amber/Green status badge
│   │   ├── check-list.tsx       # Audit check list with pass/fail
│   │   └── risk-panel.tsx       # Risk assessment display
│   ├── wizard/
│   │   ├── wizard-shell.tsx     # Multi-step wizard container
│   │   ├── step-card.tsx        # Individual wizard step
│   │   ├── evidence-uploader.tsx# Evidence upload for manual verification
│   │   └── progress-tracker.tsx # Visual step progress
│   ├── tickets/
│   │   ├── ticket-card.tsx      # Ticket summary card
│   │   ├── fix-button.tsx       # Active Fix CTA with confirmation
│   │   ├── timeline.tsx         # Ticket activity timeline
│   │   └── diagnostic-panel.tsx # Probe results display
│   ├── knowledge/
│   │   ├── chat-interface.tsx   # AI chat with streaming responses
│   │   ├── source-card.tsx      # Citation/source reference card
│   │   └── document-browser.tsx # KB document list
│   ├── shared/
│   │   ├── scan-button.tsx      # Suite scan trigger
│   │   ├── upgrade-card.tsx     # SaaS upgrade prompt
│   │   ├── loading-skeleton.tsx # Premium skeleton loaders
│   │   ├── glass-card.tsx       # Reusable glass card wrapper
│   │   └── status-dot.tsx       # Animated RAG status indicator
│   └── providers/
│       ├── auth-provider.tsx    # Firebase Auth context provider
│       └── query-provider.tsx   # React Query provider (if needed)
├── lib/
│   ├── firebase.ts              # Client-side Firebase init (Auth only)
│   ├── firebase-admin.ts        # Server-side multi-DB admin SDK
│   ├── stripe.ts                # Stripe singleton via config-helper
│   ├── config-helper.ts         # getSecret() from global_secrets
│   ├── crypto.ts                # AES-256-GCM encrypt/decrypt
│   ├── gemini.ts                # Gemini 1.5 Pro client init
│   ├── types.ts                 # All TypeScript interfaces
│   ├── constants.ts             # Policy definitions, check templates, RAG thresholds
│   ├── actions.ts               # Server Actions barrel export
│   └── services/
│       ├── policy-service.ts    # CRUD for policies, intensity updates
│       ├── ticket-service.ts    # CRUD for tickets, resolution workflows
│       ├── monitoring-service.ts# Suite-wide scanning & drift detection
│       ├── remediation-service.ts# Active Fix execution engine
│       ├── audit-service.ts     # Audit log recording
│       ├── probe-service.ts     # Individual compliance probes
│       ├── kb-service.ts        # Knowledge Base document management
│       └── entitlements.ts      # SaaS access checks
└── scripts/
    └── seed-policies.ts         # Database seeder for initial policies
```

### 3.2 Firebase Admin Multi-DB Setup

**File:** `src/lib/firebase-admin.ts`

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const adminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

const adminApp = getApps().length === 0 ? initializeApp(adminConfig) : getApps()[0];

export const adminAuth = getAuth(adminApp);

// ═══════════════════════════════════════════════════════
// DATABASE CONSTELLATION
// ═══════════════════════════════════════════════════════

/** THIS APP — Policy governance data */
export const accreditationDb = getFirestore(adminApp, 'promptaccreditation-db-0');

/** MASTER SPA — Registry & admin config */
export const masterDb = getFirestore(adminApp, 'promptmaster-db-0');

/** RESOURCES — Content library & protection config */
export const resourcesDb = getFirestore(adminApp, 'promptresources-db-0');

/** PROMPT TOOL — Prompt engineering workbench config */
export const toolDb = getFirestore(adminApp, 'prompttool-db-0');

/** GLOBAL IDENTITY — Users, subscriptions, encrypted secrets */
export const globalDb = getFirestore(adminApp);

export default adminApp;
```

### 3.3 Auth System

**Pattern:** Cookie-based session tokens (Server Component compatible).

Unlike PromptTool (which uses client-side Firebase Auth with `onAuthStateChanged`), Accreditation needs server-rendered pages with auth. The pattern:

1. **Client:** User signs in with Google via Firebase Auth (client SDK)
2. **Client → API:** POST `/api/auth/session` with the Firebase ID token
3. **API:** Verify token with `adminAuth.verifyIdToken()`, create session cookie with `adminAuth.createSessionCookie()`
4. **Middleware:** On every request, verify session cookie → inject user data into request context
5. **Server Components:** Read user from cookie → render gated content

**File:** `src/app/api/auth/session/route.ts`
```typescript
// POST: Create session cookie from Firebase ID token
// DELETE: Clear session cookie (sign out)
```

**File:** `src/middleware.ts`
```typescript
// Verify session cookie on protected routes
// Redirect to /login if unauthenticated
// Attach decoded claims to request headers for Server Components
```

**File:** `src/lib/auth.ts` (server utility)
```typescript
// getServerUser(): reads decoded claims from cookies
// requireAuth(): throws redirect if not authenticated
// requireAdmin(): throws redirect if not admin/su
```

### 3.4 Entitlement & SaaS Gating

**File:** `src/lib/services/entitlements.ts`

```typescript
export type AccreditationTier = 'free' | 'professional' | 'enterprise';

export async function getAccreditationTier(uid: string): Promise<AccreditationTier> {
  // 1. Check globalDb (default) for user document
  // 2. Read suiteSubscription.activeSuites[]
  // 3. Map 'accreditation' suite membership to tier
  // 4. Admins always get 'enterprise'
}

export const TIER_FEATURES = {
  free: {
    maxPolicies: 1,
    activeRemediation: false,
    aiChat: false,
    customProbes: false,
    auditExport: false,
  },
  professional: {
    maxPolicies: 5,
    activeRemediation: true,
    aiChat: true,
    customProbes: false,
    auditExport: true,
  },
  enterprise: {
    maxPolicies: Infinity,
    activeRemediation: true,
    aiChat: true,
    customProbes: true,
    auditExport: true,
  },
};
```

### 3.5 Secret Management & Stripe (Preserved)

Keep the existing patterns exactly:
- `config-helper.ts` → `getSecret()` from `(default)/system_config/global_secrets`
- `crypto.ts` → AES-256-GCM `v2:` format
- `stripe.ts` → Lazy singleton via `getSecret('STRIPE_SECRET_KEY')`

---

## 4. Phase 2 — Policy Engine & Data Model

### 4.1 Enhanced Type System

**File:** `src/lib/types.ts`

```typescript
// ═══════════════════════════════════════════════════════
// CORE ENUMS
// ═══════════════════════════════════════════════════════

export type PolicyStatus = 'red' | 'amber' | 'green';
export type IntensityLevel = 'soft' | 'hard' | 'systemic';
export type CheckCategory = 'automated' | 'manual' | 'hybrid';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';
export type TicketType = 'compliance_gap' | 'drift_detected' | 'manual_review' | 'incident';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Severity = 'blocker' | 'major' | 'minor' | 'cosmetic';
export type ProbeType = 'http_header' | 'db_config' | 'firestore_rule' | 'api_check' | 'manual';
export type RemediationType = 'active_fix' | 'guided_manual' | 'pending';
export type WizardStepStatus = 'locked' | 'active' | 'completed' | 'skipped';

// ═══════════════════════════════════════════════════════
// POLICY DOMAIN
// ═══════════════════════════════════════════════════════

export interface PolicyDefinition {
  /** Unique slug identifier, e.g., 'online-safety-act' */
  slug: string;
  /** Human-readable name */
  name: string;
  /** Full regulatory definition text */
  definition: string;
  /** Category: 'safety' | 'data' | 'security' */
  category: 'safety' | 'data' | 'security';
  /** Regulatory body name */
  regulatoryBody: string;
  /** Maximum known penalty */
  maxPenalty: string;
  /** Legislative reference URL */
  legislativeUrl?: string;
}

export interface Policy extends PolicyDefinition {
  id: string;
  /** Computed RAG status from checks */
  status: PolicyStatus;
  /** Current enforcement intensity */
  intensity: IntensityLevel;
  /** Checks & Balances summary text */
  checksAndBalances: string;
  /** Risks & Consequences summary text */
  risksAndConsequences: string;
  /** Ordered implementation steps for wizard */
  implementationGuide: ImplementationStep[];
  /** Audit checks attached to this policy */
  checks: AuditCheck[];
  /** Apps this policy governs */
  targetApps: string[];
  createdAt: any;
  updatedAt: any;
}

export interface ImplementationStep {
  id: string;
  order: number;
  title: string;
  description: string;
  guidance: string;
  /** Detailed step-by-step instructions (markdown) */
  instructions: string;
  /** Evidence required for compliance */
  evidenceRequired: boolean;
  /** Can this step be automated? */
  automatable: boolean;
  /** Automated probe ID if automatable */
  automatedProbeId?: string;
  /** Estimated time in minutes */
  estimatedMinutes?: number;
  /** Dependencies on other step IDs */
  dependsOn?: string[];
  /** Current status in wizard */
  status: WizardStepStatus;
}

export interface AuditCheck {
  id: string;
  title: string;
  description: string;
  status: PolicyStatus;
  category: CheckCategory;
  /** Which probe to execute */
  probeId?: string;
  /** Target app for this check */
  targetApp: string;
  /** Target database for cross-app checks */
  targetDb?: string;
  /** Evidence URL if manually verified */
  evidenceUrl?: string;
  lastChecked: any;
  nextDue?: any;
  notes?: string;
}

// ═══════════════════════════════════════════════════════
// TICKET / RESOLUTION DOMAIN
// ═══════════════════════════════════════════════════════

export interface Ticket {
  id: string;
  policyId: string;
  policySlug: string;
  checkId: string;
  status: TicketStatus;
  priority: Priority;
  severity: Severity;
  type: TicketType;
  title: string;
  description: string;
  /** Which apps are affected */
  affectedApps: string[];
  /** Remediation details */
  remediation: {
    type: RemediationType;
    /** ID of the automated fix function */
    fixId?: string;
    /** Uploaded evidence URL */
    evidenceUrl?: string;
    notes?: string;
    resolvedBy?: string;
    resolvedAt?: any;
  };
  /** Activity timeline */
  timeline: TimelineEntry[];
  /** Assigned user */
  assignee?: string;
  createdAt: any;
  updatedAt: any;
}

export interface TimelineEntry {
  timestamp: any;
  action: string;
  actor: string; // 'system' | 'controller' | user UID
  details?: string;
}

// ═══════════════════════════════════════════════════════
// MONITORING / PROBE DOMAIN
// ═══════════════════════════════════════════════════════

export interface ScanResult {
  checkId: string;
  policyId: string;
  probeId: string;
  appTarget: string;
  status: PolicyStatus;
  message: string;
  probeType: ProbeType;
  rawData?: Record<string, any>;
  executedAt: any;
}

export interface ProbeDefinition {
  id: string;
  name: string;
  description: string;
  type: ProbeType;
  /** Target database to query */
  targetDb: string;
  /** Firestore path to check */
  targetPath: string;
  /** Expected value/condition */
  expectedCondition: string;
  /** Fix function ID for active remediation */
  fixFunctionId?: string;
}

// ═══════════════════════════════════════════════════════
// KNOWLEDGE BASE DOMAIN
// ═══════════════════════════════════════════════════════

export interface KBDocument {
  id: string;
  title: string;
  /** Source legislation/guideline name */
  source: string;
  /** Category matching policy categories */
  category: 'safety' | 'data' | 'security';
  /** Full text content (for embedding/RAG) */
  content: string;
  /** Chunked text for vector search */
  chunks?: KBChunk[];
  /** Metadata */
  pageCount?: number;
  uploadedBy: string;
  uploadedAt: any;
  updatedAt: any;
}

export interface KBChunk {
  id: string;
  documentId: string;
  content: string;
  /** Page or section reference */
  pageRef?: string;
  /** Pre-computed embedding vector */
  embedding?: number[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** Source citations from KB */
  citations?: Citation[];
  timestamp: any;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  pageRef?: string;
  relevanceScore: number;
  excerpt: string;
}

// ═══════════════════════════════════════════════════════
// WIZARD STATE
// ═══════════════════════════════════════════════════════

export interface WizardState {
  policyId: string;
  userId: string;
  currentStepIndex: number;
  stepsCompleted: string[]; // step IDs
  evidenceUploaded: Record<string, string>; // stepId -> URL
  startedAt: any;
  lastActivityAt: any;
  completedAt?: any;
}

// ═══════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  targetType: 'policy' | 'ticket' | 'check' | 'config' | 'scan';
  targetId: string;
  details: Record<string, any>;
  timestamp: any;
}
```

### 4.2 Policy Definitions Constant

**File:** `src/lib/constants.ts`

This file contains the **seed data** for the three initial policies with their full definitions, checks, implementation guides, and probe configurations.

```typescript
export const INITIAL_POLICIES: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    slug: 'online-safety-act',
    name: 'Online Safety Act 2023',
    category: 'safety',
    regulatoryBody: 'Ofcom',
    maxPenalty: '£18M or 10% of global turnover',
    legislativeUrl: 'https://www.legislation.gov.uk/ukpga/2023/50',
    definition: 'The Online Safety Act 2023 places duties on services...',
    checksAndBalances: 'Age verification (AV) gateway with configurable...',
    risksAndConsequences: 'Non-compliance risks include enforcement notices...',
    status: 'red',
    intensity: 'soft',
    targetApps: ['promptresources', 'prompttool'],
    implementationGuide: [
      {
        id: 'osa-step-1',
        order: 1,
        title: 'Age Verification Strategy Selection',
        description: 'Choose your AV approach...',
        guidance: 'Ofcom recommends a risk-based approach...',
        instructions: '## Step 1: Age Verification...',
        evidenceRequired: true,
        automatable: false,
        estimatedMinutes: 30,
        status: 'active',
      },
      {
        id: 'osa-step-2',
        order: 2,
        title: 'Implement AV Gateway Component',
        description: 'Build or integrate AV into user-facing apps...',
        guidance: 'Options range from self-declaration to...',
        instructions: '## Step 2: Gateway Implementation...',
        evidenceRequired: true,
        automatable: true,
        automatedProbeId: 'probe-av-gateway',
        estimatedMinutes: 120,
        dependsOn: ['osa-step-1'],
        status: 'locked',
      },
      // ... more steps
    ],
    checks: [
      {
        id: 'osa-av-present',
        title: 'Age Verification Gateway Active',
        description: 'Verify AV gateway is present on all user-facing apps',
        status: 'red',
        category: 'automated',
        probeId: 'probe-av-gateway',
        targetApp: 'promptresources',
        targetDb: 'promptresources-db-0',
        lastChecked: null,
      },
      {
        id: 'osa-content-mod',
        title: 'Content Moderation Policy',
        description: 'Verify content moderation rules are active',
        status: 'amber',
        category: 'hybrid',
        targetApp: 'promptresources',
        lastChecked: null,
      },
      // ... more checks
    ],
  },
  // DATA PROTECTION ACT policy definition...
  // SITE SECURITY policy definition...
];

// Probe definitions for automated checks
export const PROBE_DEFINITIONS: ProbeDefinition[] = [
  {
    id: 'probe-av-gateway',
    name: 'Age Verification Gateway Check',
    description: 'Checks if AV configuration exists in target app',
    type: 'db_config',
    targetDb: 'promptresources-db-0',
    targetPath: 'system_config/protection',
    expectedCondition: 'avStrictness !== undefined && avStrictness !== "none"',
    fixFunctionId: 'fix-av-gateway',
  },
  {
    id: 'probe-encryption-enforcement',
    name: 'Encryption Enforcement Check',
    description: 'Verifies encryption is enforced in Master Registry',
    type: 'db_config',
    targetDb: 'promptmaster-db-0',
    targetPath: 'system_settings/compliance',
    expectedCondition: 'encryptionForced === true',
    fixFunctionId: 'fix-encryption',
  },
  {
    id: 'probe-https-headers',
    name: 'Security Headers Check',
    description: 'Verifies HTTPS and security headers on deployed apps',
    type: 'http_header',
    targetDb: '',
    targetPath: '',
    expectedCondition: 'strict-transport-security present',
  },
  // ... more probes
];
```

### 4.3 Policy Service (Enhanced)

**File:** `src/lib/services/policy-service.ts`

Key methods:
- `getAllPolicies()` — Fetch all policies from `accreditationDb`
- `getPolicyBySlug(slug)` — Fetch single policy
- `updatePolicyIntensity(policyId, intensity)` — Update dial + trigger cross-app enforcement
- `updateCheckStatus(policyId, checkId, status, evidence?)` — Update individual check
- `calculateAggregateStatus(checks)` → RAG aggregation logic
- `getComplianceScore()` → Overall suite compliance percentage

### 4.4 Database Seeder Script

**File:** `src/scripts/seed-policies.ts`

Executable via `npx tsx src/scripts/seed-policies.ts` to populate the initial 3 policies into `promptaccreditation-db-0`.

---

## 5. Phase 3 — Policy Management Wizard

### 5.1 Wizard Architecture

The wizard is a **multi-step guided flow** for implementing each policy. Each step can be:
- **Manual:** User follows instructions and uploads evidence
- **Automated:** System runs a probe and auto-completes if passing
- **Hybrid:** System runs probe, user confirms with evidence

#### Wizard Flow

```
┌─────────────────────────────────────────────────────┐
│                 WIZARD SHELL                         │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │ Progress Bar  │  │ Step Content Panel            │ │
│  │               │  │                                │ │
│  │ ● Step 1 ✓   │  │ Title: "Implement AV Gateway" │ │
│  │ ● Step 2 →   │  │ Instructions (markdown)        │ │
│  │ ○ Step 3     │  │ Guidance callout              │ │
│  │ ○ Step 4     │  │                                │ │
│  │ ○ Step 5     │  │ [Run Automated Check]          │ │
│  │               │  │ [Upload Evidence]              │ │
│  │               │  │ [Mark Complete]                │ │
│  │               │  │                                │ │
│  │               │  │ ┌─ Issue Detected? ──────────┐│ │
│  │               │  │ │ [Create Support Ticket]    ││ │
│  │               │  │ │ [Ask Policy AI]            ││ │
│  │               │  │ └────────────────────────────┘│ │
│  └──────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### Wizard Server Actions

**File:** `src/lib/actions.ts` (extended)

```typescript
// Wizard Actions
export async function startWizard(policyId: string): Promise<WizardState>
export async function completeWizardStep(policyId: string, stepId: string, evidenceUrl?: string): Promise<void>
export async function skipWizardStep(policyId: string, stepId: string, reason: string): Promise<void>
export async function runStepProbe(policyId: string, stepId: string): Promise<ScanResult>
export async function raiseWizardTicket(policyId: string, stepId: string, description: string): Promise<string>
```

### 5.2 Built-in Support Ticket System

When a wizard step reveals a compliance gap, the user can instantly create a support ticket:

1. **Auto-populated fields:** policyId, checkId, affected apps, probe results
2. **User input:** Description of the issue, severity assessment
3. **Auto-assignment:** Based on policy category and affected app
4. **Timeline:** Automatically records creation event

#### Ticket Service

**File:** `src/lib/services/ticket-service.ts`

```typescript
export const TicketService = {
  async createTicket(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>,
  async getOpenTickets(): Promise<Ticket[]>,
  async getResolvedTickets(): Promise<Ticket[]>,
  async getTicketById(id: string): Promise<Ticket | null>,
  async getTicketsByPolicy(policyId: string): Promise<Ticket[]>,
  async resolveTicket(id: string, resolution: { type: RemediationType, evidenceUrl?: string, notes?: string }): Promise<void>,
  async addTimelineEntry(ticketId: string, entry: Omit<TimelineEntry, 'timestamp'>): Promise<void>,
  async updateTicketStatus(id: string, status: TicketStatus): Promise<void>,
};
```

---

## 6. Phase 4 — Monitoring, Audit & Active Remediation

### 6.1 Probe System

The probe system is the engine that powers automated compliance checking. Each probe targets a specific database/collection and validates configuration.

**File:** `src/lib/services/probe-service.ts`

```typescript
export const ProbeService = {
  /**
   * Execute a single probe against the target database.
   * Returns a ScanResult with pass/fail status.
   */
  async executeProbe(probe: ProbeDefinition): Promise<ScanResult>,

  /**
   * Execute all probes for a given policy.
   */
  async runPolicyProbes(policyId: string): Promise<ScanResult[]>,

  /**
   * Execute ALL probes across ALL policies (suite-wide scan).
   */
  async runFullSuiteScan(): Promise<{ results: ScanResult[], ticketsRaised: number }>,
};
```

#### Probe Execution Logic

```typescript
// For db_config probes:
// 1. Get the target DB reference (masterDb, resourcesDb, toolDb, etc.)
// 2. Read the document at targetPath
// 3. Evaluate expectedCondition against document data
// 4. Return green/red ScanResult

// For http_header probes:
// 1. Make a HEAD request to the target app's URL
// 2. Check for expected headers (HSTS, CSP, X-Frame-Options, etc.)
// 3. Return pass/fail

// For firestore_rule probes:
// 1. Read the Firestore security rules via Admin API
// 2. Check for required rule patterns
// 3. Return compliance status
```

### 6.2 Active Remediation Engine

When a probe finds a non-compliant configuration, the Active Fix engine can **push corrections** to the sister app's Firestore.

**File:** `src/lib/services/remediation-service.ts`

```typescript
export const RemediationService = {
  /**
   * Execute a remediation action for a given ticket.
   * Maps fixFunctionId to actual Firestore write operations.
   */
  async executeFix(ticket: Ticket): Promise<{ success: boolean, message: string }>,
};

// ═══════════════════════════════════════════════════════
// FIX FUNCTION REGISTRY
// ═══════════════════════════════════════════════════════

const FIX_FUNCTIONS: Record<string, (ticket: Ticket) => Promise<void>> = {
  'fix-av-gateway': async (ticket) => {
    // Push AV config to PromptResources
    await resourcesDb.collection('system_config').doc('protection').set({
      avStrictness: 'standard',
      avEnabled: true,
      lastEnforcedBy: 'AccreditationController',
      enforcedAt: new Date(),
    }, { merge: true });
  },

  'fix-encryption': async (ticket) => {
    // Push encryption enforcement to Master Registry
    await masterDb.collection('system_settings').doc('compliance').set({
      encryptionForced: true,
      enforcedBy: 'AccreditationController',
      enforcedAt: new Date(),
    }, { merge: true });
  },

  'fix-security-headers': async (ticket) => {
    // Push security header config (this would need deployment support)
    // For now, update the config in the target DB
    await toolDb.collection('system_config').doc('security').set({
      strictTransportSecurity: true,
      contentSecurityPolicy: 'default-src self',
      xFrameOptions: 'DENY',
      enforcedBy: 'AccreditationController',
      enforcedAt: new Date(),
    }, { merge: true });
  },
};
```

### 6.3 Audit Service

Every action in the system is logged for compliance audit trails.

**File:** `src/lib/services/audit-service.ts`

```typescript
export const AuditService = {
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    await accreditationDb.collection('audit_log').add({
      ...entry,
      timestamp: new Date(),
    });
  },

  async getRecentLogs(limit: number = 50): Promise<AuditLogEntry[]>,
  async getLogsByTarget(targetType: string, targetId: string): Promise<AuditLogEntry[]>,
  async exportAuditTrail(startDate: Date, endDate: Date): Promise<AuditLogEntry[]>,
};
```

### 6.4 Suite Monitoring Dashboard

**Route:** `/monitoring`

Real-time telemetry view showing:
- **App-by-App Health Cards:** Each app in the Suite with its compliance status
- **Probe Results Timeline:** Recent probe executions with results
- **Drift Detection Log:** Detected configuration drifts
- **Scan Trigger:** Manual "Run Full Scan" button
- **Auto-Refresh:** Server Action polling or streaming for live updates

---

## 7. Phase 5 — Knowledge Base & Policy AI Chat

### 7.1 Knowledge Base Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE BASE PIPELINE                     │
│                                                                │
│  ┌────────────┐    ┌────────────┐    ┌────────────────────┐  │
│  │ Document   │───▶│ Chunking   │───▶│ Firestore Storage  │  │
│  │ Upload     │    │ Engine     │    │ (accreditation-db)  │  │
│  │ (PDF/MD)   │    │ (~2000     │    │ kb_documents/       │  │
│  │            │    │  tokens    │    │ kb_chunks/          │  │
│  └────────────┘    │  per chunk)│    └────────┬───────────┘  │
│                    └────────────┘             │               │
│                                               │               │
│  ┌────────────────────────────────────────────▼────────────┐  │
│  │                    QUERY PIPELINE                        │  │
│  │                                                          │  │
│  │  User Query ──▶ Gemini Embedding ──▶ Chunk Retrieval    │  │
│  │                                     (top-K similarity)   │  │
│  │              ──▶ Context Assembly ──▶ Gemini 1.5 Pro    │  │
│  │                                     (grounded answer)    │  │
│  │              ──▶ Streaming Response + Citations          │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Gemini Integration

**File:** `src/lib/gemini.ts`

```typescript
import { GoogleGenAI } from '@google/genai';
import { getSecret } from './config-helper';

let genaiInstance: GoogleGenAI | null = null;

export async function getGemini(): Promise<GoogleGenAI> {
  if (!genaiInstance) {
    const apiKey = await getSecret('GEMINI_API_KEY') || process.env.NANOBANANA_API_KEY;
    if (!apiKey) throw new Error('No Gemini API key available');
    genaiInstance = new GoogleGenAI({ apiKey });
  }
  return genaiInstance;
}

// Model references
export const MODELS = {
  /** Long-context model for RAG grounding (1M+ tokens) */
  RAG: 'gemini-1.5-pro',
  /** Fast model for embedding generation */
  EMBEDDING: 'text-embedding-004',
  /** Flash model for quick assessments */
  FLASH: 'gemini-2.0-flash',
};
```

### 7.3 KB Service

**File:** `src/lib/services/kb-service.ts`

```typescript
export const KBService = {
  /** Upload and chunk a document */
  async ingestDocument(title: string, content: string, source: string, category: string): Promise<string>,

  /** Search KB using Gemini embeddings */
  async searchChunks(query: string, category?: string, topK?: number): Promise<KBChunk[]>,

  /** RAG-grounded chat response */
  async generateAnswer(query: string, chatHistory: ChatMessage[], policyContext?: string): Promise<ReadableStream>,

  /** List all KB documents */
  async listDocuments(category?: string): Promise<KBDocument[]>,
};
```

### 7.4 Policy AI Chat

**Route:** `/knowledge/chat`

**API Route:** `src/app/api/chat/route.ts` (streaming)

The chat interface provides:
1. **Streaming responses** from Gemini 1.5 Pro
2. **Citation cards** showing source document + page reference
3. **Policy-aware context** — automatically includes relevant policy data
4. **Suggested questions** based on current compliance gaps
5. **Ticket creation** from chat — "Create a ticket for this issue"

**System Prompt Template:**
```
You are the Policy Specialist for the Prompt App Suite. You are an expert in UK 
regulatory compliance, specifically the Online Safety Act 2023, Data Protection 
Act 2018 (UK GDPR), and cybersecurity best practices.

Your answers must be grounded in the following source documents:
{retrieved_chunks}

Current compliance state:
{policy_status_summary}

Open tickets: {open_tickets_count}

When answering:
1. Always cite specific sections of legislation
2. Provide actionable remediation steps
3. Flag any critical compliance gaps
4. Suggest whether an automated fix is available
```

---

## 8. Phase 6 — SaaS, Stripe & Launch

### 8.1 Stripe Integration

**Existing keys in `.env.local`:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — pk_test_51SRwq9...
- `STRIPE_SECRET_KEY` — sk_test_51SRwq9...
- `STRIPE_WEBHOOK_SECRET` — whsec_94d2662c...

**Products to Create in Stripe Dashboard:**

| Product | Price | Features |
|:---|:---|:---|
| **Accreditation Free** | £0/mo | 1 policy, monitoring only, no AI |
| **Accreditation Professional** | £29/mo | 5 policies, active remediation, AI chat, audit export |
| **Accreditation Enterprise** | £99/mo | Unlimited policies, custom probes, priority support, API access |

### 8.2 Checkout Flow

**File:** `src/app/api/checkout/route.ts`

```typescript
// 1. Receive tier selection from client
// 2. Create Stripe Checkout Session
//    - success_url: /settings?checkout=success
//    - cancel_url: /settings?checkout=cancelled
//    - metadata: { uid, tier, app: 'accreditation' }
// 3. Return session URL
```

### 8.3 Webhook Handler

**File:** `src/app/api/webhooks/stripe/route.ts`

```typescript
// Handle events:
// - checkout.session.completed → Activate subscription
//   → Update globalDb (default) users/{uid}/suiteSubscription.activeSuites[] += 'accreditation'
//   → Update accreditationDb users/{uid} with tier
// - customer.subscription.updated → Update tier
// - customer.subscription.deleted → Downgrade to free
// - invoice.payment_failed → Flag in UI

// CRITICAL: Write to (default) DB for cross-app entitlement sync
```

### 8.4 Upgrade Card Component

**File:** `src/components/shared/upgrade-card.tsx`

Shows current tier, feature comparison, and upgrade CTA. Displayed on dashboard for free-tier users.

---

## 9. Design System Specification

### 9.1 "Premium Control Room" Aesthetic

The design should evoke a **mission control / command center** feel with:
- Deep black backgrounds with subtle blue ambient glow
- Glassmorphism cards with blur + transparency
- Monospaced telemetry readouts
- RAG status indicators with glow effects
- Smooth micro-animations on state changes
- High information density but clear hierarchy

### 9.2 CSS Design Tokens

**File:** `src/app/globals.css`

```css
@import "tailwindcss";

@theme {
  /* ═══ Color Palette ═══ */
  --color-primary: #3b82f6;
  --color-primary-hover: #60a5fa;
  --color-primary-dim: #1e40af;
  --color-success: #10b981;
  --color-success-dim: #047857;
  --color-warning: #f59e0b;
  --color-warning-dim: #b45309;
  --color-danger: #ef4444;
  --color-danger-dim: #b91c1c;

  /* ═══ Surfaces ═══ */
  --color-background: #07080a;
  --color-surface: #0d0f12;
  --color-card: rgba(255, 255, 255, 0.025);
  --color-card-hover: rgba(255, 255, 255, 0.05);
  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-hover: rgba(255, 255, 255, 0.15);

  /* ═══ Typography ═══ */
  --font-sans: 'Inter', var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), 'JetBrains Mono', monospace;
  
  /* ═══ Spacing Scale ═══ */
  --radius-card: 16px;
  --radius-button: 10px;
  --radius-badge: 6px;
}

:root {
  --foreground: #e1e7ef;
  --secondary: #8b95a5;
  --muted: #4a5568;
  --status-red: #ef4444;
  --status-amber: #f59e0b;
  --status-green: #10b981;
  --glow-primary: rgba(59, 130, 246, 0.15);
  --glow-success: rgba(16, 185, 129, 0.15);
  --glow-danger: rgba(239, 68, 68, 0.15);
}

body {
  background: var(--color-background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* ═══ Premium Utility Classes ═══ */
@layer utilities {
  /* Glass Cards */
  .glass-card {
    @apply bg-card backdrop-blur-xl border border-border rounded-2xl;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .glass-card:hover {
    background: var(--color-card-hover);
    border-color: var(--color-border-hover);
  }

  /* Text Gradients */
  .text-gradient {
    @apply bg-clip-text text-transparent;
    background-image: linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.4) 100%);
  }
  .text-gradient-primary {
    @apply bg-clip-text text-transparent;
    background-image: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #818cf8 100%);
  }

  /* RAG Status Dots (animated glow) */
  .status-dot { @apply w-2.5 h-2.5 rounded-full relative; }
  .status-dot::after {
    content: '';
    @apply absolute inset-0 rounded-full animate-ping opacity-30;
    background: inherit;
  }
  .status-red { 
    background: var(--status-red); 
    box-shadow: 0 0 12px var(--status-red), 0 0 4px var(--status-red); 
  }
  .status-amber { 
    background: var(--status-amber); 
    box-shadow: 0 0 12px var(--status-amber), 0 0 4px var(--status-amber); 
  }
  .status-green { 
    background: var(--status-green); 
    box-shadow: 0 0 12px var(--status-green), 0 0 4px var(--status-green); 
  }

  /* Ambient Glow Effects */
  .glow-primary { box-shadow: 0 0 60px -15px var(--glow-primary); }
  .glow-success { box-shadow: 0 0 60px -15px var(--glow-success); }
  .glow-danger  { box-shadow: 0 0 60px -15px var(--glow-danger); }

  /* Terminal Console */
  .console-panel {
    @apply bg-black/50 border border-white/5 rounded-xl overflow-hidden;
    font-family: var(--font-mono);
  }

  /* Compliance Ring */
  .compliance-ring {
    @apply relative inline-flex items-center justify-center;
  }

  /* Intensity Dial */
  .dial-segment {
    @apply px-4 py-2 text-xs font-bold uppercase tracking-widest cursor-pointer transition-all;
  }
  .dial-segment.active {
    @apply bg-primary/20 text-primary border-primary/40;
  }

  /* Button Variants */
  .btn-primary {
    @apply px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold
           rounded-xl transition-all duration-200 shadow-lg shadow-primary/20
           hover:shadow-primary/40 active:scale-[0.98];
  }
  .btn-danger {
    @apply px-5 py-2.5 bg-danger/10 hover:bg-danger/20 text-danger font-semibold
           rounded-xl border border-danger/20 transition-all duration-200;
  }
  .btn-ghost {
    @apply px-5 py-2.5 bg-white/5 hover:bg-white/10 text-secondary hover:text-white
           font-semibold rounded-xl border border-white/5 transition-all duration-200;
  }
}

/* ═══ Scrollbar ═══ */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

/* ═══ Animations ═══ */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.animate-slide-in { animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
```

### 9.3 Typography

Use **Inter** (imported via `next/font/google`) for body text, **Geist Mono** for telemetry/console readouts, and **Geist Sans** as fallback.

### 9.4 Key UI Components

| Component | Description |
|:---|:---|
| **Compliance Ring** | Animated SVG donut chart showing overall % with RAG color gradient |
| **Status Grid** | 3-column grid of policy cards with glowing RAG dots |
| **Controller Log** | Terminal-style console with colored `[OK]`/`[WARN]`/`[ERR]` prefixes |
| **Suite Health Cards** | Per-app cards showing connection status + last scan time |
| **Intensity Dial** | 3-segment toggle (Soft / Hard / Systemic) with active glow |
| **Evidence Uploader** | Drag-drop zone with preview + upload to Firebase Storage |
| **Timeline** | Vertical timeline with color-coded action entries |
| **Chat Interface** | Split panel: input + streaming response + citation sidebar |

---

## 10. Firestore Schema

### Database: `promptaccreditation-db-0`

```
promptaccreditation-db-0/
├── policies/
│   ├── {policyId}/
│   │   ├── slug: string
│   │   ├── name: string
│   │   ├── definition: string
│   │   ├── checksAndBalances: string
│   │   ├── risksAndConsequences: string
│   │   ├── status: 'red' | 'amber' | 'green'
│   │   ├── intensity: 'soft' | 'hard' | 'systemic'
│   │   ├── category: string
│   │   ├── regulatoryBody: string
│   │   ├── maxPenalty: string
│   │   ├── targetApps: string[]
│   │   ├── implementationGuide: ImplementationStep[]
│   │   ├── checks: AuditCheck[]
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│
├── tickets/
│   ├── {ticketId}/
│   │   ├── policyId: string
│   │   ├── policySlug: string
│   │   ├── checkId: string
│   │   ├── status: TicketStatus
│   │   ├── priority: Priority
│   │   ├── severity: Severity
│   │   ├── type: TicketType
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── affectedApps: string[]
│   │   ├── remediation: { type, fixId?, evidenceUrl?, notes?, resolvedBy?, resolvedAt? }
│   │   ├── timeline: TimelineEntry[]
│   │   ├── assignee?: string
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│
├── wizard_states/
│   ├── {policyId}_{userId}/
│   │   ├── currentStepIndex: number
│   │   ├── stepsCompleted: string[]
│   │   ├── evidenceUploaded: { [stepId]: url }
│   │   ├── startedAt: Timestamp
│   │   ├── lastActivityAt: Timestamp
│   │   └── completedAt?: Timestamp
│
├── scan_results/
│   ├── {scanId}/
│   │   ├── checkId: string
│   │   ├── policyId: string
│   │   ├── probeId: string
│   │   ├── appTarget: string
│   │   ├── status: PolicyStatus
│   │   ├── message: string
│   │   ├── probeType: ProbeType
│   │   ├── rawData?: object
│   │   └── executedAt: Timestamp
│
├── audit_log/
│   ├── {logId}/
│   │   ├── action: string
│   │   ├── actor: string
│   │   ├── targetType: string
│   │   ├── targetId: string
│   │   ├── details: object
│   │   └── timestamp: Timestamp
│
├── kb_documents/
│   ├── {docId}/
│   │   ├── title: string
│   │   ├── source: string
│   │   ├── category: string
│   │   ├── content: string (full text)
│   │   ├── pageCount?: number
│   │   ├── uploadedBy: string
│   │   ├── uploadedAt: Timestamp
│   │   └── updatedAt: Timestamp
│
├── kb_chunks/
│   ├── {chunkId}/
│   │   ├── documentId: string
│   │   ├── content: string
│   │   ├── pageRef?: string
│   │   └── embedding?: number[] (vector)
│
├── chat_sessions/
│   ├── {userId}_{sessionId}/
│   │   ├── messages: ChatMessage[]
│   │   ├── policyContext?: string
│   │   ├── createdAt: Timestamp
│   │   └── lastMessageAt: Timestamp
│
└── users/
    ├── {userId}/
    │   ├── tier: AccreditationTier
    │   ├── wizardsCompleted: string[]
    │   ├── lastLogin: Timestamp
    │   └── preferences: object
```

---

## 11. File & Directory Structure

### Complete File Manifest

```
~/projects/PromptAccreditation/
├── .env.local                              [KEEP]
├── package.json                            [KEEP - may add @google/genai]
├── tsconfig.json                           [KEEP]
├── next.config.ts                          [KEEP]
├── postcss.config.mjs                      [KEEP]
├── eslint.config.mjs                       [KEEP]
├── PROJECT_ECOSYSTEM.md                    [KEEP]
├── docs/
│   ├── ACCREDITATION_PLAN_1.md             [KEEP - reference]
│   └── ACCREDITATION_PLAN_2.md             [THIS FILE]
│
├── src/
│   ├── middleware.ts                        [NEW] Auth middleware
│   ├── app/
│   │   ├── globals.css                     [REBUILD] Full design system
│   │   ├── layout.tsx                      [REBUILD] Root layout + providers
│   │   ├── page.tsx                        [REBUILD] Command Center Dashboard
│   │   ├── login/
│   │   │   └── page.tsx                    [NEW] Login page
│   │   ├── api/
│   │   │   ├── auth/session/route.ts       [NEW] Session cookie management
│   │   │   ├── checkout/route.ts           [REBUILD] Stripe checkout
│   │   │   ├── webhooks/stripe/route.ts    [NEW] Stripe webhook
│   │   │   ├── scan/route.ts               [NEW] Suite scan trigger
│   │   │   └── chat/route.ts               [NEW] AI chat streaming
│   │   ├── policies/
│   │   │   ├── page.tsx                    [REBUILD] Policy Hub grid
│   │   │   └── [slug]/
│   │   │       ├── page.tsx                [REBUILD] Policy detail
│   │   │       └── wizard/
│   │   │           └── page.tsx            [NEW] Implementation wizard
│   │   ├── tickets/
│   │   │   ├── page.tsx                    [REBUILD] Resolution Center
│   │   │   └── [id]/
│   │   │       └── page.tsx                [REBUILD] Ticket detail
│   │   ├── monitoring/
│   │   │   └── page.tsx                    [NEW] Suite monitoring
│   │   ├── knowledge/
│   │   │   ├── page.tsx                    [NEW] KB document browser
│   │   │   └── chat/
│   │   │       └── page.tsx                [NEW] Policy AI Chat
│   │   └── settings/
│   │       └── page.tsx                    [NEW] Subscription & prefs
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx                 [REBUILD] Enhanced nav
│   │   │   ├── header.tsx                  [NEW] Page headers
│   │   │   └── auth-guard.tsx              [NEW] Client auth gate
│   │   ├── dashboard/
│   │   │   ├── compliance-ring.tsx         [NEW] Animated compliance meter
│   │   │   ├── status-grid.tsx             [NEW] Policy status overview
│   │   │   ├── controller-log.tsx          [NEW] Terminal console
│   │   │   └── suite-health.tsx            [NEW] App health cards
│   │   ├── policies/
│   │   │   ├── policy-card.tsx             [NEW] Policy grid card
│   │   │   ├── intensity-dial.tsx          [REBUILD] Dial toggle
│   │   │   ├── rag-badge.tsx               [NEW] RAG status badge
│   │   │   ├── check-list.tsx              [NEW] Audit check list
│   │   │   └── risk-panel.tsx              [NEW] Risk assessment
│   │   ├── wizard/
│   │   │   ├── wizard-shell.tsx            [NEW] Wizard container
│   │   │   ├── step-card.tsx               [NEW] Step content
│   │   │   ├── evidence-uploader.tsx       [REBUILD] Upload widget
│   │   │   └── progress-tracker.tsx        [NEW] Step progress
│   │   ├── tickets/
│   │   │   ├── ticket-card.tsx             [NEW] Ticket card
│   │   │   ├── fix-button.tsx              [REBUILD] Fix CTA
│   │   │   ├── timeline.tsx                [NEW] Activity timeline
│   │   │   └── diagnostic-panel.tsx        [NEW] Probe results
│   │   ├── knowledge/
│   │   │   ├── chat-interface.tsx          [NEW] AI chat panel
│   │   │   ├── source-card.tsx             [NEW] Citation card
│   │   │   └── document-browser.tsx        [NEW] Doc list
│   │   ├── shared/
│   │   │   ├── scan-button.tsx             [REBUILD] Scan trigger
│   │   │   ├── upgrade-card.tsx            [REBUILD] Upgrade CTA
│   │   │   ├── loading-skeleton.tsx        [NEW] Skeleton loaders
│   │   │   ├── glass-card.tsx              [NEW] Card wrapper
│   │   │   └── status-dot.tsx              [NEW] RAG dot
│   │   └── providers/
│   │       └── auth-provider.tsx           [NEW] Auth context
│   │
│   ├── lib/
│   │   ├── firebase.ts                     [NEW] Client Firebase (auth only)
│   │   ├── firebase-admin.ts               [REBUILD] Multi-DB hub
│   │   ├── stripe.ts                       [KEEP] Stripe singleton
│   │   ├── config-helper.ts                [KEEP] Secret management
│   │   ├── crypto.ts                       [KEEP] AES-256-GCM
│   │   ├── gemini.ts                       [NEW] Gemini client
│   │   ├── auth.ts                         [NEW] Server auth utils
│   │   ├── types.ts                        [REBUILD] Full type system
│   │   ├── constants.ts                    [NEW] Policy seed data
│   │   ├── actions.ts                      [REBUILD] All server actions
│   │   └── services/
│   │       ├── policy-service.ts           [REBUILD] Enhanced CRUD
│   │       ├── ticket-service.ts           [NEW] Ticket management
│   │       ├── monitoring-service.ts       [REBUILD] Enhanced scanning
│   │       ├── remediation-service.ts      [NEW] Active fix engine
│   │       ├── audit-service.ts            [NEW] Audit logging
│   │       ├── probe-service.ts            [NEW] Compliance probes
│   │       ├── kb-service.ts               [NEW] Knowledge Base
│   │       └── entitlements.ts             [NEW] SaaS access control
│   │
│   └── scripts/
│       └── seed-policies.ts                [NEW] Database seeder
```

### Dependencies to Add

```bash
npm install @google/genai framer-motion clsx
```

Current `package.json` already has: `next@16`, `react@19`, `firebase@12`, `firebase-admin@13`, `stripe@22`, `lucide-react`, `dotenv`.

---

## 12. Verification Plan

### Phase 1 Verification
- [ ] `npm run dev` starts without errors on port 3000
- [ ] Firebase Admin connects to all 5 databases (test read from each)
- [ ] Cookie-based auth flow: login → session → protected page → logout
- [ ] `getSecret('STRIPE_SECRET_KEY')` returns decrypted value
- [ ] Middleware blocks unauthenticated access to `/policies`, `/tickets`, etc.

### Phase 2 Verification
- [ ] Seed script populates 3 initial policies into `promptaccreditation-db-0`
- [ ] Dashboard loads and displays all policies with correct RAG status
- [ ] Intensity dial toggles between Soft/Hard/Systemic
- [ ] Systemic intensity triggers cross-app writes (verify in Firebase Console)
- [ ] Compliance ring shows correct aggregate percentage

### Phase 3 Verification
- [ ] Wizard loads for each policy with correct step sequence
- [ ] Steps unlock correctly based on dependencies
- [ ] Evidence upload saves to Firebase Storage
- [ ] Completing all steps changes policy status to Green
- [ ] "Create Ticket" from wizard populates all fields correctly

### Phase 4 Verification
- [ ] "Run Full Scan" executes all probes across all sister app databases
- [ ] Failed probes auto-create tickets with correct severity
- [ ] "Active Fix" button pushes correct config to target database
- [ ] Post-fix re-scan shows Green status
- [ ] Audit log captures all actions with timestamps

### Phase 5 Verification
- [ ] KB document upload chunks text correctly
- [ ] AI Chat returns grounded answers with citations
- [ ] Streaming responses render progressively
- [ ] "Is my age-gate sufficient?" → returns answer citing OSA sections
- [ ] Policy context sidebar shows relevant policy data

### Phase 6 Verification
- [ ] Stripe checkout creates subscription
- [ ] Webhook updates user tier in both `(default)` and `accreditationDb`
- [ ] Free tier sees upgrade cards, locked AI chat
- [ ] Professional tier can access AI chat and remediation
- [ ] Cancellation webhook downgrades correctly

### Manual Verification
- [ ] Premium Control Room aesthetic: dark mode, glassmorphism, glow effects
- [ ] Responsive on mobile (sidebar collapses)
- [ ] RAG status dots animate correctly
- [ ] Terminal console shows live scan output
- [ ] All pages have proper loading states (skeletons)
- [ ] Micro-animations on card hover, button press, status change

---

## Implementation Order (for the executing model)

```
PHASE 1: Foundation (~3 hours)
├── 1.1 Clean src/ directory, preserve .env.local + configs
├── 1.2 globals.css (full design system)
├── 1.3 lib/firebase-admin.ts (multi-DB)
├── 1.4 lib/config-helper.ts + crypto.ts + stripe.ts (copy from existing)
├── 1.5 lib/types.ts (full type system)
├── 1.6 lib/firebase.ts (client auth)
├── 1.7 providers/auth-provider.tsx
├── 1.8 api/auth/session/route.ts + middleware.ts + lib/auth.ts
├── 1.9 layout.tsx + components/layout/sidebar.tsx
└── 1.10 Verify: dev server + auth flow

PHASE 2: Policy Engine (~2 hours)
├── 2.1 lib/constants.ts (policy seed data)
├── 2.2 services/policy-service.ts
├── 2.3 services/ticket-service.ts
├── 2.4 scripts/seed-policies.ts (run to populate DB)
├── 2.5 page.tsx (Command Center Dashboard)
├── 2.6 policies/page.tsx (Policy Hub)
├── 2.7 policies/[slug]/page.tsx (Policy Detail)
└── 2.8 Verify: policies display + RAG status

PHASE 3: Wizard & Tickets (~2 hours)
├── 3.1 wizard components (shell, steps, progress, evidence)
├── 3.2 policies/[slug]/wizard/page.tsx
├── 3.3 actions.ts (wizard actions)
├── 3.4 tickets/page.tsx (Resolution Center)
├── 3.5 tickets/[id]/page.tsx (Ticket Detail)
├── 3.6 components/tickets/* (cards, timeline, diagnostics)
└── 3.7 Verify: wizard flow + ticket creation

PHASE 4: Monitoring & Remediation (~2 hours)
├── 4.1 services/probe-service.ts
├── 4.2 services/monitoring-service.ts (enhanced)
├── 4.3 services/remediation-service.ts
├── 4.4 services/audit-service.ts
├── 4.5 monitoring/page.tsx
├── 4.6 api/scan/route.ts
└── 4.7 Verify: scan + fix + audit trail

PHASE 5: Knowledge Base & AI (~2 hours)
├── 5.1 lib/gemini.ts
├── 5.2 services/kb-service.ts
├── 5.3 knowledge/page.tsx (document browser)
├── 5.4 knowledge/chat/page.tsx (AI chat)
├── 5.5 api/chat/route.ts (streaming)
├── 5.6 components/knowledge/* (chat UI, citations)
└── 5.7 Verify: AI chat with grounded answers

PHASE 6: SaaS & Polish (~1 hour)
├── 6.1 services/entitlements.ts
├── 6.2 api/checkout/route.ts
├── 6.3 api/webhooks/stripe/route.ts
├── 6.4 settings/page.tsx
├── 6.5 Upgrade cards + tier gating throughout
└── 6.6 Verify: subscription flow
```

---

## Resolved Decisions

> [!NOTE]
> All design decisions finalized on 2026-04-13.

### 1. Age Verification Module Depth
**Decision: Standard + Systemic Stub**
- Build the **Standard** (Hard) AV module: date-of-birth picker with validation, session-gated access, configurable per-app via the intensity dial.
- The **Soft** dial position uses a simple self-declaration checkbox + cookie.
- The **Systemic** dial position shows a "Coming Soon — Enterprise" placeholder with architecture hooks for future third-party ID verification (Yoti, ACCS).
- All three dial positions are functional in the UI; only Systemic defers actual implementation.

### 2. Deployment Target
**Decision: Cloud Run (production), localhost (development)**
- Production target is **Google Cloud Run** within the existing GCP project (`heidless-apps-0`).
- All development is done on **localhost** (`npm run dev` on port 3000).
- Dockerfile and Cloud Run configuration will be added in Phase 6 as a deployment-readiness task.
- Stripe webhook URL will use the Cloud Run service URL when deployed.

### 3. KB Document Ingestion Format
**Decision: Text/Markdown first, PDF later**
- v2.0 supports **text and markdown** document ingestion only.
- Legislative documents (OSA, DPA) should be pre-converted to markdown before upload.
- PDF upload + extraction (`pdf-parse`) is deferred to a Phase 5.5 enhancement.
- The `KBService.ingestDocument()` interface accepts raw text content.

### 4. Gemini API Key
**Decision: Use `NANOBANANA_API_KEY`**
- The existing `NANOBANANA_API_KEY` in `.env.local` is a valid Gemini API key.
- `gemini.ts` will check `global_secrets` for `GEMINI_API_KEY` first, then fall back to `process.env.NANOBANANA_API_KEY`.
- No additional key configuration needed.

---

*End of Plan — Ready for Implementation*
