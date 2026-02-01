# cloudflarepminternassignment
# Feedback Analyzer

A prototype tool that aggregates product feedback from multiple sources, analyzes it, and presents actionable outputs for a product manager:
- Action Queue (prioritized by urgency)
- Summary of Reports (theme clusters ordered by urgency)
- Identified Incidents / Issues (triage list ordered by urgency)

This project is designed to satisfy the Cloudflare Product Manager Intern assignment requirements:
1) Build a quick prototype deployed on Cloudflare Workers
2) Provide a friction log (product insights) from using Cloudflare to build it
3) Include a short architecture overview describing which Cloudflare products were used and why
(Mock data is used; no third-party integrations required.)


## Live Demo

- https://feedback-analyzer.sandrolevi.workers.dev


## What the Prototype Does

### Action Queue
A prioritized list of actions derived from feedback, ordered by urgency (P0 to P3) and status (unfinished first). Done/resolved items are pushed to the bottom.

### Summary of Reports
A compact summary of the highest-impact themes, ordered by urgency. If a summary item has no explicit severity, severity is inferred from keywords (e.g., outage/auth/billing/500 -> higher; performance -> medium; UI/typo -> lower). Counts like "(6 reports)" are parsed and used as an impact tie-breaker.

### Identified Incidents / Issues
A triage view of incidents/issues ordered by urgency with consistent badge severity. Resolved/closed items appear at the bottom.


## Architecture Overview (Cloudflare Products Used)

This prototype is hosted as a Cloudflare Worker and uses Cloudflare platform primitives to support the feedback workflow.

- Cloudflare Workers
  - Hosts the web app and API endpoints in a single serverless deployment.
  - Chosen for fast iteration and deployment, and because it is the required hosting target.

- D1 (SQLite database)
  - Stores structured feedback items, incidents, and derived action items (or mock equivalents, depending on your current configuration).
  - Chosen because the data model is relational (feedback entries, categories, timestamps) and needs querying/sorting.

- KV (Key-Value storage) or Durable Objects (if present in your project)
  - KV can be used for lightweight cached aggregates (e.g., precomputed summaries).
  - Durable Objects can be used for simple stateful coordination (e.g., status toggles) if implemented.
  - Chosen for fast reads and simple state/caching patterns.

Notes:
- This prototype uses mock/semi-mock data where appropriate. No third-party integrations are required.
- The UI ordering is driven by a single shared urgency sorter to keep prioritization consistent across sections.


## Priority / Urgency Sorting

All three UI sections use one shared non-mutating, stable sorter:
- Primary: severity/priority rank (P0/Critical -> P3/Low; unknown last)
- Secondary: status rank (unfinished first; resolved/done last)
- Tie-breakers: impact (counts / negativity), then recency, then title alphabetical

This keeps prioritization consistent and avoids one-off sorting logic in individual components.


## Local Development

Prerequisites:
- Node.js (LTS recommended)
- Cloudflare Wrangler CLI

Install dependencies:
```bash
npm install
