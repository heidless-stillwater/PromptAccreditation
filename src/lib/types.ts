export type PolicyStatus = 'red' | 'amber' | 'green';
export type IntensityLevel = 'soft' | 'hard' | 'systemic';
export type CheckCategory = 'automated' | 'manual' | 'hybrid';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface ImplementationStep {
    id: string;
    order: number;
    title: string;
    description: string;
    guidance: string;
    evidenceRequired: boolean;
    automatable: boolean;
    estimatedMinutes?: number;
}

export interface AuditCheck {
    id: string;
    title: string;
    description: string;
    status: PolicyStatus;
    category: CheckCategory;
    automatedProbeId?: string;
    evidenceUrl?: string;
    lastChecked: Date | any; // Firestore Timestamp handled in service
    nextDue?: Date | any;
    notes?: string;
}

export interface Policy {
    id: string;
    name: string;
    slug: string;
    definition: string;
    checksAndBalances: string;
    risksAndConsequences: string;
    status: PolicyStatus;
    intensity: IntensityLevel;
    category: string;
    regulatoryBody: string;
    maxPenalty: string;
    implementationGuide: ImplementationStep[];
    checks: AuditCheck[];
}

export interface Ticket {
    id: string;
    policyId: string;
    checkId: string;
    status: TicketStatus;
    priority: Priority;
    severity: 'blocker' | 'major' | 'minor' | 'cosmetic';
    type: 'compliance_gap' | 'drift_detected' | 'manual_review' | 'incident';
    title: string;
    description: string;
    affectedApps: string[];
    remediation: {
        type: 'active_fix' | 'manual' | 'pending';
        fixId?: string;
        evidenceUrl?: string;
        notes?: string;
        resolvedBy?: string;
        resolvedAt?: Date | any;
    };
    timeline: {
        timestamp: Date | any;
        action: string;
        actor: string;
        details?: string;
    }[];
    createdAt: Date | any;
    updatedAt: Date | any;
}

export interface ScanResult {
    checkId: string;
    policyId: string;
    appTarget: string;
    status: PolicyStatus;
    message: string;
    probeType: 'http_header' | 'db_read' | 'config_check' | 'manual';
}
