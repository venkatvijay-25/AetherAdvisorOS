# Aether Advisor OS Product Roadmap

This roadmap restructures the 30-feature product plan around dependency order, not only impact. The key change is that infrastructure and adoption prerequisites move ahead of advisor-facing AI features. Without live data, onboarding, integrations, and alerts, the high-impact AI modules remain demo surfaces rather than production capabilities.

## Restructure Logic

- Phase 0 answers why the product is not production-ready yet. Custodian data, CRM import, alerting, onboarding, and voice meeting capture are infrastructure, but they are also what makes the product usable.
- Dependency order matters more than impact score. Tax optimization and real-time market triggers remain high-impact, but both depend on custodian feeds.
- Three critical features were missing from the original list: Custodian Data Feeds, CRM Integration Hub, and Notification & Alert System.
- Four items were cut or merged:
  - Sentiment Drift: requires data history that does not exist yet.
  - Meeting Readiness Score: already present inside the Meeting Brief; it is a label, not a standalone feature.
  - Anniversary Alerts: useful relationship CRM feature, not a strategic differentiator for AI governance.
  - Auto-Generated Client Comms: merged into Client-Facing Memo & E-Sign.
- Final count remains 30 features across four phases.

## Phase 0 - Foundation

Ship before everything else. Nothing on the roadmap works without these capabilities.

| # | Feature | What Ships | Roadmap Note | Why It Matters |
|---|---|---|---|---|
| 01 | Custodian Data Feeds | Live sync with Schwab, Fidelity, BNY Pershing, and Altruist. | Missing from list | Highest impact. Portfolio-dependent features cannot run on mock data. |
| 02 | CRM Integration Hub | Salesforce Financial Services, Redtail, and Wealthbox import/sync. | Missing from list | Highest impact. Advisors should not rebuild years of relationship history by hand. |
| 03 | Notification & Alert System | Push, email, and in-app alerts for agent completions, compliance queues, and market triggers. | Missing from list | Highest impact. The OS must work in the background. |
| 04 | Client Onboarding Orchestration | KYC/AML, IPS goal setting, Family Map build, document vault seeding, and first agent activation. | Was P3 -> P0 | Blocker. A firm cannot add a new household without it. |
| 05 | Voice-First Meeting Intelligence | Real-time ambient transcription and meeting intelligence replacing manual transcript paste. | Was P1 -> P0 | Daily use. Every advisor meeting exposes this gap. |

## Phase 1 - Core Value

Daily advisor impact. Build within the first 6 months.

| # | Feature | What Ships | Roadmap Note | Why It Matters |
|---|---|---|---|---|
| 06 | Household Health Score | Composite household score across financial, relationship, and governance health. | Was P2 -> P1 | High impact. Gives advisors daily scan clarity. |
| 07 | Predictive Retention Explainability | Ranked drivers behind the Retention Watch signal: meeting gap, document gap, next-gen sentiment, AUM flow, and response time. | Was P1 -> P0/P1 | High impact. Converts a signal into an action plan. |
| 08 | Email & Calendar Sync | Google/Outlook calendar sync plus email signal extraction for client and compliance context. | Missing from list | High impact. Table stakes for an advisor OS. |
| 09 | Embedded Document Intelligence (RAG) | Natural language Q&A over the document vault plus contradiction detection. | Correctly placed | High impact. Turns documents into usable context. |
| 10 | Compliance Co-Pilot Pre-Check | Inline guardrails before drafts enter compliance review. | Correctly placed | High impact. Reduces review queue volume before submission. |
| 11 | Agent Reasoning Replay | Step-by-step replay of what an agent read, considered, and excluded. | Was P2 -> P1 | Trust driver. Supports advisor confidence and regulatory exam readiness. |
| 12 | Scenario Simulation Studio | Real what-if modeling for liquidity events, stock sales, charitable gifts, and allocation shifts. | Correctly placed | High impact. Current sliders are not enough. |
| 13 | Client-Facing Memo & E-Sign | Branded compliant memo/PDF delivery, read receipt, and e-signature tied to audit trail. | Was P2 -> P1 | Medium effort. Brings approved work into the client workflow. |
| 14 | Life Event Prediction Engine | AI predicts life events from age, family structure, portfolio signals, and document patterns. | Correctly placed | Differentiator. Moves Aether from reactive to predictive. |
| 15 | Firm-Level Practice Analytics | AUM growth, retention rate, compliance events, and agent utilization ROI for principals and managing partners. | Missing from list | Sells deals. Enterprise buyers need ROI visibility. |
| 16 | Tax Optimization Engine | Continuous harvesting, wash-sale, charitable lot, and Roth conversion opportunity monitoring. | Dependent on #01 | High impact. Requires custodian feeds first. |
| 17 | Real-Time Market Event Triggers | Auto-create tasks when household-specific market thresholds are breached. | Dependent on #01 | High impact. Requires live custodial data. |

## Phase 2 - Competitive Edge

6-12 month moat builders. These make switching cost prohibitive once advisors are live.

| # | Feature | What Ships | Roadmap Note | Why It Matters |
|---|---|---|---|---|
| 18 | Multi-Advisor Collaboration & Handoff | Structured context packets when work moves between advisors. | Correctly placed | Medium impact. Improves team continuity. |
| 19 | Conflict of Interest Detection Engine | Cross-client scans for undisclosed conflicts, overlapping positions, referral fee exposure, and proprietary product concentration. | Correctly placed | Risk critical. Finds issues before they become events. |
| 20 | Regulatory Change Monitor | SEC, FINRA, and IRS rule monitoring with remediation checklists for affected plans, documents, or agent instructions. | Correctly placed | Medium impact. Keeps governance current. |
| 21 | Agent Performance Analytics & Trust Calibration | Approval rate, revision rate, escalation frequency, and automatic autonomy adjustment by agent. | Correctly placed | Medium impact. Needs 3-6 months of history. |
| 22 | Private Markets & Alternatives Tracker | Capital calls, distribution timelines, J-curve modeling, and liquidity buffer requirements. | Was P3 -> P2 | HNW essential. Needed for complex household balance sheets. |
| 23 | 7-Year Audit Export Package | One-click regulator-ready audit package with prompt hashes, model versions, source documents, reviewer states, and approval timestamps. | Correctly placed | Compliance. Makes the governance model portable. |
| 24 | Advisor Coaching & Mentorship Capture | Converts senior advisor judgment calls and custom instructions into reusable patterns for junior advisors. | Correctly placed | Culture tool. Captures institutional knowledge. |
| 25 | AI Meeting Prep via Voice/Chat | Spoken or chat-based briefing: "What do I need to know about Elaine today?" | Was P3 -> P2 | Medium impact. Useful once voice transcription is live. |

## Phase 3 - Platform & Scale

Year 2+ platform-level features that expand the addressable market and defensibility.

| # | Feature | What Ships | Roadmap Note | Why It Matters |
|---|---|---|---|---|
| 26 | Next-Gen / Beneficiary Engagement Portal | Heir-facing dashboards, governance onboarding, document signing, and education modules. | Correctly placed | Long game. Critical for 10-year retention. |
| 27 | Custom Agent Builder | No-code specialist agent creation with configured data sources, guardrails, autonomy tier, and output templates. | Correctly placed | Platform moat. Expands Aether beyond built-in agents. |
| 28 | Cross-Household AI Insight Syndication | Advisor-approved reuse of useful strategies across similar households. | Correctly placed | Network effect. Turns firm learning into leverage. |
| 29 | Mobile App with Offline Mode | Native field app with day plan, client brief, AI talking points, offline cache, and last sync. | Correctly placed | Year 2. Desktop-first is the right call now. |
| 30 | Monte Carlo / Probability of Success Overlay | Probabilistic goal modeling across 1,000 scenarios, integrated with planning tools. | Was P1 -> P3 | Integrate, not build. Avoid rebuilding MoneyGuidePro or eMoney. |

## Dependency Gates

- Feature 01 unlocks Tax Optimization, Market Event Triggers, IPS exception monitoring, and real scenario modeling.
- Feature 02 unlocks day-one client adoption and reduces manual data migration.
- Feature 03 turns Aether from a dashboard advisors check into an OS that alerts advisors when work needs attention.
- Feature 04 makes the product operational for new households.
- Feature 05 closes the primary daily workflow gap in meetings.

## Current Build Implication

The current prototype demonstrates the product surface well. The next production push should prioritize Phase 0 before adding more advanced AI or portfolio intelligence. Otherwise new features will look complete in demo but remain blocked in real firm deployment.
