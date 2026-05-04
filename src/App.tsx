import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
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
  Plus,
  Play,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  UserPlus,
  Upload,
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
  Account,
  Client,
  ComplianceReview,
  Goal,
  Meeting,
  MeetingAction,
  NavItem,
  Role,
  StatusTone,
  TeamMember,
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

type SearchResult = {
  id: string;
  label: string;
  detail: string;
  tone: StatusTone;
  view: ViewKey;
  clientId?: string;
};

const roleCopy: Record<Role, { title: string; detail: string }> = {
  Advisor: {
    title: "Advisor operating mode",
    detail: "Shows client work, AI drafts, approvals, and internal planning context.",
  },
  Compliance: {
    title: "Compliance supervision mode",
    detail: "Prioritizes review queues, evidence, audit events, and supervision controls.",
  },
  Client: {
    title: "Client-safe mode",
    detail: "Hides internal AI reasoning, compliance notes, and staff workload details.",
  },
};

function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [role, setRole] = useState<Role>("Advisor");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [agentHealthOpen, setAgentHealthOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clients[0].id);
  const [selectedMeetingId, setSelectedMeetingId] = useState(meetings[0].id);
  const [actions, setActions] = useState<MeetingAction[]>(initialMeetingActions);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [reviews, setReviews] = useState<ComplianceReview[]>(initialComplianceReviews);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(initialAuditEvents);
  const [requestedDocuments, setRequestedDocuments] = useState<string[]>([]);
  const [agentInstructions, setAgentInstructions] = useState<Record<string, string>>({});

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? clients[0];
  const openReviews = reviews.filter((review) => review.status === "Open");
  const pendingActions = actions.filter((action) => action.status === "Pending");
  const agentHealth = Math.round(
    sum(agents.map((agent) => agent.confidence)) / Math.max(agents.length, 1),
  );
  const visibleNavItems = useMemo(() => {
    if (role === "Client") {
      return navItems.filter((item) =>
        ["dashboard", "clients", "meeting", "portfolio"].includes(item.key),
      );
    }

    if (role === "Compliance") {
      return navItems.filter((item) => item.key !== "team");
    }

    return navItems;
  }, [role]);

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

  const searchResults = useMemo<SearchResult[]>(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const resultSet: SearchResult[] = [];

    clients.forEach((client) => {
      const searchable = [
        client.name,
        client.household,
        client.segment,
        client.primaryGoal,
        ...client.lifeEvents,
        ...client.documents.map((document) => document.title),
      ]
        .join(" ")
        .toLowerCase();

      if (searchable.includes(normalized)) {
        resultSet.push({
          id: `client-${client.id}`,
          label: client.household,
          detail: `${client.segment} - ${client.primaryGoal}`,
          tone: client.retentionRisk,
          view: "clients",
          clientId: client.id,
        });
      }
    });

    meetings.forEach((meeting) => {
      const client = clients.find((item) => item.id === meeting.clientId);
      if ([meeting.title, meeting.summary, ...(meeting.transcript ?? [])].join(" ").toLowerCase().includes(normalized)) {
        resultSet.push({
          id: `meeting-${meeting.id}`,
          label: meeting.title,
          detail: client?.household ?? "Meeting",
          tone: meeting.sentiment,
          view: "meeting",
          clientId: meeting.clientId,
        });
      }
    });

    agents.forEach((agent) => {
      if ([agent.name, agent.specialty, agent.currentTask, agent.lastReasoning].join(" ").toLowerCase().includes(normalized)) {
        resultSet.push({
          id: `agent-${agent.id}`,
          label: agent.name,
          detail: `${agent.status} - ${agent.currentTask}`,
          tone: agent.status === "Active" ? "good" : agent.status === "Paused" ? "neutral" : "warn",
          view: "agents",
        });
      }
    });

    reviews.forEach((review) => {
      const client = clients.find((item) => item.id === review.clientId);
      if ([review.title, review.category, review.evidence, client?.household].join(" ").toLowerCase().includes(normalized)) {
        resultSet.push({
          id: `review-${review.id}`,
          label: review.title,
          detail: `${review.category} - ${review.status}`,
          tone: review.severity,
          view: "compliance",
          clientId: review.clientId,
        });
      }
    });

    auditEvents.forEach((event) => {
      if ([event.title, event.actor, event.detail, event.category].join(" ").toLowerCase().includes(normalized)) {
        resultSet.push({
          id: `audit-${event.id}`,
          label: event.title,
          detail: `${event.actor} - ${event.detail}`,
          tone: event.category === "Compliance" ? "warn" : "info",
          view: "compliance",
        });
      }
    });

    return resultSet.slice(0, 8);
  }, [agents, auditEvents, query, reviews]);

  const suggestedSearchResults = useMemo<SearchResult[]>(
    () => [
      {
        id: "suggest-client",
        label: selectedClient.household,
        detail: "Open selected household profile",
        tone: selectedClient.retentionRisk,
        view: "clients",
        clientId: selectedClient.id,
      },
      {
        id: "suggest-meeting",
        label: "Meeting history",
        detail: "Open prep, transcript, and recap workspace",
        tone: "info",
        view: "meeting",
        clientId: selectedClient.id,
      },
      {
        id: "suggest-compliance",
        label: "Open compliance reviews",
        detail: `${openReviews.length} open items require supervision`,
        tone: openReviews.length ? "danger" : "good",
        view: "compliance",
      },
      {
        id: "suggest-agent",
        label: "Agent health",
        detail: `${agentHealth}% aggregate confidence across ${agents.length} agents`,
        tone: agentHealth > 85 ? "good" : "warn",
        view: "agents",
      },
      {
        id: "suggest-ips",
        label: "IPS exceptions",
        detail: "Single issuer and held-away insurance exceptions",
        tone: "danger",
        view: "portfolio",
        clientId: selectedClient.id,
      },
    ],
    [agentHealth, agents.length, openReviews.length, selectedClient],
  );

  const visibleSearchResults = query.trim() ? searchResults : suggestedSearchResults;

  const openSearchResult = (result: SearchResult) => {
    if (result.clientId) setSelectedClientId(result.clientId);
    const meeting = meetings.find((item) => item.clientId === result.clientId);
    if (result.view === "meeting" && meeting) setSelectedMeetingId(meeting.id);
    setActiveView(result.view);
    setQuery("");
    setSearchFocused(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const requestRevision = (id: string) => {
    const action = actions.find((item) => item.id === id);
    if (!action) return;

    setActions((items) =>
      items.map((item) => (item.id === id ? { ...item, status: "Revision requested" } : item)),
    );
    addAudit(
      "Compliance",
      role,
      `Revision requested: ${action.title}`,
      "Returned to the advisor workspace with comments before any client delivery.",
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

  const updateAgentAutonomy = (id: string, autonomy: Agent["autonomy"]) => {
    const agent = agents.find((item) => item.id === id);
    if (!agent) return;

    setAgents((items) => items.map((item) => (item.id === id ? { ...item, autonomy } : item)));
    addAudit("System", "Agent Control", `Autonomy updated: ${agent.name}`, `New mode: ${autonomy}.`);
  };

  const saveAgentInstruction = (id: string, instruction: string) => {
    const agent = agents.find((item) => item.id === id);
    if (!agent || !instruction.trim()) return;

    setAgentInstructions((items) => ({ ...items, [id]: instruction.trim() }));
    addAudit(
      "Human",
      role,
      `Instruction saved: ${agent.name}`,
      instruction.trim(),
    );
  };

  const requestDocument = (title: string) => {
    const request = `${selectedClient.household}: ${title}`;
    setRequestedDocuments((items) => (items.includes(request) ? items : [request, ...items]));
    addAudit("Human", role, `Document requested: ${title}`, `${selectedClient.household} request added to follow-up queue.`);
  };

  const selectRole = (nextRole: Role) => {
    setRole(nextRole);
    if (nextRole === "Client" && !["dashboard", "clients", "meeting", "portfolio"].includes(activeView)) {
      setActiveView("clients");
    }
    if (nextRole === "Compliance" && activeView === "team") {
      setActiveView("compliance");
    }
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
            role={role}
            selectedClient={selectedClient}
            setActiveView={setActiveView}
            setSelectedClientId={setSelectedClientId}
            setSelectedMeetingId={setSelectedMeetingId}
          />
        );
      case "clients":
        return (
          <ClientHub
            clients={filteredClients}
            requestedDocuments={requestedDocuments}
            requestDocument={requestDocument}
            role={role}
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
            meetings={meetings}
            rejectAction={rejectAction}
            requestRevision={requestRevision}
            selectedMeetingId={selectedMeetingId}
            selectedClient={selectedClient}
            setSelectedClientId={setSelectedClientId}
            setSelectedMeetingId={setSelectedMeetingId}
          />
        );
      case "agents":
        return (
          <AgentSwarm
            agentInstructions={agentInstructions}
            agents={agents}
            auditEvents={auditEvents}
            saveAgentInstruction={saveAgentInstruction}
            toggleAgent={toggleAgent}
            updateAgentAutonomy={updateAgentAutonomy}
          />
        );
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
        return <TeamOs actions={actions} />;
      case "settings":
        return <SettingsView addAudit={addAudit} />;
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
          {visibleNavItems.map((item) => {
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
          <small className="sidebar-help">
            {toneLabel[selectedClient.retentionRisk]} retention signal from meetings, document gaps, and next-gen sentiment.
          </small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="search-wrapper">
            <div className="search-shell">
              <Search size={18} />
              <input
                aria-label="Search clients and work"
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && visibleSearchResults[0]) {
                    openSearchResult(visibleSearchResults[0]);
                  }
                }}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search clients, assets, agents, compliance"
                value={query}
              />
            </div>
            {(searchFocused || query.trim()) && (
              <div className="search-results" onMouseDown={(event) => event.preventDefault()}>
                <div className="search-caption">
                  {query.trim() ? "Search results" : "Suggested jumps"}
                </div>
                {visibleSearchResults.length ? (
                  visibleSearchResults.map((result) => (
                    <button
                      className="search-result"
                      key={result.id}
                      onClick={() => openSearchResult(result)}
                      type="button"
                    >
                      <RiskDot tone={result.tone} />
                      <span>
                        <strong>{result.label}</strong>
                        <small>{result.detail}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">No matching clients, work, agents, or audit events.</div>
                )}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            <div className="segmented" aria-label="Role switcher">
              {(["Advisor", "Compliance", "Client"] as Role[]).map((item) => (
                <button
                  className={clsx(role === item && "active")}
                  key={item}
                  onClick={() => selectRole(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="health-wrapper">
              <button className="agent-health" onClick={() => setAgentHealthOpen((value) => !value)} type="button">
                <Activity size={17} />
                <span>{agentHealth}% agent health</span>
              </button>
              {agentHealthOpen && (
                <div className="health-popover">
                  <div className="search-caption">Agent health drill-down</div>
                  {agents.map((agent) => (
                    <button
                      className="health-row"
                      key={agent.id}
                      onClick={() => {
                        setActiveView("agents");
                        setAgentHealthOpen(false);
                      }}
                      type="button"
                    >
                      <RiskDot tone={agent.confidence > 85 ? "good" : agent.status === "Paused" ? "neutral" : "warn"} />
                      <span>
                        <strong>{agent.name}</strong>
                        <small>{agent.confidence}% confidence - {agent.status}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-grid">
          <section className="workspace">
            <RoleModeBanner role={role} />
            {renderView()}
          </section>
          <IntelligencePanel
            activeView={activeView}
            auditEvents={auditEvents}
            openReviews={openReviews}
            pendingActions={pendingActions}
            role={role}
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
  role: Role;
  selectedClient: Client;
  setActiveView: (view: ViewKey) => void;
  setSelectedClientId: (id: string) => void;
  setSelectedMeetingId: (id: string) => void;
};

function Dashboard({
  actions,
  auditEvents,
  clients: visibleClients,
  openReviews,
  pendingActions,
  role,
  selectedClient,
  setActiveView,
  setSelectedClientId,
  setSelectedMeetingId,
}: DashboardProps) {
  const [dashboardFilter, setDashboardFilter] = useState<"risk" | "approvals" | "reviews" | "cleared" | null>(null);
  const totalAum = sum(clients.map((client) => client.aum));
  const criticalHouseholds = clients.filter((client) => client.retentionRisk !== "good").length;
  const approvedToday = actions.filter((action) => action.status === "Approved").length;
  const atRiskClients = clients.filter((client) => client.retentionRisk !== "good");
  const approvedActions = actions.filter((action) => action.status === "Approved");

  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow={role === "Compliance" ? "Supervision Command" : role === "Client" ? "Client Portal" : "Advisor Command"}
        title={role === "Compliance" ? "Review Today" : "Today"}
        subtitle={
          role === "Compliance"
            ? "Open reviews, audit exceptions, escalations, and evidence packages."
            : role === "Client"
              ? "Shared plan progress, upcoming meetings, and portfolio context."
              : "Today's advisor operating queue across client work and evidence."
        }
      />

      <div className="metric-grid">
        <MetricTile icon={CircleDollarSign} label="AUM covered" onClick={() => setActiveView("portfolio")} value={formatMoney(totalAum)} />
        <MetricTile icon={AlertTriangle} label="At-risk households" onClick={() => setDashboardFilter("risk")} tone="warn" value={`${criticalHouseholds}`} />
        <MetricTile icon={ClipboardCheck} label="Pending approvals" onClick={() => setDashboardFilter("approvals")} tone="info" value={`${pendingActions.length}`} />
        <MetricTile icon={ShieldCheck} label={role === "Compliance" ? "Open reviews" : "Cleared today"} onClick={() => setDashboardFilter(role === "Compliance" ? "reviews" : "cleared")} tone={role === "Compliance" ? "danger" : "good"} value={`${role === "Compliance" ? openReviews.length : approvedToday}`} />
      </div>

      {dashboardFilter && (
        <section className="surface focus-results">
          <div className="section-toolbar">
            <SectionTitle
              icon={dashboardFilter === "risk" ? AlertTriangle : dashboardFilter === "approvals" ? ClipboardCheck : ShieldCheck}
              title={
                dashboardFilter === "risk"
                  ? "At-Risk Households"
                  : dashboardFilter === "approvals"
                    ? "Pending Approval Queue"
                    : dashboardFilter === "reviews"
                      ? "Open Review Queue"
                      : "Cleared Actions"
              }
            />
            <button className="text-action" onClick={() => setDashboardFilter(null)} type="button">
              Clear filter <X size={15} />
            </button>
          </div>
          <div className="client-rank-list">
            {dashboardFilter === "risk" &&
              atRiskClients.map((client) => (
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
                  <span className="rank-value">{toneLabel[client.retentionRisk]}</span>
                </button>
              ))}
            {dashboardFilter === "approvals" &&
              pendingActions.map((action) => (
                <button
                  className="rank-row"
                  key={action.id}
                  onClick={() => {
                    setSelectedClientId(action.clientId);
                    setActiveView("meeting");
                  }}
                  type="button"
                >
                  <RiskDot tone={action.risk} />
                  <span>
                    <strong>{action.title}</strong>
                    <small>{clients.find((client) => client.id === action.clientId)?.household} - {action.detail}</small>
                  </span>
                  <span className="rank-value">{action.approvalGate}</span>
                </button>
              ))}
            {dashboardFilter === "reviews" &&
              openReviews.map((review) => (
                <button className="rank-row" key={review.id} onClick={() => setActiveView("compliance")} type="button">
                  <RiskDot tone={review.severity} />
                  <span>
                    <strong>{review.title}</strong>
                    <small>{review.category}</small>
                  </span>
                  <span className="rank-value">{review.status}</span>
                </button>
              ))}
            {dashboardFilter === "cleared" &&
              (approvedActions.length ? (
                approvedActions.map((action) => (
                  <div className="rank-row" key={action.id}>
                    <RiskDot tone={action.risk} />
                    <span>
                      <strong>{action.title}</strong>
                      <small>{action.detail}</small>
                    </span>
                    <span className="rank-value">{action.approvalGate}</span>
                  </div>
                ))
              ) : (
                <div className="empty-work-state">
                  <Check size={18} />
                  <span>
                    <strong>No cleared actions yet today</strong>
                    <small>Approved tasks will appear here with reviewer, timestamp, and evidence links.</small>
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

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
                    setSelectedMeetingId(meeting.id);
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
  requestedDocuments: string[];
  requestDocument: (title: string) => void;
  role: Role;
  selectedClient: Client;
  setActiveView: (view: ViewKey) => void;
  setSelectedClientId: (id: string) => void;
};

function ClientHub({
  clients: visibleClients,
  requestedDocuments,
  requestDocument,
  role,
  selectedClient,
  setActiveView,
  setSelectedClientId,
}: ClientHubProps) {
  const [addedGoals, setAddedGoals] = useState<Record<string, Goal[]>>({});
  const [addedAccounts, setAddedAccounts] = useState<Record<string, Account[]>>({});
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [uploadState, setUploadState] = useState<string | null>(null);
  const clientRequests = requestedDocuments.filter((item) => item.startsWith(selectedClient.household));
  const displayedGoals = [...selectedClient.goals, ...(addedGoals[selectedClient.id] ?? [])];
  const displayedAccounts = [...selectedClient.accounts, ...(addedAccounts[selectedClient.id] ?? [])];
  const connectionNote = (relation: string) => {
    if (relation === "Spouse") return "Joint governance influence and foundation oversight.";
    if (relation === "Daughter") return "Next-gen decision maker with rising retention influence.";
    if (relation === "Son") return "Education and engagement track for future succession.";
    if (relation === "Mother") return "Elder generation values anchor for continuity planning.";
    if (relation === "Nephew") return "Operating-business successor candidate under observation.";
    return "Beneficiary and family decision stakeholder.";
  };
  const addGoal = () => {
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: "New advisor-defined planning milestone",
      target: "Draft target",
      confidence: 50,
      owner: "Advisor",
      status: "info",
    };

    setAddedGoals((items) => ({
      ...items,
      [selectedClient.id]: [goal, ...(items[selectedClient.id] ?? [])],
    }));
    setGoalFormOpen(false);
  };
  const addAccount = () => {
    const account: Account = {
      id: `account-${Date.now()}`,
      name: "New held-away account",
      custodian: "Client reported",
      value: 0,
      allocation: "Pending data",
      status: "warn",
    };

    setAddedAccounts((items) => ({
      ...items,
      [selectedClient.id]: [account, ...(items[selectedClient.id] ?? [])],
    }));
    setAccountFormOpen(false);
  };

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
          <div className="family-tree">
            {selectedClient.family.map((member, index) => (
              <div className={clsx("family-node", member.relation === "Primary" && "primary")} key={member.id} style={{ gridColumn: member.relation === "Primary" ? "1 / -1" : undefined }}>
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.relation} - {member.age}</small>
                </div>
                <StatusPill tone={member.sentiment} label={member.influence} />
                <span>{member.priority}</span>
                {index > 0 && <small>{connectionNote(member.relation)}</small>}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="two-column">
        <section className="surface">
          <SectionTitle icon={CalendarPlus} title="Life Event Timeline" />
          <div className="event-timeline">
            {selectedClient.lifeEvents.map((event, index) => (
              <div className="event-row" key={event}>
                <span className="event-index">{index + 1}</span>
                <span>
                  <strong>{event}</strong>
                  <small>{index === 0 ? "Trigger: create planning task today" : "Monitor and refresh assumptions"}</small>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface">
          <SectionTitle icon={Upload} title="Document Requests" />
          <div className="request-actions">
            {selectedClient.documents
              .filter((document) => document.status !== "good")
              .map((document) => (
                <button className="secondary-action" key={document.id} onClick={() => requestDocument(document.title)} type="button">
                  <Upload size={16} /> Request {document.type}
                </button>
              ))}
            <button
              className="secondary-action"
              onClick={() => setUploadState("New document staged for OCR and advisor review")}
              type="button"
            >
              <Upload size={16} /> Upload document
            </button>
          </div>
          {uploadState && <div className="inline-form success-form">{uploadState}</div>}
          <div className="data-list">
            {(clientRequests.length ? clientRequests : [`${selectedClient.household}: No active document requests`]).map((request) => (
              <div className="data-row single" key={request}>
                <span>
                  <strong>{request.replace(`${selectedClient.household}: `, "")}</strong>
                  <small>{clientRequests.length ? "Request queued for client follow-up" : "All current document needs are visible below"}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="three-column">
        <section className="surface">
          <div className="section-toolbar">
            <SectionTitle icon={Landmark} title="Accounts" />
            <button className="secondary-action" onClick={addAccount} type="button">
              <Plus size={16} /> Quick add
            </button>
            <button className="secondary-action" onClick={() => setAccountFormOpen((value) => !value)} type="button">
              <FileText size={16} /> Form
            </button>
          </div>
          {accountFormOpen && (
            <div className="inline-form">
              <label>
                Account name
                <input readOnly value="New held-away account" />
              </label>
              <label>
                Custodian
                <input readOnly value="Client reported" />
              </label>
              <button className="primary-action" onClick={addAccount} type="button">
                <Save size={16} /> Add account
              </button>
            </div>
          )}
          <div className="data-list">
            {displayedAccounts.map((account) => (
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
          <div className="section-toolbar">
            <SectionTitle icon={Gauge} title="Goals" />
            <button className="secondary-action" onClick={addGoal} type="button">
              <Target size={16} /> Quick add
            </button>
            <button className="secondary-action" onClick={() => setGoalFormOpen((value) => !value)} type="button">
              <FileText size={16} /> Form
            </button>
          </div>
          {goalFormOpen && (
            <div className="inline-form">
              <label>
                Goal title
                <input readOnly value="New advisor-defined planning milestone" />
              </label>
              <label>
                Target date
                <input readOnly value="Draft target" />
              </label>
              <button className="primary-action" onClick={addGoal} type="button">
                <Save size={16} /> Add goal
              </button>
            </div>
          )}
          <div className="data-list">
            {displayedGoals.map((goal) => (
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
        <SectionTitle icon={Sparkles} title={role === "Client" ? "Shared Plan Actions" : "Advisor Recommendations"} />
        <div className="recommendation-grid">
          {selectedClient.recommendations.map((recommendation) => (
            <article className="recommendation" key={recommendation.id}>
              <div className="recommendation-top">
                <strong>{recommendation.title}</strong>
                <StatusPill tone={recommendation.conflictCheck} label={role === "Client" ? "Advisor reviewed" : recommendation.gate} />
              </div>
              <p>
                {role === "Client"
                  ? "Your advisor is reviewing this planning action before it becomes part of your shared plan."
                  : recommendation.rationale}
              </p>
              <ProgressBar value={recommendation.confidence} tone={recommendation.conflictCheck} />
            </article>
          ))}
        </div>
        <div className="toolbar-row">
          <button className="primary-action" onClick={() => setActiveView("meeting")} type="button">
            <MessageSquareText size={16} /> Open next meeting
          </button>
          {role !== "Client" && (
            <button className="secondary-action" onClick={() => requestDocument("New planning goal intake")} type="button">
              <Plus size={16} /> Add goal intake
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

type MeetingAssistantProps = {
  actions: MeetingAction[];
  approveAction: (id: string) => void;
  meetings: Meeting[];
  rejectAction: (id: string) => void;
  requestRevision: (id: string) => void;
  selectedMeetingId: string;
  selectedClient: Client;
  setSelectedClientId: (id: string) => void;
  setSelectedMeetingId: (id: string) => void;
};

function MeetingAssistant({
  actions,
  approveAction,
  meetings: meetingList,
  rejectAction,
  requestRevision,
  selectedMeetingId,
  selectedClient,
  setSelectedClientId,
  setSelectedMeetingId,
}: MeetingAssistantProps) {
  const [meetingStage, setMeetingStage] = useState<"Prep" | "Live" | "Follow-up">("Prep");
  const [transcriptDraft, setTranscriptDraft] = useState("");
  const [processedSignals, setProcessedSignals] = useState<string[]>([]);
  const [recapVisible, setRecapVisible] = useState(true);
  const meeting =
    meetingList.find((item) => item.id === selectedMeetingId) ??
    meetingList.find((item) => item.clientId === selectedClient.id) ??
    meetingList[0];
  const clientActions = actions.filter((action) => action.clientId === selectedClient.id);
  const transcriptLines = [...meeting.transcript, ...processedSignals];
  const processTranscript = () => {
    const draft = transcriptDraft.trim();
    if (!draft) return;

    const firstLine = draft.split("\n").find(Boolean) ?? draft;
    setProcessedSignals((items) => [
      `Extracted concern: ${firstLine.slice(0, 110)}${firstLine.length > 110 ? "..." : ""}`,
      "Action candidate: update recap, source evidence, and approval queue from pasted transcript.",
      ...items,
    ]);
    setTranscriptDraft("");
  };

  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="Meeting Assistant"
        title={meeting.title}
        subtitle={`${selectedClient.household} - ${meeting.time} - ${meeting.duration}`}
      />

      <section className="surface">
        <SectionTitle icon={CalendarDays} title="Calendar and Meeting History" />
        <div className="meeting-switcher">
          {meetingList.map((item) => {
            const client = clients.find((entry) => entry.id === item.clientId);
            return (
              <button
                className={clsx("meeting-card", item.id === meeting.id && "active")}
                key={item.id}
                onClick={() => {
                  setSelectedMeetingId(item.id);
                  setSelectedClientId(item.clientId);
                }}
                type="button"
              >
                <span className="timeline-time">{item.time}</span>
                <strong>{item.title}</strong>
                <small>{client?.household} - {item.duration}</small>
                <StatusPill tone={item.sentiment} label={item.stage} />
              </button>
            );
          })}
        </div>
      </section>

      <div className="two-column">
        <section className="surface">
          <SectionTitle icon={Clock3} title="Meeting Brief" />
          <div className="segmented local-tabs">
            {(["Prep", "Live", "Follow-up"] as const).map((stage) => (
              <button
                className={clsx(meetingStage === stage && "active")}
                key={stage}
                onClick={() => setMeetingStage(stage)}
                type="button"
              >
                {stage}
              </button>
            ))}
          </div>
          <div className="brief-grid">
            <BriefItem label="Stage" value={meetingStage} tone={meeting.sentiment} />
            <BriefItem label="Client objective" value={selectedClient.primaryGoal} tone="info" />
            <BriefItem label="Risk score" value={`${selectedClient.riskScore}/100`} tone={selectedClient.retentionRisk} />
            <BriefItem label="Next event" value={selectedClient.lifeEvents[0]} tone="warn" />
          </div>
          <p className="body-copy">{meeting.summary}</p>
        </section>

        <section className="surface">
          <SectionTitle icon={FileText} title="Transcript Signals" />
          <div className="quote-list">
            {transcriptLines.map((line) => (
              <blockquote key={line}>{line}</blockquote>
            ))}
          </div>
          <textarea
            className="transcript-input"
            onChange={(event) => setTranscriptDraft(event.target.value)}
            placeholder="Paste transcript notes or meeting audio summary here"
            value={transcriptDraft}
          />
          <div className="toolbar-row">
            <button className="primary-action" disabled={!transcriptDraft.trim()} onClick={processTranscript} type="button">
              <Sparkles size={16} /> Extract signals
            </button>
            <small>{processedSignals.length} extracted signals added in this session</small>
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
                    <button className="icon-button" onClick={() => requestRevision(action.id)} title="Request revision" type="button">
                      <ArrowRight size={17} />
                    </button>
                  </>
                ) : (
                  <StatusPill tone={action.status === "Approved" ? "good" : action.status === "Rejected" ? "danger" : "warn"} label={action.status} />
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface">
        <SectionTitle icon={MessageSquareText} title="Post-Meeting Recap" />
        <div className="recap-shell">
          <div>
            <strong>{selectedClient.name} follow-up draft</strong>
            <p>
              Thank you for the conversation. We will confirm the open assumptions, route regulated language for review, and return with an advisor-approved action plan.
            </p>
            {recapVisible && (
              <div className="recap-steps">
                <Guardrail label="Client-ready summary" value="Advisor approval required before send" tone="info" />
                <Guardrail label="Open source items" value={`${transcriptLines.length} transcript signals attached`} tone="good" />
                <Guardrail label="Follow-up tasks" value={`${clientActions.length} action drafts generated`} tone="warn" />
              </div>
            )}
          </div>
          <button className="primary-action" onClick={() => setRecapVisible((value) => !value)} type="button">
            <Save size={16} /> {recapVisible ? "Hide recap detail" : "Generate recap"}
          </button>
        </div>
      </section>
    </div>
  );
}

type AgentSwarmProps = {
  agentInstructions: Record<string, string>;
  agents: Agent[];
  auditEvents: AuditEvent[];
  saveAgentInstruction: (id: string, instruction: string) => void;
  toggleAgent: (id: string) => void;
  updateAgentAutonomy: (id: string, autonomy: Agent["autonomy"]) => void;
};

function AgentSwarm({
  agentInstructions,
  agents,
  auditEvents,
  saveAgentInstruction,
  toggleAgent,
  updateAgentAutonomy,
}: AgentSwarmProps) {
  const [draftInstructions, setDraftInstructions] = useState<Record<string, string>>({});

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
                className={clsx("agent-toggle", agent.status === "Paused" && "paused")}
                onClick={() => toggleAgent(agent.id)}
                title={agent.status === "Paused" ? "Resume agent" : "Pause agent"}
                type="button"
              >
                {agent.status === "Paused" ? <Play size={17} /> : <Pause size={17} />}
                <span>{agent.status === "Paused" ? "Resume" : "Pause"}</span>
              </button>
            </div>
            <div className="agent-meta">
              <StatusPill tone={agent.status === "Active" ? "good" : agent.status === "Paused" ? "neutral" : "warn"} label={agent.status} />
              <select
                className="select-control"
                onChange={(event) => updateAgentAutonomy(agent.id, event.target.value as Agent["autonomy"])}
                value={agent.autonomy}
              >
                <option>Observe</option>
                <option>Draft</option>
                <option>Execute with approval</option>
                <option>Blocked</option>
              </select>
            </div>
            <ProgressBar value={agent.confidence} tone={agent.confidence > 85 ? "good" : "warn"} />
            <p>{agent.currentTask}</p>
            <div className="reasoning-box">
              <span>Reasoning</span>
              <small>{agent.lastReasoning}</small>
            </div>
            <div className="instruction-box">
              <input
                onChange={(event) =>
                  setDraftInstructions((items) => ({ ...items, [agent.id]: event.target.value }))
                }
                placeholder="Add household-specific instruction"
                value={draftInstructions[agent.id] ?? agentInstructions[agent.id] ?? ""}
              />
              <button
                className="secondary-action"
                onClick={() => saveAgentInstruction(agent.id, draftInstructions[agent.id] ?? agentInstructions[agent.id] ?? "")}
                type="button"
              >
                <Save size={16} /> Save
              </button>
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

      <section className="surface">
        <SectionTitle icon={Activity} title="Agent Activity Log" />
        <AuditList
          events={auditEvents.filter((event) => event.category === "AI" || event.actor.includes("Agent")).slice(0, 6)}
        />
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
  const [auditFilter, setAuditFilter] = useState("All");
  const filteredEvents =
    auditFilter === "All" ? auditEvents : auditEvents.filter((event) => event.category === auditFilter);

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
                  className="secondary-action"
                  disabled={review.status !== "Open"}
                  onClick={() => updateReview(review.id, "Revision requested")}
                  type="button"
                >
                  <ArrowRight size={16} /> Request revision
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
        <div className="section-toolbar">
          <SectionTitle icon={FileCheck2} title="Immutable Audit Timeline" />
          <div className="segmented local-tabs">
            {["All", "AI", "Human", "Compliance", "System"].map((item) => (
              <button
                className={clsx(auditFilter === item && "active")}
                key={item}
                onClick={() => setAuditFilter(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <AuditList events={filteredEvents} />
      </section>

      <section className="surface">
        <SectionTitle icon={Clock3} title="Escalation Routing" />
        <div className="guardrail-grid">
          <Guardrail label="Critical" value="Compliance partner within 2 business hours" tone="danger" />
          <Guardrail label="Watch" value="Advisor revision within same day" tone="warn" />
          <Guardrail label="Info" value="Archive with disclosure evidence" tone="info" />
          <Guardrail label="Approved" value="Release to advisor-controlled send queue" tone="good" />
        </div>
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
  const [salePercent, setSalePercent] = useState(12);
  const [liquidityMonths, setLiquidityMonths] = useState(18);
  const [period, setPeriod] = useState("YTD");
  const projectedTaxSavings = Math.round(salePercent * 150000);

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
        <MetricTile icon={FileCheck2} label="IPS exceptions" onClick={() => document.getElementById("ips-exceptions")?.scrollIntoView({ behavior: "smooth", block: "start" })} tone="danger" value="2" />
      </div>

      <IpsExceptions />

      <section className="surface">
        <SectionTitle icon={BarChart3} title="Allocation Overview" />
        <div className="allocation-bar">
          {portfolioAssets.map((asset) => (
            <span
              className={clsx("allocation-segment", `tone-${asset.risk}`, `asset-${asset.id}`)}
              key={asset.id}
              style={{ width: `${asset.weight}%` }}
              title={`${asset.name}: ${asset.weight}%`}
            />
          ))}
        </div>
        <div className="allocation-legend">
          {portfolioAssets.map((asset) => (
            <span className={clsx("asset-legend", `asset-${asset.id}`)} key={asset.id}>
              <RiskDot tone={asset.risk} /> {asset.name} {asset.weight}%
            </span>
          ))}
        </div>
      </section>

      <section className="surface">
        <div className="section-toolbar">
          <SectionTitle icon={Landmark} title="Enterprise Exposure" />
          <div className="segmented local-tabs">
            {["YTD", "1Y", "3Y"].map((item) => (
              <button className={clsx(period === item && "active")} key={item} onClick={() => setPeriod(item)} type="button">
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="asset-table">
          {portfolioAssets.map((asset) => (
            <div className={clsx("asset-row", `asset-${asset.id}`)} key={asset.id}>
              <span>
                <strong>{asset.name}</strong>
                <small>{asset.type} - {asset.note}</small>
              </span>
              <span className="numeric">{formatFullMoney(asset.value)}</span>
              <div className="bar-cell">
                <ProgressBar value={asset.weight} tone={asset.risk} />
                <small>{asset.weight}% allocation - {period} return view</small>
              </div>
              <StatusPill tone={asset.risk} label={toneLabel[asset.risk]} />
            </div>
          ))}
        </div>
      </section>

      <div className="three-column">
        <ScenarioCard title="Tax-aware sale" value={formatFullMoney(projectedTaxSavings)} detail={`${salePercent}% staged sale with charitable lot harvesting.`} tone="good" />
        <ScenarioCard title="Liquidity stress" value={`${liquidityMonths - 4} mo`} detail="Private call plus care reserve remains funded." tone="warn" />
        <ScenarioCard title="Held-away cleanup" value="$3.9M" detail="Insurance policy requires beneficiary and fee review." tone="danger" />
      </div>

      <section className="surface">
        <SectionTitle icon={SlidersHorizontal} title="Scenario Model Inputs" />
        <div className="slider-grid">
          <label>
            Founder stock sale
            <input max="30" min="0" onChange={(event) => setSalePercent(Number(event.target.value))} type="range" value={salePercent} />
            <strong>{salePercent}%</strong>
          </label>
          <label>
            Target liquidity runway
            <input max="30" min="6" onChange={(event) => setLiquidityMonths(Number(event.target.value))} type="range" value={liquidityMonths} />
            <strong>{liquidityMonths} months</strong>
          </label>
        </div>
      </section>

    </div>
  );
}

function IpsExceptions() {
  return (
    <section className="surface alert-surface" id="ips-exceptions">
      <SectionTitle icon={FileCheck2} title="IPS Exceptions" />
      <div className="data-list">
        <div className="data-row single">
          <span>
            <strong>Single issuer exposure exceeds target range</strong>
            <small>Chen founder stock is 20% of enterprise exposure; IPS target is below 15% unless a sale plan is active.</small>
          </span>
          <StatusPill tone="warn" label="Open" />
        </div>
        <div className="data-row single">
          <span>
            <strong>Held-away insurance metadata incomplete</strong>
            <small>Walker annuity lacks beneficiary, fee, and surrender-window evidence.</small>
          </span>
          <StatusPill tone="danger" label="Open" />
        </div>
      </div>
    </section>
  );
}

function TeamOs({ actions }: { actions: MeetingAction[] }) {
  const [extraTeam, setExtraTeam] = useState<TeamMember[]>([]);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [delegationOpen, setDelegationOpen] = useState(false);
  const [teamSelection, setTeamSelection] = useState("Mina Patel");
  const [removedMember, setRemovedMember] = useState<string | null>(null);
  const [delegationDecision, setDelegationDecision] = useState<string | null>(null);
  const people = [...team, ...extraTeam];
  const humanTasks = [
    {
      id: "human-1",
      title: "Call Elaine before board vote",
      owner: "Sarah Mitchell",
      due: "Today",
      risk: "warn" as StatusTone,
      status: "Scheduled",
      detail: "Confirm liquidity language and family council framing.",
    },
    {
      id: "human-2",
      title: "Review recap tax assumptions",
      owner: "David Rao",
      due: "Today",
      risk: "good" as StatusTone,
      status: "In progress",
      detail: "Compare 10b5-1 scenario and charitable lot strategy.",
    },
    {
      id: "human-3",
      title: "Prepare Walker attorney packet",
      owner: "Mina Patel",
      due: "Tomorrow",
      risk: "danger" as StatusTone,
      status: "Blocked",
      detail: "Waiting on trust restatement and healthcare proxy.",
    },
    {
      id: "human-4",
      title: "Approve AI policy exception",
      owner: "Jon Bell",
      due: "This week",
      risk: "info" as StatusTone,
      status: "Review",
      detail: "Review advisor override threshold for client-ready drafts.",
    },
  ];
  const addTeamMember = () => {
    const member: TeamMember = {
      id: `tm-${Date.now()}`,
      name: "Priya Shah",
      role: "Associate Advisor",
      capacity: 42,
      focus: "Newly assigned onboarding and review support",
      risk: "info",
    };

    setExtraTeam((items) => (items.some((item) => item.name === member.name) ? items : [...items, member]));
    setTeamFormOpen(false);
  };

  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="Practice Management"
        title="Team OS"
        subtitle="Capacity, delegation, mentorship capture, and client-service risk."
      />

      <div className="team-grid">
        {people.map((member) => (
          <div className="team-panel-wrap" key={member.id}>
            <button
              className={clsx("team-panel", teamSelection === member.name && "selected")}
              onClick={() => setTeamSelection(member.name)}
              type="button"
            >
              <div className="recommendation-top">
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.role}</small>
                </div>
                <StatusPill tone={member.risk} label={`${member.capacity}%`} />
              </div>
              <ProgressBar value={member.capacity} tone={member.risk} />
              <p>{member.focus}</p>
              <small>
                Capacity means booked work against weekly service capacity. Above 85% triggers delegation review.
              </small>
            </button>
            {member.capacity > 85 && (
              <>
                <div className="capacity-alert">
                  <AlertTriangle size={15} />
                  <span>Delegation review triggered</span>
                  <button onClick={() => setDelegationOpen(true)} type="button">Review</button>
                </div>
                {delegationOpen && member.name === "Mina Patel" && (
                  <DelegationReview
                    decision={delegationDecision}
                    onDismiss={() => setDelegationOpen(false)}
                    onDecision={setDelegationDecision}
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <section className="surface">
        <SectionTitle icon={ClipboardCheck} title="Workload Board" />
        <div className="asset-table">
          {actions.map((action) => (
            <div className="asset-row" key={action.id}>
              <span>
                <strong>{action.title}</strong>
                <small>{clients.find((client) => client.id === action.clientId)?.household} - {action.detail}</small>
              </span>
              <span className="numeric">{action.owner}</span>
              <StatusPill tone={action.risk} label={action.due} />
              <StatusPill tone={action.status === "Approved" ? "good" : action.status === "Pending" ? "warn" : "neutral"} label={action.status} />
            </div>
          ))}
          {humanTasks.map((task) => (
            <div className="asset-row human-task" key={task.id}>
              <span>
                <strong>{task.title}</strong>
                <small>{task.detail}</small>
              </span>
              <span className="numeric">{task.owner}</span>
              <StatusPill tone={task.risk} label={task.due} />
              <StatusPill tone={task.risk} label={task.status} />
            </div>
          ))}
        </div>
      </section>

      <section className="surface">
        <SectionTitle icon={BriefcaseBusiness} title="Delegation Rules" />
        <div className="policy-grid">
          <Guardrail label="High capacity" value="Shift prep tasks to AI draft mode" tone="warn" />
          <Guardrail label="Compliance partner" value="Reserve for regulated communication review" tone="good" />
          <Guardrail label="Junior advisor" value="Receive reasoning summaries before client calls" tone="info" />
          <Guardrail label="Succession" value="Capture decision rationale from senior advisors" tone="neutral" />
        </div>
        <div className="toolbar-row">
          <button className="secondary-action" onClick={() => setRulesOpen((value) => !value)} type="button">
            <SlidersHorizontal size={16} /> Configure rules
          </button>
          <button className="secondary-action danger" onClick={() => setRemovedMember(`${teamSelection} marked for removal review`)} type="button">
            <X size={16} /> Remove {teamSelection}
          </button>
        </div>
        {rulesOpen && (
          <div className="inline-form rule-editor">
            <label>
              Over-capacity threshold
              <input readOnly value="85%" />
            </label>
            <label>
              Default relief action
              <input readOnly value="Shift prep tasks to AI draft mode" />
            </label>
            <label>
              Role scope
              <input readOnly value="Client Associate: auto-suggest delegate at 85%" />
            </label>
            <label>
              Lead Advisor exception
              <input readOnly value="Escalate only after 92% or client-critical task" />
            </label>
            <button className="primary-action" onClick={() => setRulesOpen(false)} type="button">
              <Save size={16} /> Save rules
            </button>
          </div>
        )}
        {removedMember && <div className="inline-form success-form">{removedMember}</div>}
      </section>

      <section className="surface">
        <SectionTitle icon={FileText} title="Mentorship Capture" />
        <div className="guardrail-grid">
          <Guardrail label="Sarah Mitchell" value="Captured Chen liquidity rationale for junior advisor review" tone="good" />
          <Guardrail label="David Rao" value="Recorded tax scenario assumptions and open questions" tone="info" />
          <Guardrail label="Mina Patel" value="Needs delegation relief on follow-up drafting" tone="danger" />
          <Guardrail label="Jon Bell" value="Compliance patterns ready for AI policy tuning" tone="good" />
        </div>
        <div className="suggested-delegate-callout">
          <UserPlus size={17} />
          <span>
            <strong>Suggested delegate ready</strong>
            <small>Priya Shah is recommended by the delegation review and can be added from this form.</small>
          </span>
        </div>
        <div className="toolbar-row">
          <button className="secondary-action" onClick={() => setTeamFormOpen((value) => !value)} type="button">
            <UserPlus size={16} /> Add suggested delegate
          </button>
        </div>
        {teamFormOpen && (
          <div className="inline-form">
            <div className="form-note">
              <strong>Add the suggested delegate</strong>
              <small>Priya Shah is recommended by the delegation review and is prefilled for onboarding.</small>
            </div>
            <label>
              Name
              <input readOnly value="Priya Shah" />
            </label>
            <label>
              Role
              <input readOnly value="Associate Advisor" />
            </label>
            <button className="primary-action" onClick={addTeamMember} type="button">
              <Save size={16} /> Add member
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function DelegationReview({
  decision,
  onDecision,
  onDismiss,
}: {
  decision: string | null;
  onDecision: (decision: string) => void;
  onDismiss: () => void;
}) {
  return (
    <section className="surface alert-surface embedded-review">
      <div className="section-toolbar">
        <SectionTitle icon={AlertTriangle} title="Delegation Review" />
        <button className="text-action" onClick={onDismiss} type="button">
          Dismiss <X size={15} />
        </button>
      </div>
      <div className="review-grid">
        <Guardrail label="Trigger" value="Mina Patel is at 91% capacity and has a blocked Walker packet" tone="danger" />
        <Guardrail label="Suggested delegate" value="Priya Shah can absorb document prep after onboarding" tone="info" />
        <Guardrail label="Recommended action" value="Move Walker attorney packet draft to Legacy Architect + Priya review" tone="warn" />
        <Guardrail label="SLA" value="Unblock before tomorrow's Walker meeting" tone="good" />
      </div>
      <div className="toolbar-row">
        <button className="primary-action" onClick={() => onDecision("Walker attorney packet reassigned to Legacy Architect with Priya review")} type="button">
          <ArrowRight size={16} /> Reassign task
        </button>
        <button className="secondary-action" onClick={() => onDecision("Delegation recommendation snoozed until end of day")} type="button">
          <Clock3 size={16} /> Snooze
        </button>
      </div>
      {decision && <div className="inline-form success-form">{decision}</div>}
    </section>
  );
}

function SettingsView({
  addAudit,
}: {
  addAudit: (
    category: AuditEvent["category"],
    actor: string,
    title: string,
    detail: string,
  ) => void;
}) {
  const [settings, setSettings] = useState({
    externalApproval: true,
    clientTrainingOptOut: true,
    retentionYears: 7,
    confidenceThreshold: 82,
    defaultAutonomy: "Draft",
    dataSource: "CRM + Custodian + Document Vault",
  });

  const saveSettings = () => {
    addAudit(
      "System",
      "Governance Settings",
      "Governance settings saved",
      `AI threshold ${settings.confidenceThreshold}%, retention ${settings.retentionYears} years, default autonomy ${settings.defaultAutonomy}.`,
    );
  };

  return (
    <div className="view-stack">
      <ViewHeader
        eyebrow="Operating Model"
        title="Governance Settings"
        subtitle="Controls that make the product deployable inside a regulated advisory firm."
      />

      <div className="settings-grid">
        <section className="surface settings-section">
          <SectionTitle icon={LockKeyhole} title="Access Control" />
          <ToggleRow
            checked={settings.externalApproval}
            label="Require approval before external delivery"
            onChange={(checked) => setSettings((items) => ({ ...items, externalApproval: checked }))}
          />
          <label className="field-row">
            Default AI autonomy
            <select
              className="select-control wide"
              onChange={(event) => setSettings((items) => ({ ...items, defaultAutonomy: event.target.value }))}
              value={settings.defaultAutonomy}
            >
              <option>Observe</option>
              <option>Draft</option>
              <option>Execute with approval</option>
              <option>Blocked</option>
            </select>
          </label>
        </section>

        <section className="surface settings-section">
          <SectionTitle icon={FileCheck2} title="Records" />
          <label className="field-row">
            Records retention
            <input
              max="10"
              min="3"
              onChange={(event) => setSettings((items) => ({ ...items, retentionYears: Number(event.target.value) }))}
              type="number"
              value={settings.retentionYears}
            />
          </label>
          <ToggleRow
            checked={settings.clientTrainingOptOut}
            label="Exclude client data from model training"
            onChange={(checked) => setSettings((items) => ({ ...items, clientTrainingOptOut: checked }))}
          />
        </section>

        <section className="surface settings-section">
          <SectionTitle icon={Bot} title="AI Policy" />
          <label className="field-row">
            Minimum confidence before advisor review
            <input
              max="99"
              min="50"
              onChange={(event) => setSettings((items) => ({ ...items, confidenceThreshold: Number(event.target.value) }))}
              type="range"
              value={settings.confidenceThreshold}
            />
            <strong>{settings.confidenceThreshold}%</strong>
          </label>
        </section>

        <section className="surface settings-section">
          <SectionTitle icon={Landmark} title="Data Sources" />
          <label className="field-row">
            Active integration bundle
            <select
              className="select-control wide"
              onChange={(event) => setSettings((items) => ({ ...items, dataSource: event.target.value }))}
              value={settings.dataSource}
            >
              <option>CRM + Custodian + Document Vault</option>
              <option>CRM only</option>
              <option>Custodian + Portfolio Accounting</option>
              <option>Demo data sandbox</option>
            </select>
          </label>
        </section>
      </div>

      <section className="surface">
        <SectionTitle icon={Save} title="Configuration Summary" />
        <div className="guardrail-grid">
          <Guardrail label="External delivery" value={settings.externalApproval ? "Human gate active" : "Human gate disabled"} tone={settings.externalApproval ? "good" : "danger"} />
          <Guardrail label="Retention" value={`${settings.retentionYears} years`} tone="info" />
          <Guardrail label="AI threshold" value={`${settings.confidenceThreshold}%`} tone={settings.confidenceThreshold >= 80 ? "good" : "warn"} />
          <Guardrail label="Data source" value={settings.dataSource} tone="neutral" />
        </div>
        <button className="primary-action" onClick={saveSettings} type="button">
          <Save size={16} /> Save governance settings
        </button>
      </section>
    </div>
  );
}

type IntelligencePanelProps = {
  activeView: ViewKey;
  auditEvents: AuditEvent[];
  openReviews: ComplianceReview[];
  pendingActions: MeetingAction[];
  role: Role;
  selectedClient: Client;
  setActiveView: (view: ViewKey) => void;
};

function IntelligencePanel({
  activeView,
  auditEvents,
  openReviews,
  pendingActions,
  role,
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
            onClick={() => setActiveView(role === "Client" ? "clients" : recommendation.gate === "Compliance review" ? "compliance" : "meeting")}
            type="button"
          >
            <span>{recommendation.title}</span>
            <StatusPill tone={recommendation.conflictCheck} label={role === "Client" ? "Shared" : `${recommendation.confidence}%`} />
          </button>
        ))}
      </div>

      {role !== "Client" && (
        <>
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
        </>
      )}

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

function RoleModeBanner({ role }: { role: Role }) {
  return (
    <div className={clsx("role-banner", `role-${role.toLowerCase()}`)}>
      <strong>{roleCopy[role].title}</strong>
      <span>{roleCopy[role].detail}</span>
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
  onClick,
  tone = "neutral",
  value,
}: {
  icon: typeof Activity;
  label: string;
  onClick?: () => void;
  tone?: StatusTone;
  value: string;
}) {
  const Element = onClick ? "button" : "article";

  return (
    <Element className={clsx("metric-tile", onClick && "clickable", `tone-${tone}`)} onClick={onClick}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </Element>
  );
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const statusClass = `status-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

  return <span className={clsx("status-pill", `tone-${tone}`, statusClass)}>{label}</span>;
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

function ToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}

export default App;
