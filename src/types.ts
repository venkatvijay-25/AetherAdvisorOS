import type { LucideIcon } from "lucide-react";

export type Role = "Advisor" | "Compliance" | "Client";

export type ViewKey =
  | "dashboard"
  | "clients"
  | "meeting"
  | "agents"
  | "compliance"
  | "portfolio"
  | "team"
  | "roadmap"
  | "settings";

export type NavItem = {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
};

export type StatusTone = "good" | "warn" | "danger" | "neutral" | "info";

export type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  age: number;
  influence: "High" | "Medium" | "Low";
  sentiment: StatusTone;
  priority: string;
};

export type Account = {
  id: string;
  name: string;
  custodian: string;
  value: number;
  allocation: string;
  status: StatusTone;
};

export type Goal = {
  id: string;
  title: string;
  target: string;
  confidence: number;
  owner: string;
  status: StatusTone;
};

export type ClientDocument = {
  id: string;
  title: string;
  type: string;
  status: StatusTone;
  reviewed: string;
};

export type Recommendation = {
  id: string;
  title: string;
  rationale: string;
  confidence: number;
  gate: "Advisor approval" | "Compliance review" | "Client consent";
  conflictCheck: StatusTone;
};

export type Client = {
  id: string;
  name: string;
  household: string;
  segment: string;
  age: number;
  aum: number;
  revenue: number;
  riskScore: number;
  retentionRisk: StatusTone;
  nextMeeting: string;
  primaryGoal: string;
  advisors: string[];
  constraints: string[];
  lifeEvents: string[];
  accounts: Account[];
  goals: Goal[];
  documents: ClientDocument[];
  family: FamilyMember[];
  recommendations: Recommendation[];
};

export type MeetingAction = {
  id: string;
  clientId: string;
  title: string;
  detail: string;
  owner: string;
  due: string;
  risk: StatusTone;
  status: "Pending" | "Approved" | "Rejected" | "Revision requested";
  approvalGate: "Advisor" | "Compliance" | "Client";
};

export type Meeting = {
  id: string;
  clientId: string;
  title: string;
  time: string;
  duration: string;
  stage: "Prep" | "Live" | "Follow-up";
  summary: string;
  sentiment: StatusTone;
  transcript: string[];
};

export type Agent = {
  id: string;
  name: string;
  specialty: string;
  status: "Active" | "Paused" | "Review";
  confidence: number;
  autonomy: "Observe" | "Draft" | "Execute with approval" | "Blocked";
  currentTask: string;
  lastReasoning: string;
};

export type ComplianceReview = {
  id: string;
  clientId: string;
  title: string;
  category: string;
  severity: StatusTone;
  evidence: string;
  status: "Open" | "Approved" | "Escalated" | "Revision requested";
};

export type AuditEvent = {
  id: string;
  time: string;
  actor: string;
  title: string;
  detail: string;
  category: "AI" | "Human" | "Compliance" | "System";
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  capacity: number;
  focus: string;
  risk: StatusTone;
};

export type PortfolioAsset = {
  id: string;
  name: string;
  type: string;
  value: number;
  weight: number;
  risk: StatusTone;
  note: string;
};

export type RoadmapPhase = "P0" | "P1" | "P2" | "P3";

export type RoadmapFeatureStatus = "Live in prototype" | "In progress" | "Ready to build" | "Blocked";

export type RoadmapFeature = {
  id: string;
  number: string;
  phase: RoadmapPhase;
  title: string;
  summary: string;
  note: string;
  outcome: string;
  status: RoadmapFeatureStatus;
  dependencies: string[];
  surface: string;
  impact: string;
  effort: "Low" | "Medium" | "High";
};
