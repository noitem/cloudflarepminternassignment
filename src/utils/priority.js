/**
 * Shared, single-source-of-truth urgency sorting utilities.
 *
 * Works in both:
 *  - Worker/server-side (imports)
 *  - Browser (via PRIORITY_UTILS_BROWSER_SNIPPET injected into HTML)
 */

// -----------------------------------------------------------------------------
// Normalization helpers
// -----------------------------------------------------------------------------

function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function normalizeToken(v) {
  return toStr(v).trim().toLowerCase();
}

function firstDefined(obj, keys) {
  if (!obj) return undefined;
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (obj[k] !== undefined && obj[k] !== null && toStr(obj[k]).trim() !== "") return obj[k];
  }
  return undefined;
}

function parseNumberLike(v) {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  var s = toStr(v);
  // Extract first integer/float in string (e.g. "(6 reports)")
  var m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return undefined;
  var n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

function parseISODate(v) {
  if (!v) return undefined;
  try {
    var d = new Date(v);
    var t = d.getTime();
    return Number.isFinite(t) ? t : undefined;
  } catch (_) {
    return undefined;
  }
}

function safeLowerText(item) {
  var t = firstDefined(item, ["text", "title", "name", "summary", "message"]);
  return normalizeToken(t);
}

// -----------------------------------------------------------------------------
// Severity ranking
// -----------------------------------------------------------------------------

var SEVERITY_RANK = {
  p0: 0,
  critical: 0,
  sev0: 0,
  blocker: 0,
  p1: 1,
  high: 1,
  sev1: 1,
  p2: 2,
  medium: 2,
  med: 2,
  sev2: 2,
  p3: 3,
  low: 3,
  sev3: 3,
};

// Only used when there is no explicit severity.
// Matches the user spec for Summary inference.
var KEYWORDS = {
  high: ["data loss", "http 500", "500", "outage", "auth", "billing incorrect", "ssl stuck", "pending_validation"],
  medium: ["regression", "cold start", "performance", "latency", "slow"],
  low: ["ui", "typo", "favicon"],
};

export function getSeverityRank(item) {
  var raw = firstDefined(item, [
    "priority",
    "severity",
    "level",
    "pLevel",
    "badge",
    "urgency",
    "ai_urgency",
  ]);

  var token = normalizeToken(raw);
  // Normalize common urgency values (e.g. "critical")
  if (token in SEVERITY_RANK) return SEVERITY_RANK[token];

  // Accept things like "P0", "P1" in mixed strings
  var m = token.match(/p\s*([0-3])/);
  if (m) return Number(m[1]);

  // Keyword inference ONLY if there was no explicit field.
  if (raw === undefined) {
    var text = safeLowerText(item);
    if (text) {
      for (var i = 0; i < KEYWORDS.high.length; i++) if (text.indexOf(KEYWORDS.high[i]) !== -1) return 0;
      for (var j = 0; j < KEYWORDS.medium.length; j++) if (text.indexOf(KEYWORDS.medium[j]) !== -1) return 2;
      for (var k = 0; k < KEYWORDS.low.length; k++) if (text.indexOf(KEYWORDS.low[k]) !== -1) return 3;
    }
  }

  return 99;
}

// -----------------------------------------------------------------------------
// Status ranking (unfinished first)
// -----------------------------------------------------------------------------

var STATUS_RANK = {
  investigating: 0,
  pending: 0,
  "in progress": 0,
  inprogress: 0,
  open: 0,
  blocked: 0,
  mitigating: 0,
  triage: 0,
  todo: 0,

  done: 100,
  resolved: 100,
  closed: 100,
};

export function getStatusRank(item) {
  var raw = firstDefined(item, ["status", "state", "incidentStatus", "actionStatus"]);
  var token = normalizeToken(raw);
  if (!token) return 50;
  // Keep some common variations
  if (token === "in_progress") token = "in progress";
  if (token in STATUS_RANK) return STATUS_RANK[token];
  return 50;
}

// -----------------------------------------------------------------------------
// Tie-breakers
// -----------------------------------------------------------------------------

function getImpactValue(item) {
  // Prefer explicit numeric fields
  var n = firstDefined(item, ["reports", "count", "reportCount", "report_count", "issueCount", "items"]);
  var v = parseNumberLike(n);
  if (v !== undefined) return v;

  // Parse from text like "Something (6 reports)"
  var text = firstDefined(item, ["text", "title", "name"]);
  var parsed = parseNumberLike(text);
  if (parsed !== undefined) return parsed;

  return 0;
}

function getNegativity(item) {
  // Higher negativity first
  var neg = firstDefined(item, ["negativePct", "negative_percent", "negPct"]);
  var negV = parseNumberLike(neg);
  if (negV !== undefined) return negV;

  var score = firstDefined(item, ["sentimentScore", "sentiment_score"]);
  var sV = parseNumberLike(score);
  // Assume sentimentScore: lower is worse (more negative)
  if (sV !== undefined) return -sV;

  // If there's an explicit sentiment label
  var label = normalizeToken(firstDefined(item, ["sentiment", "ai_sentiment"]));
  if (label === "negative") return 100;
  if (label === "neutral") return 50;
  if (label === "positive") return 0;

  return 0;
}

function getRecencyMs(item) {
  // More recent first
  var t = firstDefined(item, ["updatedAt", "updated_at", "createdAt", "created_at"]);
  var ms = parseISODate(t);
  if (ms !== undefined) return ms;

  var age = firstDefined(item, ["ageHours", "hoursAgo", "hours_ago"]);
  var ageV = parseNumberLike(age);
  if (ageV !== undefined) {
    // Convert age to a comparable ms value (lower age => higher ms)
    return Date.now() - ageV * 3600 * 1000;
  }
  return 0;
}

function getTitleKey(item) {
  var t = firstDefined(item, ["title", "name", "text"]);
  return normalizeToken(t);
}

// -----------------------------------------------------------------------------
// Scoring + sorting
// -----------------------------------------------------------------------------

export function computePriorityScore(item) {
  // Lower score = more urgent
  var sev = getSeverityRank(item);
  var status = getStatusRank(item);
  // Status influences but should never override severity: add as a smaller component.
  return sev * 1000 + status;
}

export function sortByUrgency(items) {
  var arr = Array.isArray(items) ? items.slice() : [];
  // Decorate for stable sort
  var decorated = arr.map(function (item, idx) {
    return {
      item: item,
      idx: idx,
      sev: getSeverityRank(item),
      status: getStatusRank(item),
      impact: getImpactValue(item),
      neg: getNegativity(item),
      recency: getRecencyMs(item),
      title: getTitleKey(item),
    };
  });

  decorated.sort(function (a, b) {
    // 1) severity
    if (a.sev !== b.sev) return a.sev - b.sev;
    // 2) status (unfinished first)
    if (a.status !== b.status) return a.status - b.status;
    // 3) impact (desc)
    if (a.impact !== b.impact) return b.impact - a.impact;
    // 4) negativity (desc)
    if (a.neg !== b.neg) return b.neg - a.neg;
    // 5) recency (desc)
    if (a.recency !== b.recency) return b.recency - a.recency;
    // 6) deterministic alphabetical
    if (a.title < b.title) return -1;
    if (a.title > b.title) return 1;
    // 7) stable
    return a.idx - b.idx;
  });

  return decorated.map(function (d) {
    return d.item;
  });
}

// -----------------------------------------------------------------------------
// Browser snippet for injecting into the dashboard HTML.
// -----------------------------------------------------------------------------

// Keep this snippet small and dependency-free. It exposes the same API on window.PriorityUtils.
export const PRIORITY_UTILS_BROWSER_SNIPPET = `
(function(){
  function toStr(v){return v===null||v===undefined?"":String(v)}
  function norm(v){return toStr(v).trim().toLowerCase()}
  function first(o,keys){if(!o)return undefined;for(var i=0;i<keys.length;i++){var k=keys[i];if(o[k]!==undefined&&o[k]!==null&&toStr(o[k]).trim()!=="")return o[k]}return undefined}
  function num(v){if(v===null||v===undefined)return undefined;if(typeof v==="number"&&isFinite(v))return v;var s=toStr(v);var m=s.match(/-?\\d+(?:\\.\\d+)?/);if(!m)return undefined;var n=Number(m[0]);return isFinite(n)?n:undefined}
  function iso(v){if(!v)return undefined;try{var d=new Date(v);var t=d.getTime();return isFinite(t)?t:undefined}catch(e){return undefined}}
  function textLower(item){var t=first(item,["text","title","name","summary","message"]);return norm(t)}

  var SEV={p0:0,critical:0,sev0:0,blocker:0,p1:1,high:1,sev1:1,p2:2,medium:2,med:2,sev2:2,p3:3,low:3,sev3:3};
  var KW={high:["data loss","http 500","500","outage","auth","billing incorrect","ssl stuck","pending_validation"],medium:["regression","cold start","performance","latency","slow"],low:["ui","typo","favicon"]};

  function getSeverityRank(item){
    var raw=first(item,["priority","severity","level","pLevel","badge","urgency","ai_urgency"]);
    var token=norm(raw);
    if(token&&SEV[token]!==undefined)return SEV[token];
    var m=token.match(/p\\s*([0-3])/);if(m)return Number(m[1]);
    if(raw===undefined){
      var t=textLower(item);
      if(t){
        for(var i=0;i<KW.high.length;i++)if(t.indexOf(KW.high[i])!==-1)return 0;
        for(var j=0;j<KW.medium.length;j++)if(t.indexOf(KW.medium[j])!==-1)return 2;
        for(var k=0;k<KW.low.length;k++)if(t.indexOf(KW.low[k])!==-1)return 3;
      }
    }
    return 99;
  }

  var STATUS={investigating:0,pending:0,"in progress":0,inprogress:0,open:0,blocked:0,mitigating:0,triage:0,todo:0,done:100,resolved:100,closed:100};
  function getStatusRank(item){
    var raw=first(item,["status","state","incidentStatus","actionStatus"]);
    var token=norm(raw);
    if(!token)return 50;
    if(token==="in_progress")token="in progress";
    return STATUS[token]!==undefined?STATUS[token]:50;
  }

  function impact(item){
    var n=first(item,["reports","count","reportCount","report_count","issueCount","items"]);
    var v=num(n);if(v!==undefined)return v;
    var t=first(item,["text","title","name"]);
    var p=num(t);if(p!==undefined)return p;
    return 0;
  }
  function neg(item){
    var n=first(item,["negativePct","negative_percent","negPct"]);
    var v=num(n);if(v!==undefined)return v;
    var s=first(item,["sentimentScore","sentiment_score"]);
    var sv=num(s);if(sv!==undefined)return -sv;
    var lab=norm(first(item,["sentiment","ai_sentiment"]));
    if(lab==="negative")return 100;if(lab==="neutral")return 50;if(lab==="positive")return 0;
    return 0;
  }
  function recency(item){
    var t=first(item,["updatedAt","updated_at","createdAt","created_at"]);
    var ms=iso(t);if(ms!==undefined)return ms;
    var age=first(item,["ageHours","hoursAgo","hours_ago"]);
    var av=num(age);if(av!==undefined)return Date.now()-av*3600*1000;
    return 0;
  }
  function titleKey(item){return norm(first(item,["title","name","text"]))}

  function computePriorityScore(item){return getSeverityRank(item)*1000+getStatusRank(item)}
  function sortByUrgency(items){
    var arr=Array.isArray(items)?items.slice():[];
    var deco=arr.map(function(item,idx){return{item:item,idx:idx,sev:getSeverityRank(item),status:getStatusRank(item),impact:impact(item),neg:neg(item),recency:recency(item),title:titleKey(item)}});
    deco.sort(function(a,b){
      if(a.sev!==b.sev)return a.sev-b.sev;
      if(a.status!==b.status)return a.status-b.status;
      if(a.impact!==b.impact)return b.impact-a.impact;
      if(a.neg!==b.neg)return b.neg-a.neg;
      if(a.recency!==b.recency)return b.recency-a.recency;
      if(a.title<b.title)return -1;if(a.title>b.title)return 1;
      return a.idx-b.idx;
    });
    return deco.map(function(d){return d.item});
  }

  window.PriorityUtils={getSeverityRank:getSeverityRank,getStatusRank:getStatusRank,computePriorityScore:computePriorityScore,sortByUrgency:sortByUrgency};
})();
`;
