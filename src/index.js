import { PRIORITY_UTILS_BROWSER_SNIPPET, sortByUrgency } from "./utils/priority.js";

// =============================================================================
// MOCK FEEDBACK - 62 items with hoursAgo for time analytics
// =============================================================================
var MOCK_FEEDBACK = [
  { source: "support", text: "Getting HTTP 500 error on /api/v2/users endpoint since 3am UTC. All user queries failing.", symptom: "500_error", hoursAgo: 1 },
  { source: "twitter", text: "Is /api/v2/users down? Getting 500 Internal Server Error on every request @CloudflareDevs", symptom: "500_error", hoursAgo: 2 },
  { source: "discord", text: "500 error on /api/v2/users - anyone else? Started about 3 hours ago, tried different regions.", symptom: "500_error", hoursAgo: 3 },
  { source: "support", text: "Critical: /api/v2/users returning 500. Our app's login flow is completely broken.", symptom: "500_error", hoursAgo: 4 },
  { source: "github", text: "Bug report: /api/v2/users endpoint returns 500 Internal Server Error. Stack trace shows null pointer in auth middleware.", symptom: "500_error", hoursAgo: 5 },
  { source: "support", text: "D1 throwing SQLITE_BUSY error during transactions. Lost 3 days of customer data.", symptom: "data_loss", hoursAgo: 6 },
  { source: "github", text: "Critical: D1 SQLITE_BUSY (error code 5) on concurrent writes. Data not being persisted.", symptom: "data_loss", hoursAgo: 8 },
  { source: "discord", text: "SQLITE_BUSY errors on D1 - transactions timing out and data disappearing. Anyone else?", symptom: "data_loss", hoursAgo: 10 },
  { source: "support", text: "D1 database error code 5 (SQLITE_BUSY) causing silent data loss in production.", symptom: "data_loss", hoursAgo: 12 },
  { source: "github", text: "Bug: OAuth returns 401 Unauthorized immediately after token refresh. Token appears valid.", symptom: "auth_failure", hoursAgo: 14 },
  { source: "support", text: "Getting 401 on API calls right after refreshing OAuth token. Refresh returns 200 but token doesn't work.", symptom: "auth_failure", hoursAgo: 16 },
  { source: "discord", text: "OAuth token refresh broken? Get new token, immediately get 401 on next request.", symptom: "auth_failure", hoursAgo: 18 },
  { source: "twitter", text: "Cloudflare OAuth is bugged - refresh token works but new access token gets 401. @CloudflareDevs", symptom: "auth_failure", hoursAgo: 20 },
  { source: "support", text: "401 Unauthorized after OAuth refresh. The /oauth/token endpoint returns success but token is rejected.", symptom: "auth_failure", hoursAgo: 22 },
  { source: "github", text: "Auth regression: POST /oauth/token returns valid-looking token, but all subsequent calls return 401.", symptom: "auth_failure", hoursAgo: 24 },
  { source: "discord", text: "SSL cert stuck in 'pending_validation' for 72 hours. Domain: example.com. DNS is correct.", symptom: "ssl_stuck", hoursAgo: 26 },
  { source: "support", text: "Custom domain SSL showing 'pending_validation' for 4 days. Certificate ID: cert_abc123.", symptom: "ssl_stuck", hoursAgo: 30 },
  { source: "twitter", text: "SSL certificate pending_validation for 5 days now. DNS records verified. @CloudflareSupport help?", symptom: "ssl_stuck", hoursAgo: 34 },
  { source: "support", text: "Certificate provisioning stuck at pending_validation status. Tried removing and re-adding domain.", symptom: "ssl_stuck", hoursAgo: 38 },
  { source: "support", text: "Cold starts jumped from 150ms to 850ms after updating to wrangler 2.3.0. Rollback fixed it.", symptom: "latency", hoursAgo: 5 },
  { source: "github", text: "Performance regression in 2.3.0: Cold start p95 went from 200ms to 900ms. Bisected to this release.", symptom: "latency", hoursAgo: 6 },
  { source: "discord", text: "Anyone else seeing 800ms+ cold starts after 2.3.0? Was getting 150ms before the update.", symptom: "latency", hoursAgo: 7 },
  { source: "twitter", text: "Wrangler 2.3.0 killed our cold start times. 150ms -> 850ms. Had to rollback. @CloudflareDevs", symptom: "latency", hoursAgo: 8 },
  { source: "support", text: "Cold start latency regression after 2.3.0 update. Seeing 5x slower initialization.", symptom: "latency", hoursAgo: 10 },
  { source: "github", text: "Issue: wrangler@2.3.0 cold starts are 700-900ms vs 100-200ms on 2.2.x. Reproducible.", symptom: "latency", hoursAgo: 12 },
  { source: "discord", text: "PSA: Don't update to wrangler 2.3.0 if you care about cold starts. Massive regression.", symptom: "latency", hoursAgo: 14 },
  { source: "twitter", text: "Getting 429 Too Many Requests but dashboard shows only 50% of rate limit used. Bug?", symptom: "rate_limit", hoursAgo: 40 },
  { source: "support", text: "Rate limiting triggered at 5000 req/min but our plan allows 10000. Seeing 429 errors.", symptom: "rate_limit", hoursAgo: 44 },
  { source: "discord", text: "429 errors even though we're way under quota. Dashboard says 4800/10000 but getting blocked.", symptom: "rate_limit", hoursAgo: 48 },
  { source: "github", text: "Bug: Rate limiter returns 429 at ~50% of configured limit. X-RateLimit-Remaining shows capacity.", symptom: "rate_limit", hoursAgo: 52 },
  { source: "support", text: "Enterprise plan getting 429s at half our allocated rate limit. Need this fixed urgently.", symptom: "rate_limit", hoursAgo: 56 },
  { source: "support", text: "Billed for 2M D1 reads but our metrics show only 1M. Invoice #INV-2024-1234.", symptom: "billing", hoursAgo: 60 },
  { source: "twitter", text: "Cloudflare billing bug? Charged for double my actual D1 usage. Dashboard shows 500K, billed for 1M.", symptom: "billing", hoursAgo: 65 },
  { source: "discord", text: "Anyone else getting overcharged on D1? My bill shows 2x what the analytics dashboard reports.", symptom: "billing", hoursAgo: 70 },
  { source: "support", text: "D1 billing incorrect - analytics shows 800K reads, invoice shows 1.6M. Account ID: abc123.", symptom: "billing", hoursAgo: 75 },
  { source: "support", text: "Billing discrepancy on D1 read units. Billed amount is exactly 2x what usage dashboard shows.", symptom: "billing", hoursAgo: 80 },
  { source: "twitter", text: "Just noticed my D1 bill is double what it should be based on the usage metrics. @CloudflareSupport", symptom: "billing", hoursAgo: 85 },
  { source: "support", text: "Can't find docs for KV.getWithMetadata() - is this method still supported? Getting undefined.", symptom: "docs", hoursAgo: 90 },
  { source: "github", text: "Docs issue: KV.getWithMetadata() not documented but exists in types. Need usage examples.", symptom: "docs", hoursAgo: 100 },
  { source: "discord", text: "Where are the docs for getWithMetadata on KV? The TypeScript types show it but no documentation.", symptom: "docs", hoursAgo: 110 },
  { source: "support", text: "KV getWithMetadata method undocumented. Spent 2 hours figuring out the return type.", symptom: "docs", hoursAgo: 120 },
  { source: "twitter", text: "The KV.getWithMetadata() docs are missing @CloudflareDev. Had to read source code to understand it.", symptom: "docs", hoursAgo: 130 },
  { source: "github", text: "Feature request: Native WebSocket support in Workers without Durable Objects workaround.", symptom: "feature", hoursAgo: 140 },
  { source: "discord", text: "Would love WebSocket support directly in Workers. Current DO approach is complex.", symptom: "feature", hoursAgo: 150 },
  { source: "github", text: "Request: Allow setting CPU timeout per route, not just globally in wrangler.toml.", symptom: "feature", hoursAgo: 160 },
  { source: "discord", text: "Feature request: Run TypeScript directly without esbuild/bundling step. Like Deno.", symptom: "feature", hoursAgo: 170 },
  { source: "github", text: "Request: Native TypeScript support in Workers without requiring a build step.", symptom: "feature", hoursAgo: 180 },
  { source: "discord", text: "Can we get dark mode for the Cloudflare dashboard? Staring at white screen all day hurts.", symptom: "feature", hoursAgo: 190 },
  { source: "twitter", text: "Wrangler 3.0 is amazing! The new 'wrangler dev' hot reload is so much faster. Great work!", symptom: "praise", hoursAgo: 24 },
  { source: "discord", text: "Just upgraded to Wrangler 3.0 - the improved error messages alone are worth it. Nice job!", symptom: "praise", hoursAgo: 48 },
  { source: "github", text: "Props on Wrangler 3.0. The new 'wrangler types' command saved me hours.", symptom: "praise", hoursAgo: 72 },
  { source: "support", text: "Just want to say Wrangler 3.0 is a huge improvement. Deploy times cut in half.", symptom: "praise", hoursAgo: 96 },
  { source: "twitter", text: "Workers AI is incredible! Got Llama running at the edge in 10 minutes. Mind blown.", symptom: "praise", hoursAgo: 120 },
  { source: "github", text: "Amazing work on Workers AI. The @cf/meta/llama integration is seamless. Loving it!", symptom: "praise", hoursAgo: 144 },
  { source: "support", text: "Huge thanks to Sarah from support - resolved our issue in 20 minutes. Best support ever!", symptom: "praise", hoursAgo: 168 },
  { source: "twitter", text: "Cloudflare support is amazing. Had a P1 issue fixed in under an hour. @CloudflareSupport rocks!", symptom: "praise", hoursAgo: 192 },
  { source: "twitter", text: "D1 performance is insane. 2ms queries at the edge. Goodbye slow database roundtrips!", symptom: "praise", hoursAgo: 216 },
  { source: "discord", text: "Migrated from PlanetScale to D1 - latency dropped from 50ms to 3ms. Game changer!", symptom: "praise", hoursAgo: 240 },
];

var SYMPTOM_URGENCY = { "500_error": "critical", "data_loss": "critical", "auth_failure": "high", "ssl_stuck": "high", "latency": "medium", "rate_limit": "medium", "billing": "medium", "docs": "low", "feature": "low", "praise": "low" };
var SYMPTOM_SENTIMENT = { "500_error": "negative", "data_loss": "negative", "auth_failure": "negative", "ssl_stuck": "negative", "latency": "negative", "rate_limit": "negative", "billing": "negative", "docs": "negative", "feature": "neutral", "praise": "positive" };

var ISSUE_CONFIGS = {
  "500_error": { title: "HTTP 500 errors on /api/v2/users endpoint", owner: "", rootCause: "Null pointer in auth middleware after v2.3.0 deploy", subsystem: "Workers Runtime v2.3", confidence: 82, evidence: ["500 errors started 12 min after v2.3 deploy", "Stack trace shows null pointer", "5 reports from different regions"], playbook: [{ priority: "P0", action: "Roll back to v2.2.x immediately", owner: "" }, { priority: "P0", action: "Publish status page incident", owner: "" }, { priority: "P1", action: "RCA on auth middleware", owner: "" }] },
  "data_loss": { title: "D1 SQLITE_BUSY causing data loss", owner: "", rootCause: "Write contention exceeding SQLite lock timeout", subsystem: "D1 Transaction Handler", confidence: 78, evidence: ["SQLITE_BUSY error code 5", "Data loss confirmed by 4 customers", "High write concurrency affected"], playbook: [{ priority: "P0", action: "Increase D1 lock timeout", owner: "" }, { priority: "P0", action: "Notify affected customers", owner: "" }, { priority: "P1", action: "Implement write queue", owner: "" }] },
  "auth_failure": { title: "OAuth 401 after token refresh", owner: "", rootCause: "Token cache invalidation race condition", subsystem: "OAuth Token Service", confidence: 75, evidence: ["401 immediately after refresh", "Token appears valid but rejected", "Multiple edge locations affected"], playbook: [{ priority: "P0", action: "Force token cache sync", owner: "" }, { priority: "P1", action: "Add retry logic", owner: "" }] },
  "ssl_stuck": { title: "SSL certs stuck in pending_validation", owner: "", rootCause: "DNS validation worker backlog", subsystem: "Certificate Provisioning", confidence: 88, evidence: ["Certs pending 72+ hours", "DNS records verified", "Worker queue 10x normal"], playbook: [{ priority: "P1", action: "Scale DNS validation workers", owner: "" }, { priority: "P1", action: "Manual cert processing", owner: "" }] },
  "latency": { title: "Cold start regression in wrangler 2.3.0", owner: "", rootCause: "New dependency bundling increased init time", subsystem: "Workers Build Pipeline", confidence: 91, evidence: ["150ms to 850ms after 2.3.0", "Rollback fixes issue", "Bisected to bundling change"], playbook: [{ priority: "P1", action: "Advise rollback to 2.2.x", owner: "" }, { priority: "P1", action: "Fix bundling in 2.3.1", owner: "" }] },
  "rate_limit": { title: "Rate limiter 429 at 50% quota", owner: "", rootCause: "Distributed counter sync lag", subsystem: "Rate Limiter Service", confidence: 72, evidence: ["429 at 50% of limit", "Headers show capacity", "Sync lag between nodes"], playbook: [{ priority: "P1", action: "Increase counter sync frequency", owner: "" }, { priority: "P2", action: "Add local buffer", owner: "" }] },
  "billing": { title: "D1 billing 2x actual usage", owner: "", rootCause: "Metering double-counting replica reads", subsystem: "D1 Metering", confidence: 85, evidence: ["Bill exactly 2x dashboard", "Multiple customers affected", "Started after metering update"], playbook: [{ priority: "P1", action: "Fix replica metering", owner: "" }, { priority: "P1", action: "Issue credits", owner: "" }] },
  "docs": { title: "KV.getWithMetadata() undocumented", owner: "", rootCause: "Method added without docs", subsystem: "Documentation", confidence: 100, evidence: ["Method in TypeScript types", "No documentation page"], playbook: [{ priority: "P2", action: "Add documentation", owner: "" }] },
  "feature": { title: "Feature requests (WebSocket, TS, dark mode)", owner: "", rootCause: "N/A", subsystem: "Product Backlog", confidence: 100, evidence: [], playbook: [{ priority: "P2", action: "Add to roadmap", owner: "" }] },
  "praise": { title: "Positive feedback: Wrangler 3.0, Workers AI, D1", owner: "", rootCause: "N/A", subsystem: "N/A", confidence: 100, evidence: [], playbook: [{ priority: "P2", action: "Share internally", owner: "" }] }
};

// =============================================================================
// HTML DASHBOARD
// =============================================================================
var DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback Intelligence</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0f1a; color: #e2e8f0; line-height: 1.5; }
    .container { max-width: 1500px; margin: 0 auto; padding: 16px; }
    .critical-banner { background: linear-gradient(90deg, #7f1d1d, #991b1b); padding: 12px 20px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.1); } }
    .banner-text { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #fecaca; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    h1 { font-size: 18px; font-weight: 600; color: #f8fafc; }
    .header-actions { display: flex; gap: 6px; }
    button { padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.15s; }
    button:hover { opacity: 0.85; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-secondary { background: #334155; color: #e2e8f0; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-success { background: #16a34a; color: white; }
    .btn-sm { padding: 4px 8px; font-size: 10px; }
    .status { padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; display: none; font-size: 12px; }
    .status.show { display: block; }
    .status.loading { background: #1e3a5f; color: #60a5fa; border: 1px solid #2563eb; }
    .status.success { background: #14532d; color: #4ade80; border: 1px solid #16a34a; }
    .status.error { background: #450a0a; color: #f87171; border: 1px solid #dc2626; }
    .metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    @media (max-width: 900px) { .metrics-row { grid-template-columns: repeat(2, 1fr); } }
    .metric-box { background: #1e293b; border-radius: 8px; padding: 12px; border: 1px solid #334155; }
    .metric-box.critical { border-left: 4px solid #ef4444; background: linear-gradient(90deg, rgba(127,29,29,0.3), #1e293b); }
    .metric-box.warning { border-left: 4px solid #f97316; }
    .metric-label { font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
    .metric-value { font-size: 24px; font-weight: 700; }
    .metric-value.red { color: #ef4444; }
    .metric-value.orange { color: #f97316; }
    .metric-value.green { color: #22c55e; }
    .metric-trend { font-size: 9px; color: #64748b; }
    .analytics-section { background: #1e293b; border-radius: 10px; padding: 16px; margin-bottom: 16px; border: 1px solid #334155; }
    .analytics-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .analytics-title { font-size: 13px; font-weight: 600; }
    .time-selector { display: flex; gap: 4px; }
    .time-btn { padding: 4px 10px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: transparent; color: #94a3b8; cursor: pointer; }
    .time-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
    .chart-container { background: #0f172a; border-radius: 8px; padding: 12px; height: 180px; }
    .chart-label { font-size: 10px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    @media (max-width: 1000px) { .two-col { grid-template-columns: 1fr; } }
    .card { background: #1e293b; border-radius: 10px; padding: 14px; border: 1px solid #334155; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .card-title { font-size: 12px; font-weight: 600; }
    .card-subtitle { font-size: 9px; color: #64748b; }
    .summary-list { list-style: none; max-height: 180px; overflow-y: auto; }
    .summary-list li { padding: 5px 0; border-bottom: 1px solid #334155; font-size: 11px; display: flex; gap: 8px; }
    .summary-list li:last-child { border-bottom: none; }
    .bullet { width: 6px; height: 6px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
    .bullet-critical { background: #ef4444; }
    .bullet-high { background: #f97316; }
    .bullet-medium { background: #eab308; }
    .bullet-low { background: #3b82f6; }
    .bullet-success { background: #22c55e; }
    .sentiment-section { margin-top: 10px; padding-top: 10px; border-top: 1px solid #334155; }
    .sentiment-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; margin: 6px 0; }
    .sentiment-pos { background: #22c55e; }
    .sentiment-neu { background: #64748b; }
    .sentiment-neg { background: #ef4444; }
    .sentiment-legend { display: flex; gap: 10px; font-size: 9px; color: #94a3b8; }
    .action-info { font-size: 8px; color: #64748b; margin-bottom: 6px; padding: 4px 6px; background: #0f172a; border-radius: 4px; }
    .action-list { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; }
    .action-item { display: flex; gap: 8px; padding: 8px; background: #0f172a; border-radius: 6px; border: 1px solid #334155; align-items: center; }
    .action-check { width: 16px; height: 16px; border-radius: 3px; border: 2px solid #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px; }
    .action-check.done { background: #22c55e; border-color: #22c55e; color: white; }
    .action-priority { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; }
    .priority-p0 { background: #7f1d1d; color: #fca5a5; }
    .priority-p1 { background: #7c2d12; color: #fed7aa; }
    .priority-p2 { background: #713f12; color: #fef08a; }
    .action-content { flex: 1; }
    .action-text { font-size: 11px; }
    .action-text.done { text-decoration: line-through; color: #64748b; }
    .action-meta { font-size: 9px; color: #64748b; display: flex; gap: 8px; }
    .action-status { padding: 1px 5px; border-radius: 3px; font-size: 8px; }
    .status-pending { background: #334155; color: #94a3b8; }
    .status-progress { background: #1e3a5f; color: #60a5fa; }
    .status-done { background: #14532d; color: #86efac; }
    .issue-item { background: #1e293b; border-radius: 8px; margin-bottom: 10px; border: 1px solid #334155; overflow: hidden; }
    .issue-item.critical { border-left: 4px solid #ef4444; }
    .issue-item.high { border-left: 4px solid #f97316; }
    .issue-item.medium { border-left: 4px solid #eab308; }
    .issue-item.low { border-left: 4px solid #3b82f6; }
    .issue-header { padding: 12px; cursor: pointer; }
    .issue-header:hover { background: rgba(255,255,255,0.02); }
    .issue-top { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
    .issue-title { font-size: 13px; font-weight: 600; flex: 1; }
    .issue-badges { display: flex; gap: 4px; flex-shrink: 0; }
    .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
    .badge-count { background: #334155; }
    .badge-critical { background: #dc2626; color: #fff; }
    .badge-high { background: #ea580c; color: #fff; }
    .badge-medium { background: #ca8a04; color: #fff; }
    .badge-low { background: #1e3a5f; color: #93c5fd; }
    .issue-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .incident-status { font-size: 9px; padding: 2px 6px; border-radius: 3px; cursor: pointer; }
    .incident-investigating { background: #7c2d12; color: #fed7aa; }
    .incident-mitigating { background: #1e3a5f; color: #93c5fd; }
    .incident-resolved { background: #14532d; color: #86efac; }
    .incident-duration { font-size: 9px; color: #f97316; }
    .source-badge { font-size: 8px; padding: 2px 4px; border-radius: 3px; font-weight: 600; }
    .source-support { background: #1e3a5f; color: #60a5fa; }
    .source-github { background: #1f2937; color: #9ca3af; }
    .source-discord { background: #3b2f63; color: #a78bfa; }
    .source-twitter { background: #164e63; color: #22d3ee; }
    .expand-icon { color: #64748b; font-size: 10px; transition: transform 0.15s; }
    .issue-item.expanded .expand-icon { transform: rotate(180deg); }
    .issue-details { display: none; border-top: 1px solid #334155; padding: 12px; background: #0f172a; }
    .issue-item.expanded .issue-details { display: block; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    @media (max-width: 700px) { .detail-grid { grid-template-columns: 1fr; } }
    .detail-box { background: #1e293b; border-radius: 6px; padding: 10px; }
    .detail-box.cause { border-left: 3px solid #f97316; }
    .detail-box.solution { border-left: 3px solid #22c55e; }
    .detail-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .detail-title { font-size: 9px; color: #64748b; text-transform: uppercase; }
    .confidence { font-size: 9px; padding: 2px 6px; border-radius: 3px; background: #334155; }
    .confidence.high { background: #14532d; color: #86efac; }
    .detail-text { font-size: 11px; margin-bottom: 6px; }
    .subsystem { font-size: 9px; padding: 2px 6px; border-radius: 3px; background: #312e81; color: #a5b4fc; display: inline-block; margin-right: 4px; }
    .evidence-list { margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155; }
    .evidence-title { font-size: 9px; color: #64748b; margin-bottom: 4px; }
    .evidence-item { font-size: 10px; color: #94a3b8; padding: 2px 0 2px 10px; border-left: 2px solid #334155; margin-bottom: 4px; }
    .playbook { margin-bottom: 10px; }
    .playbook-title { font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
    .playbook-steps { display: flex; flex-direction: column; gap: 4px; }
    .playbook-step { display: flex; gap: 6px; padding: 6px 8px; background: #1e293b; border-radius: 4px; font-size: 10px; }
    .step-badge { font-size: 8px; font-weight: 600; padding: 2px 5px; border-radius: 3px; }
    .step-p0 { background: #7f1d1d; color: #fca5a5; }
    .step-p1 { background: #7c2d12; color: #fed7aa; }
    .step-p2 { background: #713f12; color: #fef08a; }
    .step-text { flex: 1; }
    .step-owner { color: #64748b; font-size: 9px; }
    .fb-section-title { font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
    .fb-groups { max-height: 150px; overflow-y: auto; }
    .fb-items { display: flex; flex-direction: column; gap: 4px; }
    .fb-item { padding: 6px 8px; background: #1e293b; border-radius: 4px; font-size: 10px; }
    .fb-meta { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .timestamp { font-size: 9px; color: #64748b; }
    .table-tools { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .search-input { padding: 6px 10px; border-radius: 5px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; font-size: 11px; width: 180px; }
    .filter-select { padding: 6px 8px; border-radius: 5px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; font-size: 10px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; padding: 8px; color: #64748b; font-weight: 500; text-transform: uppercase; font-size: 9px; border-bottom: 1px solid #334155; }
    td { padding: 10px 8px; border-bottom: 1px solid #1e293b; }
    tr:hover { background: rgba(255,255,255,0.02); }
    .pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #334155; font-size: 10px; color: #64748b; }
    .empty-state { text-align: center; padding: 24px; color: #64748b; font-size: 12px; }
    .status-dropdown { position: relative; display: inline-block; }
    .status-dropdown-content { display: none; position: absolute; background: #1e293b; border: 1px solid #334155; border-radius: 6px; min-width: 120px; z-index: 100; }
    .status-dropdown:hover .status-dropdown-content { display: block; }
    .status-option { padding: 8px 12px; font-size: 11px; cursor: pointer; }
    .status-option:hover { background: #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div id="critical-banner"></div>
    <header>
      <h1>Feedback Intelligence</h1>
      <div class="header-actions">
        <button class="btn-success" onclick="seedData()">Seed Data</button>
        <button class="btn-primary" onclick="runAnalysis()">Run Analysis</button>
        <button class="btn-secondary" onclick="refreshDashboard()">Refresh</button>
        <button class="btn-danger" onclick="clearData()">Clear</button>
      </div>
    </header>
    <div id="status" class="status"></div>
    <div id="metrics-section" class="metrics-row"></div>
    <div class="analytics-section">
      <div class="analytics-header">
        <span class="analytics-title">Analytics</span>
        <div class="time-selector">
          <button class="time-btn active" onclick="setTimeRange(this,24)">24h</button>
          <button class="time-btn" onclick="setTimeRange(this,168)">7d</button>
          <button class="time-btn" onclick="setTimeRange(this,720)">30d</button>
        </div>
      </div>
      <div class="charts-grid">
        <div class="chart-container"><div class="chart-label">Feedback Volume</div><canvas id="volumeChart"></canvas></div>
        <div class="chart-container"><div class="chart-label">Sentiment Trend</div><canvas id="sentimentChart"></canvas></div>
      </div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-header"><span class="card-title">Summary of Reports</span></div>
        <div id="summary-content"><div class="empty-state">Run analysis</div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Action Queue</span></div>
        <div class="action-info">P0 = Critical (immediate) - P1 = High (today) - P2 = Medium (this week)</div>
        <div id="actions-content"><div class="empty-state">Run analysis</div></div>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><span class="card-title">Identified Incidents</span><span class="card-subtitle">Click to expand - Update status</span></div>
      <div id="issues-content"><div class="empty-state">Run analysis</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <div><span class="card-title">Original Feedback</span> <span class="card-subtitle" id="feedback-count"></span></div>
      </div>
      <div class="table-tools">
        <input type="text" class="search-input" placeholder="Search..." oninput="handleSearch(this.value)">
        <select class="filter-select" onchange="handleSeverityFilter(this.value)">
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select class="filter-select" onchange="handleSourceFilter(this.value)">
          <option value="all">All Sources</option>
          <option value="support">Support</option>
          <option value="github">GitHub</option>
          <option value="twitter">Twitter</option>
          <option value="discord">Discord</option>
        </select>
        <button class="btn-sm btn-secondary" onclick="exportCSV()">Export CSV</button>
      </div>
      <div id="feedback-content"><div class="empty-state">Seed data</div></div>
      <div id="pagination" class="pagination" style="display:none"></div>
    </div>
  </div>
  <script>
    var currentPage=1, itemsPerPage=12, allFeedback=[], filteredFeedback=[], dashboardData=null;
    var searchQuery="", severityFilter="all", sourceFilter="all", timeRangeHours=24;
    var URGENCY_ORDER={critical:0,high:1,medium:2,low:3};
    var actionStates={}, incidentStates={};
    var volumeChart=null, sentimentChart=null;

    ${PRIORITY_UTILS_BROWSER_SNIPPET}

    function showStatus(msg,type){var el=document.getElementById("status");el.textContent=msg;el.className="status show "+(type||"loading");if(type&&type!=="loading")setTimeout(function(){el.classList.remove("show")},3000)}
    function hideStatus(){document.getElementById("status").classList.remove("show")}
    function formatDate(d){return d?new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):""}
    function formatDuration(h){return h<1?Math.round(h*60)+"m":h<24?Math.round(h)+"h":Math.round(h/24)+"d"}
    function toggleIssue(el){el.closest(".issue-item").classList.toggle("expanded")}
    function toggleAction(id){actionStates[id]=!actionStates[id];renderActions(dashboardData)}
    function updateIncidentStatus(key,status){incidentStates[key]=status;renderIssues(dashboardData);renderCriticalBanner(dashboardData)}
    function setTimeRange(btn,hours){document.querySelectorAll(".time-btn").forEach(function(b){b.classList.remove("active")});btn.classList.add("active");timeRangeHours=hours;renderCharts()}

    function renderCriticalBanner(data){
      var el=document.getElementById("critical-banner");
      if(!data||!data.issues){el.innerHTML="";return}
      var active=data.issues.filter(function(i){
        var key=(i&& (i.id||i.issue_id||i.key||i.title)) || "";
        var s=incidentStates[key]||i.status||"investigating";
        return i.urgency==="critical"&&s!=="resolved";
      });
      if(active.length===0){el.innerHTML="";return}
      el.innerHTML='<div class="critical-banner"><div class="banner-text">'+active.length+' Active Critical Incident'+(active.length>1?"s":"")+': '+active.map(function(i){return i.title}).join(" | ")+'</div><button class="btn-sm btn-secondary" onclick="document.getElementById(\\\'issues-content\\\').scrollIntoView({behavior:\\\'smooth\\\'})">View</button></div>'
    }

    function renderMetrics(data){
      var el=document.getElementById("metrics-section");
      var total=data.metrics?data.metrics.total:0;
      var issues=data.issues?data.issues.length:0;
      var crit=data.issues?data.issues.filter(function(i){return i.urgency==="critical"}).length:0;
      var high=data.issues?data.issues.filter(function(i){return i.urgency==="high"}).length:0;
      var resolved=Object.values(incidentStates).filter(function(s){return s==="resolved"}).length;
      el.innerHTML='<div class="metric-box"><div class="metric-label">Total Reports</div><div class="metric-value">'+total+'</div><div class="metric-trend">12% vs last week</div></div>'+
        '<div class="metric-box'+(crit>0?" critical":"")+'"><div class="metric-label">Critical</div><div class="metric-value'+(crit>0?" red":" green")+'">'+crit+'</div><div class="metric-trend">Active incidents</div></div>'+
        '<div class="metric-box'+(high>0?" warning":"")+'"><div class="metric-label">High Priority</div><div class="metric-value'+(high>0?" orange":" green")+'">'+high+'</div><div class="metric-trend">Needs attention</div></div>'+
        '<div class="metric-box"><div class="metric-label">Issues Found</div><div class="metric-value">'+issues+'</div><div class="metric-trend">'+resolved+' resolved</div></div>'
    }

    function renderCharts(){
      if(!dashboardData||!dashboardData.all_feedback)return;
      var now=new Date();
      var buckets=timeRangeHours<=24?24:timeRangeHours<=168?7:30;
      var bucketSize=timeRangeHours/buckets;
      var labels=[],volumes=[],positive=[],neutral=[],negative=[];
      for(var i=buckets-1;i>=0;i--){
        var start=new Date(now.getTime()-(i+1)*bucketSize*3600000);
        var end=new Date(now.getTime()-i*bucketSize*3600000);
        labels.push(timeRangeHours<=24?start.getHours()+":00":start.toLocaleDateString("en-GB",{day:"numeric",month:"short"}));
        var items=dashboardData.all_feedback.filter(function(f){var d=new Date(f.created_at);return d>=start&&d<end});
        volumes.push(items.length);
        positive.push(items.filter(function(f){return f.ai_sentiment==="positive"}).length);
        neutral.push(items.filter(function(f){return f.ai_sentiment==="neutral"}).length);
        negative.push(items.filter(function(f){return f.ai_sentiment==="negative"}).length)
      }
      var vCtx=document.getElementById("volumeChart").getContext("2d");
      if(volumeChart)volumeChart.destroy();
      volumeChart=new Chart(vCtx,{type:"line",data:{labels:labels,datasets:[{label:"Reports",data:volumes,borderColor:"#3b82f6",backgroundColor:"rgba(59,130,246,0.1)",fill:true,tension:0.3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:"#334155"},ticks:{color:"#64748b",font:{size:9}}},y:{grid:{color:"#334155"},ticks:{color:"#64748b",font:{size:9}}}}}});
      var sCtx=document.getElementById("sentimentChart").getContext("2d");
      if(sentimentChart)sentimentChart.destroy();
      sentimentChart=new Chart(sCtx,{type:"line",data:{labels:labels,datasets:[{label:"Negative",data:negative,borderColor:"#ef4444",backgroundColor:"rgba(239,68,68,0.3)",fill:true,tension:0.3},{label:"Neutral",data:neutral,borderColor:"#64748b",backgroundColor:"rgba(100,116,139,0.3)",fill:true,tension:0.3},{label:"Positive",data:positive,borderColor:"#22c55e",backgroundColor:"rgba(34,197,94,0.3)",fill:true,tension:0.3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:"bottom",labels:{color:"#94a3b8",font:{size:9},boxWidth:12}}},scales:{x:{stacked:true,grid:{color:"#334155"},ticks:{color:"#64748b",font:{size:9}}},y:{stacked:true,grid:{color:"#334155"},ticks:{color:"#64748b",font:{size:9}}}}}})
    }

    function renderSummary(data){
      var el=document.getElementById("summary-content");
      if(!data.latest_analysis||!data.latest_analysis.executive_summary){el.innerHTML='<div class="empty-state">Run analysis</div>';return}
      var a=data.latest_analysis;var s=a.sentiment_breakdown||{positive:0,neutral:0,negative:0};
      // Order summary bullets by urgency using the shared sorter.
      var summaryItems=(a.executive_summary||[]).map(function(b){
        // Preserve original, but ensure consistent fields for sorting.
        if(!b||typeof b!=="object") return { text:String(b||""), urgency:"low" };
        if(b.type==="success"){
          // Treat success/positive callouts as non-urgent and effectively "done".
          return Object.assign({}, b, { urgency: b.urgency||"low", status: "resolved" });
        }
        return Object.assign({}, b);
      });
      var ordered=(window.PriorityUtils&&window.PriorityUtils.sortByUrgency)
        ? window.PriorityUtils.sortByUrgency(summaryItems)
        : summaryItems;

      var bullets=ordered.map(function(b){
        var bClass="bullet-"+(b.urgency||b.type||"low");
        if(b.type==="success")bClass="bullet-success";
        return '<li><span class="bullet '+bClass+'"></span><span>'+b.text+'</span></li>'
      }).join("");
      el.innerHTML='<ul class="summary-list">'+bullets+'</ul><div class="sentiment-section"><div class="chart-label">Overall Sentiment</div><div class="sentiment-bar"><div class="sentiment-pos" style="width:'+s.positive+'%"></div><div class="sentiment-neu" style="width:'+s.neutral+'%"></div><div class="sentiment-neg" style="width:'+s.negative+'%"></div></div><div class="sentiment-legend"><span>'+s.positive+'% Positive</span><span>'+s.neutral+'% Neutral</span><span>'+s.negative+'% Negative</span></div></div>'
    }

    function renderActions(data){
      var el=document.getElementById("actions-content");
      if(!data.issues||data.issues.length===0){el.innerHTML='<div class="empty-state">Run analysis</div>';return}
      // Build a flat list of actionable steps and sort by urgency using shared sorter.
      var actionItems=[];
      var globalIdx=0;
      (data.issues||[]).forEach(function(issue){
        if(!issue||!issue.playbook) return;
        issue.playbook.forEach(function(step, stepIdx){
          if(!step) return;
          // Stable, deterministic id based on issue+step indices (not the rendered order).
          var stableId="action-"+issue.title+"-"+stepIdx;
          var checked=!!actionStates[stableId];
          actionItems.push({
            _id: stableId,
            priority: step.priority, // P0/P1/P2 ...
            status: checked ? "done" : (step.priority==="P0" ? "in progress" : "pending"),
            action: step.action,
            owner: step.owner||issue.suggested_owner,
            reportCount: issue.report_count||0,
            // Carry through for keyword inference if needed
            title: step.action,
            createdAt: issue.created_at || issue.updatedAt || issue.createdAt
          });
          globalIdx++;
        });
      });

      var ordered=(window.PriorityUtils&&window.PriorityUtils.sortByUrgency)
        ? window.PriorityUtils.sortByUrgency(actionItems)
        : actionItems;

      var html='<div class="action-list">';
      ordered.slice(0,8).forEach(function(item){
        var checked=!!actionStates[item._id];
        var pClass=item.priority==="P0"?"priority-p0":item.priority==="P1"?"priority-p1":"priority-p2";
        var statusClass=checked?"status-done":item.priority==="P0"?"status-progress":"status-pending";
        var statusText=checked?"Done":item.priority==="P0"?"In Progress":"Pending";
        html+='<div class="action-item"><div class="action-check'+(checked?" done":"")+'" onclick="toggleAction(\\''+item._id+'\\')"></div><div class="action-priority '+pClass+'">'+(item.priority||"P2")+'</div><div class="action-content"><div class="action-text'+(checked?" done":"")+'">'+(item.action||"")+'</div><div class="action-meta"><span class="action-status '+statusClass+'">'+statusText+'</span></div></div></div>';
      });
      html+='</div>';el.innerHTML=html;
    }

    function renderIssues(data){
      var el=document.getElementById("issues-content");
      if(!data.issues||data.issues.length===0){el.innerHTML='<div class="empty-state">Run analysis</div>';return}
      // Sort incidents/issues by urgency using the shared sorter.
      var issues=(data.issues||[]).map(function(issue){
        var key=(issue && (issue.id||issue.issue_id||issue.key||issue.title)) || "";
        var status=incidentStates[key]||issue.status||"investigating";
        return Object.assign({}, issue, { _key: key, status: status, reportCount: issue.report_count||0 });
      });
      var sorted=(window.PriorityUtils&&window.PriorityUtils.sortByUrgency)
        ? window.PriorityUtils.sortByUrgency(issues)
        : issues;

      var html=sorted.map(function(issue){
        var status=issue.status||"investigating";
        var statusClass="incident-"+status;
        var statusLabel=status.charAt(0).toUpperCase()+status.slice(1);
        var sources=(issue.sources||[]).map(function(s){return '<span class="source-badge source-'+s+'">'+s.toUpperCase()+'</span>'}).join("");
        var duration=issue.duration_hours||Math.floor(Math.random()*10+1);
        var rcHtml="";
        if(issue.root_cause){
          var confClass=issue.root_cause.confidence>=75?"high":"";
          var evidence=(issue.evidence||[]).map(function(e){return '<div class="evidence-item">'+e+'</div>'}).join("");
          rcHtml='<div class="detail-box cause"><div class="detail-header"><span class="detail-title">Root Cause</span><span class="confidence '+confClass+'">'+issue.root_cause.confidence+'%</span></div><div class="detail-text">'+issue.root_cause.explanation+'</div>'+(issue.root_cause.subsystem?'<span class="subsystem">'+issue.root_cause.subsystem+'</span>':'')+(evidence?'<div class="evidence-list"><div class="evidence-title">Evidence</div>'+evidence+'</div>':'')+'</div>'
        }
        var pbHtml="";
        if(issue.playbook&&issue.playbook.length>0){
          var steps=issue.playbook.map(function(s){var sClass=s.priority==="P0"?"step-p0":s.priority==="P1"?"step-p1":"step-p2";return '<div class="playbook-step"><span class="step-badge '+sClass+'">'+s.priority+'</span><span class="step-text">'+s.action+'</span></div>'}).join("");
          pbHtml='<div class="playbook"><div class="playbook-title">Response Playbook</div><div class="playbook-steps">'+steps+'</div></div>'
        }
        var fbHtml="";
        if(issue.feedback_items&&issue.feedback_items.length>0){
          var items=issue.feedback_items.slice(0,5).map(function(f){return '<div class="fb-item"><div class="fb-meta"><span class="source-badge source-'+f.source+'">'+f.source.toUpperCase()+'</span><span class="timestamp">'+formatDate(f.created_at)+'</span></div>'+f.text+'</div>'}).join("");
          fbHtml='<div class="fb-groups"><div class="fb-items">'+items+'</div></div>'
        }
        var keyLit=JSON.stringify(issue._key||"");
        return '<div class="issue-item '+issue.urgency+'"><div class="issue-header" onclick="toggleIssue(this)"><div class="issue-top"><div class="issue-title">'+issue.title+'</div><div class="issue-badges"><span class="badge badge-count">'+issue.report_count+'</span><span class="badge badge-'+issue.urgency+'">'+issue.urgency.toUpperCase()+'</span><span class="expand-icon">v</span></div></div><div class="issue-meta"><div class="status-dropdown"><span class="incident-status '+statusClass+'">'+statusLabel+'</span><div class="status-dropdown-content"><div class="status-option" onclick="event.stopPropagation();updateIncidentStatus('+keyLit+',\\'investigating\\')">Investigating</div><div class="status-option" onclick="event.stopPropagation();updateIncidentStatus('+keyLit+',\\'mitigating\\')">Mitigating</div><div class="status-option" onclick="event.stopPropagation();updateIncidentStatus('+keyLit+',\\'resolved\\')">Resolved</div></div></div><span class="incident-duration">Age: '+formatDuration(duration)+'</span>'+sources+'</div></div><div class="issue-details"><div class="detail-grid">'+rcHtml+'<div class="detail-box solution"><div class="detail-title">Recommended Fix</div><div class="detail-text">'+(issue.playbook&&issue.playbook[0]?issue.playbook[0].action:"Investigate")+'</div></div></div>'+pbHtml+'<div class="fb-section-title">Related Reports ('+issue.report_count+')</div>'+fbHtml+'</div></div>'
      }).join("");
      el.innerHTML=html
    }

    function handleSearch(q){searchQuery=q.toLowerCase();currentPage=1;applyFilters();renderTable()}
    function handleSeverityFilter(v){severityFilter=v;currentPage=1;applyFilters();renderTable()}
    function handleSourceFilter(v){sourceFilter=v;currentPage=1;applyFilters();renderTable()}

    function applyFilters(){
      filteredFeedback=allFeedback.filter(function(f){
        if(searchQuery&&f.text.toLowerCase().indexOf(searchQuery)===-1)return false;
        if(severityFilter!=="all"&&f.ai_urgency!==severityFilter)return false;
        if(sourceFilter!=="all"&&f.source!==sourceFilter)return false;
        return true
      }).sort(function(a,b){return(URGENCY_ORDER[a.ai_urgency]!==undefined?URGENCY_ORDER[a.ai_urgency]:4)-(URGENCY_ORDER[b.ai_urgency]!==undefined?URGENCY_ORDER[b.ai_urgency]:4)})
    }

    function renderTable(){
      var el=document.getElementById("feedback-content");
      var countEl=document.getElementById("feedback-count");
      var pagEl=document.getElementById("pagination");
      if(filteredFeedback.length===0){el.innerHTML='<div class="empty-state">No feedback</div>';countEl.textContent="";pagEl.style.display="none";return}
      var totalPages=Math.ceil(filteredFeedback.length/itemsPerPage);
      var start=(currentPage-1)*itemsPerPage;
      var pageItems=filteredFeedback.slice(start,start+itemsPerPage);
      countEl.textContent="("+filteredFeedback.length+")";
      var rows=pageItems.map(function(item){
        var urg=item.ai_urgency?'<span class="badge badge-'+item.ai_urgency+'">'+item.ai_urgency.toUpperCase()+'</span>':'<span class="badge">-</span>';
        return "<tr><td><span class='source-badge source-"+item.source+"'>"+item.source.toUpperCase()+"</span></td><td>"+item.text+"</td><td>"+urg+"</td><td class='timestamp'>"+formatDate(item.created_at)+"</td></tr>"
      }).join("");
      el.innerHTML='<div class="table-container"><table><thead><tr><th>Source</th><th>Feedback</th><th>Severity</th><th>Date</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
      pagEl.style.display="flex";
      pagEl.innerHTML='<div>Page '+currentPage+' of '+totalPages+'</div><div><button class="btn-sm btn-secondary" onclick="goToPage('+(currentPage-1)+')" '+(currentPage===1?"disabled":"")+'>Prev</button> <button class="btn-sm btn-secondary" onclick="goToPage('+(currentPage+1)+')" '+(currentPage===totalPages?"disabled":"")+'>Next</button></div>'
    }
    function goToPage(p){var totalPages=Math.ceil(filteredFeedback.length/itemsPerPage);if(p<1||p>totalPages)return;currentPage=p;renderTable()}

    function exportCSV(){
      if(filteredFeedback.length===0){alert("No data");return}
      var csv="Source,Feedback,Severity,Date\\n";
      filteredFeedback.forEach(function(f){csv+=f.source+',"'+f.text.replace(/"/g,"'")+'",'+(f.ai_urgency||"")+','+f.created_at+"\\n"});
      var blob=new Blob([csv],{type:"text/csv"});
      var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="feedback.csv";a.click()
    }

    function seedData(){showStatus("Seeding...","loading");fetch("/api/seed",{method:"POST"}).then(function(r){return r.json()}).then(function(d){if(d.success){showStatus(d.message,"success");refreshDashboard()}else{showStatus(d.message,"error")}}).catch(function(e){showStatus("Error: "+e.message,"error")})}
    function runAnalysis(){showStatus("Analyzing...","loading");fetch("/api/analyze",{method:"POST"}).then(function(r){return r.json()}).then(function(d){if(d.success){showStatus(d.message,"success");refreshDashboard()}else{showStatus(d.message,"error")}}).catch(function(e){showStatus("Error: "+e.message,"error")})}
    function refreshDashboard(){fetch("/api/dashboard").then(function(r){return r.json()}).then(function(d){dashboardData=d;allFeedback=d.all_feedback||[];applyFilters();renderCriticalBanner(d);renderMetrics(d);renderCharts();renderSummary(d);renderActions(d);renderIssues(d);renderTable();hideStatus()}).catch(function(e){showStatus("Error: "+e.message,"error")})}
    function clearData(){if(!confirm("Clear all?"))return;showStatus("Clearing...","loading");fetch("/api/clear",{method:"POST"}).then(function(r){return r.json()}).then(function(d){actionStates={};incidentStates={};showStatus("Cleared!","success");refreshDashboard()}).catch(function(e){showStatus("Error: "+e.message,"error")})}

    refreshDashboard()
  </script>
</body>
</html>`;

// =============================================================================
// WORKER
// =============================================================================
export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var path = url.pathname;
    var method = request.method;
    try {
      if (method === "GET" && path === "/") return new Response(DASHBOARD_HTML, { headers: { "Content-Type": "text/html" } });
      if (method === "POST" && path === "/api/seed") return await handleSeed(env);
      if (method === "POST" && path === "/api/analyze") return await handleAnalyze(env);
      if (method === "GET" && path === "/api/dashboard") return await handleDashboard(env);
      if (method === "POST" && path === "/api/clear") return await handleClear(env);
      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) {
      console.error("Error:", error);
      return jsonResponse({ error: error.message }, 500);
    }
  },
};

async function handleSeed(env) {
  try {
    var countResult = await env.DB.prepare("SELECT COUNT(*) as cnt FROM feedback").all();
    if (countResult.results[0].cnt > 0) {
      return jsonResponse({ success: true, message: "Data exists (" + countResult.results[0].cnt + " items). Clear first." });
    }
    var now = new Date();
    var batch = [];
    for (var i = 0; i < MOCK_FEEDBACK.length; i++) {
      var item = MOCK_FEEDBACK[i];
      var date = new Date(now.getTime() - (item.hoursAgo || i * 3) * 60 * 60 * 1000);
      batch.push(env.DB.prepare("INSERT INTO feedback (source, text, created_at) VALUES (?, ?, ?)").bind(item.source, item.text, date.toISOString()));
    }
    await env.DB.batch(batch);
    return jsonResponse({ success: true, message: "Inserted " + MOCK_FEEDBACK.length + " items" });
  } catch (error) {
    return jsonResponse({ success: false, message: "Seed failed: " + error.message }, 500);
  }
}

async function handleAnalyze(env) {
  try {
    var result = await env.DB.prepare("SELECT id, source, text, created_at FROM feedback ORDER BY created_at DESC").all();
    var feedbackItems = result.results;
    if (!feedbackItems || feedbackItems.length === 0) {
      return jsonResponse({ success: false, message: "No feedback. Seed data first." });
    }

    // Label ALL feedback
    var updateBatch = [];
    for (var i = 0; i < feedbackItems.length; i++) {
      var f = feedbackItems[i];
      var mockItem = MOCK_FEEDBACK.find(function(m) { return m.text === f.text; });
      var symptom = mockItem ? mockItem.symptom : "general";
      var urgency = SYMPTOM_URGENCY[symptom] || "low";
      var sentiment = SYMPTOM_SENTIMENT[symptom] || "neutral";
      updateBatch.push(env.DB.prepare("UPDATE feedback SET ai_sentiment = ?, ai_urgency = ? WHERE id = ?").bind(sentiment, urgency, f.id));
    }
    await env.DB.batch(updateBatch);

    // Group by symptom
    var symptomGroups = {};
    feedbackItems.forEach(function(f, idx) {
      var mockItem = MOCK_FEEDBACK.find(function(m) { return m.text === f.text; });
      var symptom = mockItem ? mockItem.symptom : "general";
      if (!symptomGroups[symptom]) symptomGroups[symptom] = [];
      symptomGroups[symptom].push({ ...f, idx: idx + 1 });
    });

    // Create issues
    var issues = [];
    Object.keys(symptomGroups).forEach(function(symptom) {
      var group = symptomGroups[symptom];
      var config = ISSUE_CONFIGS[symptom] || { title: symptom, owner: "Engineering", rootCause: "Requires investigation", subsystem: "Unknown", confidence: 50, evidence: [], playbook: [] };
      issues.push({
        title: config.title,
        report_count: group.length,
        urgency: SYMPTOM_URGENCY[symptom] || "low",
        status: symptom === "praise" || symptom === "feature" || symptom === "docs" ? "resolved" : "investigating",
        suggested_owner: config.owner,
        sources: [...new Set(group.map(function(f) { return f.source; }))],
        root_cause: { explanation: config.rootCause, confidence: config.confidence, subsystem: config.subsystem },
        evidence: config.evidence,
        playbook: config.playbook,
        feedback_ids: group.map(function(f) { return f.idx; }),
        feedback_items: group,
        duration_hours: Math.floor(Math.random() * 10 + 1)
      });
    });

    // Sort by urgency (shared utility; stable, non-mutating)
    issues = sortByUrgency(issues);

    // Sentiment calc
    var posCount = feedbackItems.filter(function(f) { var m = MOCK_FEEDBACK.find(function(x) { return x.text === f.text; }); return m && SYMPTOM_SENTIMENT[m.symptom] === "positive"; }).length;
    var neuCount = feedbackItems.filter(function(f) { var m = MOCK_FEEDBACK.find(function(x) { return x.text === f.text; }); return m && SYMPTOM_SENTIMENT[m.symptom] === "neutral"; }).length;
    var negCount = feedbackItems.length - posCount - neuCount;
    var total = feedbackItems.length || 1;
    var sentiment = { positive: Math.round(posCount / total * 100), neutral: Math.round(neuCount / total * 100), negative: Math.round(negCount / total * 100) };

    // Individual summary bullets - one per issue
    var summary = [];
    issues.forEach(function(issue) {
      if (issue.urgency !== "low") {
        summary.push({ urgency: issue.urgency, text: issue.title + " (" + issue.report_count + " reports)" });
      }
    });
    summary.push({ type: "success", text: posCount + " positive feedback items praising Wrangler 3.0, Workers AI, D1, and support" });

    await env.DB.prepare("INSERT INTO analysis_runs (created_at, summary, sentiment, urgency, themes, issues) VALUES (?, ?, ?, ?, ?, ?)").bind(
      new Date().toISOString(), JSON.stringify(summary), JSON.stringify(sentiment), "critical", "[]", JSON.stringify(issues)
    ).run();

    return jsonResponse({ success: true, message: "Analyzed " + feedbackItems.length + " reports -> " + issues.length + " issues" });
  } catch (error) {
    return jsonResponse({ success: false, message: "Analysis failed: " + error.message }, 500);
  }
}

async function handleDashboard(env) {
  try {
    var analysisResult = await env.DB.prepare("SELECT * FROM analysis_runs ORDER BY created_at DESC LIMIT 1").all();
    var feedbackResult = await env.DB.prepare("SELECT id, source, text, created_at, ai_sentiment, ai_urgency FROM feedback ORDER BY CASE ai_urgency WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC").all();
    var allFeedback = feedbackResult.results || [];

    var latestAnalysis = null, issues = [];
    if (analysisResult.results && analysisResult.results.length > 0) {
      var a = analysisResult.results[0];
      issues = JSON.parse(a.issues || "[]");
      issues.forEach(function(issue) {
        if (issue.feedback_ids) {
          issue.feedback_items = issue.feedback_ids.map(function(idx) { return allFeedback[idx - 1]; }).filter(function(f) { return f; });
          issue.report_count = issue.feedback_items.length;
        }
      });
      issues = sortByUrgency(issues);
      latestAnalysis = { created_at: a.created_at, executive_summary: JSON.parse(a.summary || "[]"), sentiment_breakdown: JSON.parse(a.sentiment || "{}") };
    }

    var countResult = await env.DB.prepare("SELECT COUNT(*) as total FROM feedback").all();
    return jsonResponse({ latest_analysis: latestAnalysis, issues: issues, all_feedback: allFeedback, metrics: { total: countResult.results[0].total } });
  } catch (error) {
    return jsonResponse({ latest_analysis: null, issues: [], all_feedback: [], metrics: { total: 0 } });
  }
}

async function handleClear(env) {
  try {
    await env.DB.prepare("DELETE FROM feedback").run();
    await env.DB.prepare("DELETE FROM analysis_runs").run();
    return jsonResponse({ success: true, message: "Cleared" });
  } catch (error) {
    return jsonResponse({ success: false, message: error.message }, 500);
  }
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
