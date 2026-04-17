export type PolicyStatus = 'red' | 'amber' | 'green' | 'planned';
export type IntensityLevel = 'soft' | 'hard' | 'systemic';
export type CheckCategory = 'automated' | 'manual' | 'hybrid';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';
export type TicketType = 'compliance_gap' | 'drift_detected' | 'manual_review' | 'incident';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Severity = 'blocker' | 'major' | 'minor' | 'cosmetic';
export type ProbeType = 'http_header' | 'db_config' | 'firestore_rule' | 'api_check' | 'manual';
export type RemediationType = 'active_fix' | 'guided_manual' | 'pending';
export type WizardStepStatus = 'locked' | 'active' | 'completed' | 'skipped';
export type AccreditationTier = 'free' | 'professional' | 'enterprise';
export type PolicyCategory = 'safety' | 'data' | 'security';

// ═══════════════════════════════════════════════════════
// POLICY DOMAIN
// ═══════════════════════════════════════════════════════

export interface ImplementationStep {
  id: string;
  order: number;
  title: string;
  description: string;
  guidance: string;
  /** Detailed step-by-step instructions (markdown) */
  instructions: string;
  evidenceRequired: boolean;
  automatable: boolean;
  automatedProbeId?: string;
  estimatedMinutes?: number;
  dependsOn?: string[];
  status: WizardStepStatus;
  draftable?: boolean;
  relatedCheckId?: string;
}

export interface AuditCheck {
  id: string;
  title: string;
  description: string;
  status: PolicyStatus;
  category: CheckCategory;
  probeId?: string;
  targetApp: string;
  targetDb?: string;
  evidenceUrl?: string | null;
  lastChecked: Date | null;
  nextDue?: Date | null;
  notes?: string;
}

export interface Policy {
  id: string;
  slug: string;
  name: string;
  definition: string;
  checksAndBalances: string;
  risksAndConsequences: string;
  status: PolicyStatus;
  intensity: IntensityLevel;
  category: PolicyCategory;
  regulatoryBody: string;
  maxPenalty: string;
  legislativeUrl?: string;
  targetApps: string[];
  implementationGuide: ImplementationStep[];
  checks: AuditCheck[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

// ═══════════════════════════════════════════════════════
// TICKET / RESOLUTION DOMAIN
// ═══════════════════════════════════════════════════════

export interface TimelineEntry {
  timestamp: Date | null;
  action: string;
  actor: string;
  details?: string;
}

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
  affectedApps: string[];
  remediation: {
    type: RemediationType;
    fixId?: string;
    evidenceUrl?: string | null;
    notes?: string;
    resolvedBy?: string;
    resolvedAt?: Date | null;
  };
  timeline: TimelineEntry[];
  assignee?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// ═══════════════════════════════════════════════════════
// MONITORING / PROBE DOMAIN
// ═══════════════════════════════════════════════════════

export interface ProbeDefinition {
  id: string;
  name: string;
  description: string;
  type: ProbeType;
  targetDb: string;
  targetPath: string;
  expectedCondition: string;
  fixFunctionId?: string;
}

export interface ScanResult {
  checkId: string;
  policyId: string;
  probeId: string;
  appTarget: string;
  status: PolicyStatus;
  message: string;
  probeType: ProbeType;
  rawData?: Record<string, unknown>;
  executedAt: Date | null;
}

// ═══════════════════════════════════════════════════════
// KNOWLEDGE BASE DOMAIN
// ═══════════════════════════════════════════════════════

export interface KBChunk {
  id: string;
  documentId: string;
  content: string;
  pageRef?: string;
  embedding?: number[];
  docTitle?: string;
}

export interface KBDocument {
  id: string;
  title: string;
  source: string;
  category: PolicyCategory;
  content: string;
  chunks?: KBChunk[];
  pageCount?: number;
  uploadedBy: string;
  chunkCount?: number;
  uploadedAt: Date | null;
  updatedAt: Date | null;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  pageRef?: string;
  relevanceScore: number;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  timestamp: Date | null;
}

// ═══════════════════════════════════════════════════════
// WIZARD STATE
// ═══════════════════════════════════════════════════════

export interface WizardState {
  policyId: string;
  userId: string;
  currentStepIndex: number;
  stepsCompleted: string[];
  evidenceUploaded: Record<string, string>;
  checklistsUploaded: Record<string, string>;
  checklistProgress: Record<string, boolean[]>;
  startedAt: Date | null;
  lastActivityAt: Date | null;
  completedAt?: Date | null;
}

// ═══════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  targetType: 'policy' | 'ticket' | 'check' | 'config' | 'scan' | 'remediation' | 'policy_check';
  targetId: string;
  details: Record<string, unknown>;
  timestamp: Date | null;
}

// ═══════════════════════════════════════════════════════
// AUTH / USER
// ═══════════════════════════════════════════════════════

export interface AccreditationUser {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  isAdmin: boolean;
  tier: AccreditationTier;
}

export interface ServerUser {
  uid: string;
  email: string;
}

// ═══════════════════════════════════════════════════════
// SUITE HEALTH
// ═══════════════════════════════════════════════════════

export interface AppHealthStatus {
  appId: string;
  appName: string;
  dbId: string;
  connected: boolean;
  lastScan: Date | null;
  openTickets: number;
  complianceScore: number;
  criticalIssues: number;
}
