import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareText,
  Network,
  Pause,
  Play,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  clients,
  initialAgents,
  initialAuditEvents,
  initialComplianceReviews,
  initialMeetingActions,
  meetings,
  portfolioAssets,
  team,
} from "./data/aetherData";
import type {
  Agent,
  AuditEvent,
  Client,
  ComplianceReview,
  MeetingAction,
  NavItem,
  Role,
  StatusTone,
  ViewKey,
} from "./types";

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "clients", label: "Client Hub", icon: Users },
  { key: "meeting", label: "Meeting", icon: MessageSquareText },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
  { key: "portfolio", label: "Portfolio", icon: Landmark },
  { key: "team", label: "Team OS", icon: BriefcaseBusiness },
  { key: "settings", label: "Settings", icon: Settings },
];

const toneLabel: Record<StatusTone, string> = {
  good: "Good",
  warn: "Watch",
  danger: "Critical",
  neutral: "Neutral",
  info: "Info",
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatFullMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [role, setRole] = useState<Role>("Advisor");
  const [query, setQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(clients[0].id);
  const [actions, setActions] = useState<MeetingAction[]>(initialMeetingActions);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [reviews, setReviews] = useState<ComplianceReview[]>(initialComplianceReviews);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(initialAuditEvents);

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? clients[0];
  const openReviews = reviews.filter((review) => review.status === "Open");
  const pendingActions = actions.filter((action) => action.status === "Pending");
  const agentHealth = Math.round(
    sum(agents.map((agent) => agent.confidence)) / Math.max(agents.length, 1),
  );

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clients;
    return clients.filter((client) =>
      [client.name, client.household, client.segment, client.primaryGoal]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query]);

  const addAudit = (
    category: AuditEvent["category"],
    actor: string,
    title: string,
    detail: string,
  ) => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setAuditEvents((events) => [
      {
        id: `ev-${Date.now()}`,
        time,
        actor,
        category,
        title,
        detail,
      },
      ...events,
    ]);
  };

  const approveAction = (id: string) => {
    const action = actions.find((item) => item.id === id);
    if (!action) return;

    setActions((items) =>
      items.map((item) => (item.id === id ? { ...item, status: "Approved" } : item)),
    );
    addAudit(
      "Human",
      role,
      `Approved: ${action.title}`,
      `${action.approvalGate} gate cleared for ${action.owner}.`,
    );
  };

  const rejectAction = (id: string) => {
    const action = actions.find((item) => item.id === id);
    if (!action) return;

    setActions((items) =>
      items.map((item) => (item.id === id ? { ...item, status: "Rejected" } : item)),
    );
    addAudit(
      "Human",
      role,
      `Rejected: ${action.title}`,
      "Advisor requested a revised draft before any external communication.",
    );
  };

  const updateReview = (id: string, status: ComplianceReview["status"]) => {
    const review = reviews.find((item) => item.id === id);
    if (!review) return;

    setReviews((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
    addAudit(
      "Compliance",
      role,
      `${status}: ${review.title}`,
      `${review.category} review updated with evidence preserved for audit export.`,
    );
  };

  const toggleAgent = (id: string) => {
    setAgents((items) =>
      items.map((agent) => {
        if (agent.id !== id) return agent;
        const status = agent.status === "Paused" ? "Active" : "Paused";
        addAudit("System", "Agent Control", `${status}: ${agent.name}`, agent.currentTask);
        return { ...agent, status };
      }),
    );
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <Dashboard
            actions={actions}
            auditEvents={auditEvents}
            clients={filteredClients}
            openReviews={openReviews}
            pendingActions={pendingActions}
            selectedClient={selectedClient}
            setActiveView={setActiveView}
            setSelectedClientId={setSelectedClientId}
          />
        );
      case "clients":
        return (
          <ClientHub
            clients={filteredClients}
            selectedClient={selectedClient}
            setSelectedClientId={setSelectedClientId}
            setActiveView={setActiveView}
          />
        );
      case "meeting":
        return (
          <MeetingAssistant
            actions={actions}
            approveAction={approveAction}
            rejectAction={rejectAction}
            selectedClient={selectedClient}
          />
        );
      case "agents":
        return <AgentSwarm agents={agents} toggleAgent={toggleAgent} />;
      case "compliance":
        return (
          <ComplianceShield
            auditEvents={auditEvents}
            reviews={reviews}
            updateReview={updateReview}
          />
        );
      case "portfolio":
        return <PortfolioManager selectedClient={selectedClient} />;
      case "team":
        return <TeamOs />;
      case "settings":
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <strong>Aether</strong>
            <span>Advisor OS</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={clsx("nav-item", activeView === item.key && "active")}
                key={item.key}
                onClick={() => setActiveView(item.key)}
                title={item.label}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-section">
          <div className="eyebrow">Focus Household</div>
          <button
            className="client-switch"
            onClick={() => setActiveView("clients")}
            type="button"
          >
            <span>{selectedClient.household}</span>
            <ChevronRight size={16} />
          </button>
          <StatusPill tone={selectedClient.retentionRisk} label="Retention" />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="search-shell">
            <Search size={18} />
            <input
              aria-label="Search clients and work"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clients, assets, agents, compliance"
              value={query}
            />
          </div>

          <div className="topbar-actions">
            <div className="segmented" aria-label="Role switcher">
              {(["Advisor", "Compliance", "Client"] as Role[]).map((item) => (
                <button
                  className={clsx(role === item && "active")}
                  key={item}
                  onClick={() => setRole(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="agent-health">
              <Activity size={17} />
              <span>{agentHealth}% agent health</span>
            </div>
          </div>
        </header>

        <div className="content-grid">
          <section className="workspace">{renderView()}</section>
          <IntelligencePanel
            activeView={activeView}
            auditEvents={auditEvents}
            openReviews={openReviews}
            pendingActions={pendingActions}
            selectedClient={selectedClient}
            setActiveView={setActiveView}
          />
        </div>
      </main>
    </div>
  );
}

type DashboardProps = {
  actions: MeetingAction[];
  auditEvents: AuditEvent[];
  clients: Client[];
  openReviews: ComplianceReview[];
  pendingActions: MeetingAction[];
  selectedClient: Client;
  setActiveView: (view: ViewKey) => void;
  setSelectedClientId: (id: string) => void;
};

function Dashboard({
  actions,
  auditEvents,
  clients: visibleClients,
  openReviews,
  pendingActions,
  selectedClient,
  setActiveView,
  setSelectedClientId,
}: DashboardProps) {
  const totalAum = sum(clients.map((client) => client.aum));
  const criticalHouseholds = clients.filter((client) => client.retentionRisk !== "good").length;
  const approvedToday = actions.filter((action) => action.status === "Approved").length;

  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="Advisor Command"
        title="Today"
        subtitle="Priority meetings, approval gates, household risk, and audit posture."
      />

      <div className="metric-grid">
        <MetricTile icon={CircleDollarSign} label="AUM covered" value={formatMoney(totalAum)} />
        <MetricTile icon={AlertTriangle} label="At-risk households" tone="warn" value={`${criticalHouseholds}`} />
        <MetricTile icon={ClipboardCheck} label="Pending approvals" tone="info" value={`${pendingActions.length}`} />
        <MetricTile icon={ShieldCheck} label="Cleared today" tone="good" value={`${approvedToday}`} />
      </div>

      <div className="two-column">
        <section className="surface">
          <SectionTitle icon={CalendarDays} title="Advisor Day Plan" />
          <div className="timeline-list">
            {meetings.map((meeting) => {
              const client = clients.find((item) => item.id === meeting.clientId) ?? selectedClient;
              return (
                <button
                  className="timeline-item"
                  key={meeting.id}
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setActiveView("meeting");
                  }}
                  type="button"
                >
                  <span className="timeline-time">{meeting.time}</span>
                  <span>
                    <strong>{meeting.title}</strong>
                    <small>{client.household} - {meeting.summary}</small>
                  </span>
                  <StatusPill tone={meeting.sentiment} label={meeting.stage} />
                </button>
              );
            })}
          </div>
        </section>

        <section className="surface">
          <SectionTitle icon={Gauge} title="Household Risk Board" />
          <div className="client-rank-list">
            {visibleClients.map((client) => (
              <button
                className="rank-row"
                key={client.id}
                onClick={() => {
                  setSelectedClientId(client.id);
                  setActiveView("clients");
                }}
                type="button"
              >
                <RiskDot tone={client.retentionRisk} />
                <span>
                  <strong>{client.household}</strong>
                  <small>{client.primaryGoal}</small>
                </span>
                <span className="rank-value">{formatMoney(client.aum)}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="two-column compact">
        <section className="surface">
          <SectionTitle icon={Bot} title="AI Work Waiting On Humans" />
          <div className="work-list">
            {pendingActions.map((action) => (
              <div className="work-row" key={action.id}>
                <StatusPill tone={action.risk} label={action.approvalGate} />
                <span>
                  <strong>{action.title}</strong>
                  <small>{action.detail}</small>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface">
          <SectionTitle icon={FileCheck2} title="Latest Audit Evidence" />
          <AuditList events={auditEvents.slice(0, 4)} />
          <button className="text-action" onClick={() => setActiveView("compliance")} type="button">
            Open audit trail <ArrowRight size={15} />
          </button>
        </section>
      </div>

      <section className="surface">
        <SectionTitle icon={Network} title="Product Guardrail Map" />
        <div className="guardrail-grid">
          <Guardrail label="Recommendation" value="Best-interest rationale required" tone="good" />
          <Guardrail label="AI output" value="Prompt, source, model, reviewer stored" tone="good" />
          <Guardrail label="External delivery" value="Advisor approval before send" tone="info" />
          <Guardrail label="High-stakes action" value="Compliance review gate" tone="warn" />
          <Guardrail label="Review queue" value={`${openReviews.length} open compliance items`} tone="danger" />
        </div>
      </section>
    </div>
  );
}

type ClientHubProps = {
  clients: Client[];
  selectedClient: Client;
  setActiveView: (view: ViewKey) => void;
  setSelectedClientId: (id: string) => void;
};

function ClientHub({ clients: visibleClients, selectedClient, setActiveView, setSelectedClientId }: ClientHubProps) {
  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="Client Intelligence"
        title={selectedClient.household}
        subtitle={`${selectedClient.segment} - ${selectedClient.primaryGoal}`}
      />

      <div className="client-layout">
        <section className="surface client-list-panel">
          <SectionTitle icon={Users} title="Households" />
          {visibleClients.map((client) => (
            <button
              className={clsx("client-row", client.id === selectedClient.id && "active")}
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              type="button"
            >
              <RiskDot tone={client.retentionRisk} />
              <span>
                <strong>{client.name}</strong>
                <small>{client.household}</small>
              </span>
              <span className="rank-value">{formatMoney(client.aum)}</span>
            </button>
          ))}
        </section>

        <section className="surface">
          <SectionTitle icon={Network} title="Family Map" />
          <div className="family-map">
            {selectedClient.family.map((member) => (
              <div className={clsx("family-node", member.relation === "Primary" && "primary")} key={member.id}>
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.relation} - {member.age}</small>
                </div>
                <StatusPill tone={member.sentiment} label={member.influence} />
                <span>{member.priority}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="three-column">
        <section className="surface">
          <SectionTitle icon={Landmark} title="Accounts" />
          <div className="data-list">
            {selectedClient.accounts.map((account) => (
              <div className="data-row" key={account.id}>
                <span>
                  <strong>{account.name}</strong>
                  <small>{account.custodian} - {account.allocation}</small>
                </span>
                <span className="numeric">{formatMoney(account.value)}</span>
                <RiskDot tone={account.status} />
              </div>
            ))}
          </div>
        </section>

        <section className="surface">
          <SectionTitle icon={Gauge} title="Goals" />
          <div className="data-list">
            {selectedClient.goals.map((goal) => (
              <div className="goal-row" key={goal.id}>
                <div className="goal-heading">
                  <span>
                    <strong>{goal.title}</strong>
                    <small>{goal.owner} - {goal.target}</small>
                  </span>
                  <StatusPill tone={goal.status} label={`${goal.confidence}%`} />
                </div>
                <ProgressBar value={goal.confidence} tone={goal.status} />
              </div>
            ))}
          </div>
        </section>

        <section className="surface">
          <SectionTitle icon={FileText} title="Document Vault" />
          <div className="data-list">
            {selectedClient.documents.map((document) => (
              <div className="data-row" key={document.id}>
                <span>
                  <strong>{document.title}</strong>
                  <small>{document.type} - {document.reviewed}</small>
                </span>
                <StatusPill tone={document.status} label={toneLabel[document.status]} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface">
        <SectionTitle icon={Sparkles} title="Advisor Recommendations" />
        <div className="recommendation-grid">
          {selectedClient.recommendations.map((recommendation) => (
            <article className="recommendation" key={recommendation.id}>
              <div className="recommendation-top">
                <strong>{recommendation.title}</strong>
                <StatusPill tone={recommendation.conflictCheck} label={recommendation.gate} />
              </div>
              <p>{recommendation.rationale}</p>
              <ProgressBar value={recommendation.confidence} tone={recommendation.conflictCheck} />
            </article>
          ))}
        </div>
        <button className="primary-action" onClick={() => setActiveView("meeting")} type="button">
          <MessageSquareText size={16} /> Open next meeting
        </button>
      </section>
    </div>
  );
}

type MeetingAssistantProps = {
  actions: MeetingAction[];
  approveAction: (id: string) => void;
  rejectAction: (id: string) => void;
  selectedClient: Client;
};

function MeetingAssistant({ actions, approveAction, rejectAction, selectedClient }: MeetingAssistantProps) {
  const meeting = meetings.find((item) => item.clientId === selectedClient.id) ?? meetings[0];
  const clientActions = actions.filter((action) => action.clientId === selectedClient.id);

  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="Meeting Assistant"
        title={meeting.title}
        subtitle={`${selectedClient.household} - ${meeting.time} - ${meeting.duration}`}
      />

      <div className="two-column">
        <section className="surface">
          <SectionTitle icon={Clock3} title="Meeting Brief" />
          <div className="brief-grid">
            <BriefItem label="Stage" value={meeting.stage} tone={meeting.sentiment} />
            <BriefItem label="Client objective" value={selectedClient.primaryGoal} tone="info" />
            <BriefItem label="Risk score" value={`${selectedClient.riskScore}/100`} tone={selectedClient.retentionRisk} />
            <BriefItem label="Next event" value={selectedClient.lifeEvents[0]} tone="warn" />
          </div>
          <p className="body-copy">{meeting.summary}</p>
        </section>

        <section className="surface">
          <SectionTitle icon={FileText} title="Transcript Signals" />
          <div className="quote-list">
            {meeting.transcript.map((line) => (
              <blockquote key={line}>{line}</blockquote>
            ))}
          </div>
        </section>
      </div>

      <section className="surface">
        <SectionTitle icon={Bot} title="AI-Drafted Actions" />
        <div className="action-board">
          {clientActions.map((action) => (
            <article className="approval-row" key={action.id}>
              <div>
                <div className="recommendation-top">
                  <strong>{action.title}</strong>
                  <StatusPill tone={action.risk} label={action.approvalGate} />
                </div>
                <p>{action.detail}</p>
                <small>{action.owner} - due {action.due}</small>
              </div>
              <div className="approval-actions">
                {action.status === "Pending" ? (
                  <>
                    <button className="icon-button approve" onClick={() => approveAction(action.id)} title="Approve" type="button">
                      <Check size={17} />
                    </button>
                    <button className="icon-button reject" onClick={() => rejectAction(action.id)} title="Reject" type="button">
                      <X size={17} />
                    </button>
                  </>
                ) : (
                  <StatusPill tone={action.status === "Approved" ? "good" : "danger"} label={action.status} />
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

type AgentSwarmProps = {
  agents: Agent[];
  toggleAgent: (id: string) => void;
};

function AgentSwarm({ agents, toggleAgent }: AgentSwarmProps) {
  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="AI Governance"
        title="Agent Swarm Control"
        subtitle="Autonomy, confidence, reasoning, and pause controls for every specialist agent."
      />

      <div className="agent-grid">
        {agents.map((agent) => (
          <article className="agent-panel" key={agent.id}>
            <div className="agent-top">
              <div>
                <strong>{agent.name}</strong>
                <small>{agent.specialty}</small>
              </div>
              <button
                className="icon-button"
                onClick={() => toggleAgent(agent.id)}
                title={agent.status === "Paused" ? "Resume agent" : "Pause agent"}
                type="button"
              >
                {agent.status === "Paused" ? <Play size={17} /> : <Pause size={17} />}
              </button>
            </div>
            <div className="agent-meta">
              <StatusPill tone={agent.status === "Active" ? "good" : agent.status === "Paused" ? "neutral" : "warn"} label={agent.status} />
              <StatusPill tone="info" label={agent.autonomy} />
            </div>
            <ProgressBar value={agent.confidence} tone={agent.confidence > 85 ? "good" : "warn"} />
            <p>{agent.currentTask}</p>
            <div className="reasoning-box">
              <span>Reasoning</span>
              <small>{agent.lastReasoning}</small>
            </div>
          </article>
        ))}
      </div>

      <section className="surface">
        <SectionTitle icon={LockKeyhole} title="Autonomy Policy" />
        <div className="policy-grid">
          <Guardrail label="Observe" value="Can summarize and detect risk only" tone="neutral" />
          <Guardrail label="Draft" value="Can create internal drafts with source links" tone="info" />
          <Guardrail label="Execute with approval" value="Can act after a named human clears the gate" tone="warn" />
          <Guardrail label="Blocked" value="Cannot trade, send, or alter records without controls" tone="danger" />
        </div>
      </section>
    </div>
  );
}

type ComplianceShieldProps = {
  auditEvents: AuditEvent[];
  reviews: ComplianceReview[];
  updateReview: (id: string, status: ComplianceReview["status"]) => void;
};

function ComplianceShield({ auditEvents, reviews, updateReview }: ComplianceShieldProps) {
  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="Compliance Shield"
        title="Review Queue and Audit Trail"
        subtitle="Human supervision, source evidence, records, and escalation state in one view."
      />

      <div className="review-grid">
        {reviews.map((review) => {
          const client = clients.find((item) => item.id === review.clientId);
          return (
            <article className="review-panel" key={review.id}>
              <div className="recommendation-top">
                <div>
                  <strong>{review.title}</strong>
                  <small>{client?.household} - {review.category}</small>
                </div>
                <StatusPill tone={review.severity} label={review.status} />
              </div>
              <p>{review.evidence}</p>
              <div className="approval-actions left">
                <button
                  className="secondary-action"
                  disabled={review.status !== "Open"}
                  onClick={() => updateReview(review.id, "Approved")}
                  type="button"
                >
                  <Check size={16} /> Approve
                </button>
                <button
                  className="secondary-action danger"
                  disabled={review.status !== "Open"}
                  onClick={() => updateReview(review.id, "Escalated")}
                  type="button"
                >
                  <AlertTriangle size={16} /> Escalate
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="surface">
        <SectionTitle icon={FileCheck2} title="Immutable Audit Timeline" />
        <AuditList events={auditEvents} />
      </section>

      <section className="surface">
        <SectionTitle icon={ShieldCheck} title="Regulatory Control Coverage" />
        <div className="control-grid">
          <ControlItem title="Supervision" detail="Advisor and compliance gates on high-impact AI output." />
          <ControlItem title="Books and records" detail="Business communications, prompts, outputs, and approvals retained." />
          <ControlItem title="Privacy" detail="Sensitive client data tagged, access-scoped, and excluded from model training." />
          <ControlItem title="Best interest" detail="Recommendations require alternatives, conflicts, rationale, and client-fit evidence." />
        </div>
      </section>
    </div>
  );
}

function PortfolioManager({ selectedClient }: { selectedClient: Client }) {
  const totalPortfolio = sum(portfolioAssets.map((asset) => asset.value));

  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="Portfolio"
        title="Unified Asset Manager"
        subtitle={`${selectedClient.household} context, enterprise exposures, and scenario controls.`}
      />

      <div className="metric-grid">
        <MetricTile icon={CircleDollarSign} label="Tracked assets" value={formatMoney(totalPortfolio)} />
        <MetricTile icon={AlertTriangle} label="Concentration" tone="warn" value="20%" />
        <MetricTile icon={Gauge} label="Liquidity runway" tone="good" value="18 mo" />
        <MetricTile icon={FileCheck2} label="IPS exceptions" tone="danger" value="2" />
      </div>

      <section className="surface">
        <SectionTitle icon={Landmark} title="Enterprise Exposure" />
        <div className="asset-table">
          {portfolioAssets.map((asset) => (
            <div className="asset-row" key={asset.id}>
              <span>
                <strong>{asset.name}</strong>
                <small>{asset.type} - {asset.note}</small>
              </span>
              <span className="numeric">{formatFullMoney(asset.value)}</span>
              <div className="bar-cell">
                <ProgressBar value={asset.weight} tone={asset.risk} />
                <small>{asset.weight}%</small>
              </div>
              <StatusPill tone={asset.risk} label={toneLabel[asset.risk]} />
            </div>
          ))}
        </div>
      </section>

      <div className="three-column">
        <ScenarioCard title="Tax-aware sale" value="+$1.8M" detail="Harvests charitable lots and stages sale windows." tone="good" />
        <ScenarioCard title="Liquidity stress" value="14 mo" detail="Private call plus care reserve remains funded." tone="warn" />
        <ScenarioCard title="Held-away cleanup" value="$3.9M" detail="Insurance policy requires beneficiary and fee review." tone="danger" />
      </div>
    </div>
  );
}

function TeamOs() {
  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="Practice Management"
        title="Team OS"
        subtitle="Capacity, delegation, mentorship capture, and client-service risk."
      />

      <div className="team-grid">
        {team.map((member) => (
          <article className="team-panel" key={member.id}>
            <div className="recommendation-top">
              <div>
                <strong>{member.name}</strong>
                <small>{member.role}</small>
              </div>
              <StatusPill tone={member.risk} label={`${member.capacity}%`} />
            </div>
            <ProgressBar value={member.capacity} tone={member.risk} />
            <p>{member.focus}</p>
          </article>
        ))}
      </div>

      <section className="surface">
        <SectionTitle icon={BriefcaseBusiness} title="Delegation Rules" />
        <div className="policy-grid">
          <Guardrail label="High capacity" value="Shift prep tasks to AI draft mode" tone="warn" />
          <Guardrail label="Compliance partner" value="Reserve for regulated communication review" tone="good" />
          <Guardrail label="Junior advisor" value="Receive reasoning summaries before client calls" tone="info" />
          <Guardrail label="Succession" value="Capture decision rationale from senior advisors" tone="neutral" />
        </div>
      </section>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="Operating Model"
        title="Governance Settings"
        subtitle="Controls that make the product deployable inside a regulated advisory firm."
      />

      <div className="settings-grid">
        <SettingsSection
          icon={LockKeyhole}
          title="Access Control"
          items={["Advisor, compliance, client, and operations roles", "Household-level data partitions", "Step-up approval for sensitive documents"]}
        />
        <SettingsSection
          icon={FileCheck2}
          title="Records"
          items={["Prompt and output archive", "Advisor approval receipts", "SEC/FINRA export package"]}
        />
        <SettingsSection
          icon={Bot}
          title="AI Policy"
          items={["No client data used for model training", "Model version stamped on every output", "Human gate for external communication"]}
        />
        <SettingsSection
          icon={Landmark}
          title="Data Sources"
          items={["Custodians", "CRM", "Planning tools", "Calendar and email", "Document vault"]}
        />
      </div>
    </div>
  );
}

type IntelligencePanelProps = {
  activeView: ViewKey;
  auditEvents: AuditEvent[];
  openReviews: ComplianceReview[];
  pendingActions: MeetingAction[];
  selectedClient: Client;
  setActiveView: (view: ViewKey) => void;
};

function IntelligencePanel({
  activeView,
  auditEvents,
  openReviews,
  pendingActions,
  selectedClient,
  setActiveView,
}: IntelligencePanelProps) {
  return (
    <aside className="intelligence-panel">
      <div className="panel-header">
        <span className="eyebrow">Aether Intelligence</span>
        <strong>{selectedClient.name}</strong>
      </div>

      <div className="insight-block">
        <SectionTitle icon={Sparkles} title="Next Best Actions" compact />
        {selectedClient.recommendations.map((recommendation) => (
          <button
            className="insight-row"
            key={recommendation.id}
            onClick={() => setActiveView(recommendation.gate === "Compliance review" ? "compliance" : "meeting")}
            type="button"
          >
            <span>{recommendation.title}</span>
            <StatusPill tone={recommendation.conflictCheck} label={`${recommendation.confidence}%`} />
          </button>
        ))}
      </div>

      <div className="insight-block">
        <SectionTitle icon={AlertTriangle} title="Open Control Work" compact />
        <div className="mini-stat-row">
          <span>{pendingActions.length} actions</span>
          <button onClick={() => setActiveView("meeting")} type="button">Meeting</button>
        </div>
        <div className="mini-stat-row">
          <span>{openReviews.length} reviews</span>
          <button onClick={() => setActiveView("compliance")} type="button">Compliance</button>
        </div>
      </div>

      <div className="insight-block">
        <SectionTitle icon={FileCheck2} title="Evidence Snapshot" compact />
        <AuditList events={auditEvents.slice(0, 3)} compact />
      </div>

      <div className="insight-block">
        <SectionTitle icon={Activity} title="View Context" compact />
        <p className="body-copy small">
          {activeView === "dashboard"
            ? "Enterprise queue is sorted by household risk, upcoming meetings, and blocked AI work."
            : "Context-aware recommendations follow the selected household and current workspace."}
        </p>
      </div>
    </aside>
  );
}

function ViewHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="view-header">
      <span className="eyebrow">{eyebrow}</span>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function SectionTitle({
  compact,
  icon: Icon,
  title,
}: {
  compact?: boolean;
  icon: typeof Activity;
  title: string;
}) {
  return (
    <div className={clsx("section-title", compact && "compact")}>
      <Icon size={compact ? 15 : 17} />
      <h2>{title}</h2>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  tone = "neutral",
  value,
}: {
  icon: typeof Activity;
  label: string;
  tone?: StatusTone;
  value: string;
}) {
  return (
    <article className={clsx("metric-tile", `tone-${tone}`)}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return <span className={clsx("status-pill", `tone-${tone}`)}>{label}</span>;
}

function RiskDot({ tone }: { tone: StatusTone }) {
  return <span className={clsx("risk-dot", `tone-${tone}`)} />;
}

function ProgressBar({ tone, value }: { tone: StatusTone; value: number }) {
  return (
    <div className="progress-track" aria-label={`${value}%`}>
      <span className={clsx("progress-fill", `tone-${tone}`)} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function BriefItem({ label, tone, value }: { label: string; tone: StatusTone; value: string }) {
  return (
    <div className="brief-item">
      <span>{label}</span>
      <strong>{value}</strong>
      <RiskDot tone={tone} />
    </div>
  );
}

function Guardrail({ label, tone, value }: { label: string; tone: StatusTone; value: string }) {
  return (
    <div className="guardrail">
      <RiskDot tone={tone} />
      <span>
        <strong>{label}</strong>
        <small>{value}</small>
      </span>
    </div>
  );
}

function AuditList({ compact, events }: { compact?: boolean; events: AuditEvent[] }) {
  return (
    <div className={clsx("audit-list", compact && "compact")}>
      {events.map((event) => (
        <div className="audit-row" key={event.id}>
          <span className="audit-time">{event.time}</span>
          <span>
            <strong>{event.title}</strong>
            <small>{event.actor} - {event.detail}</small>
          </span>
        </div>
      ))}
    </div>
  );
}

function ControlItem({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="control-item">
      <FileCheck2 size={17} />
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
    </div>
  );
}

function ScenarioCard({
  detail,
  title,
  tone,
  value,
}: {
  detail: string;
  title: string;
  tone: StatusTone;
  value: string;
}) {
  return (
    <article className={clsx("scenario-card", `tone-${tone}`)}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function SettingsSection({
  icon: Icon,
  items,
  title,
}: {
  icon: typeof Activity;
  items: string[];
  title: string;
}) {
  return (
    <section className="surface settings-section">
      <SectionTitle icon={Icon} title={title} />
      <ul>
        {items.map((item) => (
          <li key={item}>
            <Check size={15} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default App;
