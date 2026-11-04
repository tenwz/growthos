/**
 * Generates the synthetic Summit Air demo repo.
 * Run with: pnpm tsx scripts/generate-demo.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeQuoteHash,
  ensureDir,
  isoDate,
  newId,
  removeDir,
  slugify,
  stringifyFrontmatter,
  writeText,
} from "../packages/core/src/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "examples", "hvac-saas");
const base = new Date("2026-11-05T16:00:00Z");

interface Seed {
  channel:
    | "interview"
    | "support_ticket"
    | "reddit_comment"
    | "x_post"
    | "review"
    | "call"
    | "survey";
  segment: string;
  quote: string;
  summary: string;
  tags: string[];
  daysAgo: number;
  author?: string;
}

const seeds: Seed[] = [
  // Discovery interviews
  {
    channel: "interview",
    segment: "owner-operator",
    daysAgo: 2,
    tags: ["missed-calls", "revenue"],
    author: "Owner, 14-tech HVAC company",
    quote:
      "We miss maybe fifteen calls a week. Two of them are people ready to spend ten thousand dollars on a replacement.",
    summary: "Owner measures missed calls by lost replacement jobs.",
  },
  {
    channel: "interview",
    segment: "owner-operator",
    daysAgo: 3,
    tags: ["ai-sdr", "trust"],
    author: "Owner, 6-tech HVAC company",
    quote:
      "Every AI salesperson I tried sounded like a robot reading my website. I hung up on two of them.",
    summary: "Owner distrusts AI outbound voice.",
  },
  {
    channel: "interview",
    segment: "ops-manager",
    daysAgo: 4,
    tags: ["dispatcher", "power"],
    author: "Ops manager, 22-tech HVAC company",
    quote:
      "The owner thinks he runs the board. The dispatcher actually decides which calls get called back first.",
    summary: "Dispatcher controls the callback queue.",
  },
  {
    channel: "interview",
    segment: "owner-operator",
    daysAgo: 5,
    tags: ["pricing", "roi"],
    author: "Owner, 9-tech HVAC company",
    quote:
      "If you show me eight recovered jobs a month, I do not care what the software costs. If you show me a dashboard, I do.",
    summary: "ROI framing in recovered jobs beats features.",
  },
  {
    channel: "interview",
    segment: "ops-manager",
    daysAgo: 6,
    tags: ["after-hours", "missed-calls"],
    author: "Ops manager, 18-tech HVAC company",
    quote:
      "After six, calls go to voicemail. By morning the homeowner already called somebody else.",
    summary: "After-hours calls are lost to competitors.",
  },
  {
    channel: "interview",
    segment: "owner-operator",
    daysAgo: 7,
    tags: ["fsm", "workflow"],
    author: "Owner, 11-tech HVAC company",
    quote:
      "Our field service software tells me I missed nine calls. It does not tell me who they were or call them back.",
    summary: "FSM reporting stops at the report.",
  },
  {
    channel: "interview",
    segment: "technician",
    daysAgo: 8,
    tags: ["follow-up", "estimates"],
    author: "Senior technician",
    quote:
      "I find a bad capacitor and a dying compressor, tell the dispatcher, and the quote never goes out.",
    summary: "Replacement quotes leak after the service call.",
  },
  {
    channel: "interview",
    segment: "owner-operator",
    daysAgo: 9,
    tags: ["operations", "no-shows"],
    author: "Owner, 5-tech HVAC company",
    quote:
      "My office manager spends the first two hours every day apologizing to people we forgot to call.",
    summary: "Morning routine is manual apology and recovery.",
  },

  // Support tickets
  {
    channel: "support_ticket",
    segment: "ops-manager",
    daysAgo: 10,
    tags: ["missed-calls", "product-gap"],
    quote: "Your report shows 14 missed calls but there is no way to assign a callback.",
    summary: "Missed-call report has no recovery workflow.",
  },
  {
    channel: "support_ticket",
    segment: "owner-operator",
    daysAgo: 11,
    tags: ["ai-sdr", "churn"],
    quote:
      "We cancelled after the AI voicemail. It did not sound like a person, and our customers hated it.",
    summary: "AI voice caused a cancellation.",
  },
  {
    channel: "support_ticket",
    segment: "dispatcher",
    daysAgo: 12,
    tags: ["dispatcher", "callback"],
    quote:
      "Can we see which callbacks are aging past 24 hours? Right now we find out when the customer calls again, angry.",
    summary: "Dispatcher needs callback aging.",
  },
  {
    channel: "support_ticket",
    segment: "owner-operator",
    daysAgo: 13,
    tags: ["pricing", "roi"],
    quote:
      "Show me recovered jobs, not seats or messages. I cannot take a seat count to my partner.",
    summary: "Buyer wants recovered-job ROI.",
  },
  {
    channel: "support_ticket",
    segment: "ops-manager",
    daysAgo: 14,
    tags: ["after-hours", "automation"],
    quote:
      "Can a missed call after hours trigger a text automatically? We lose the panic calls every night.",
    summary: "After-hours automation request.",
  },
  {
    channel: "support_ticket",
    segment: "dispatcher",
    daysAgo: 15,
    tags: ["missed-calls", "recovery"],
    quote:
      "I exported 38 lost calls last month and called every one manually. We recovered six jobs.",
    summary: "Manual callback recovery works.",
  },

  // Reddit-style comments
  {
    channel: "reddit_comment",
    segment: "owner-operator",
    daysAgo: 16,
    tags: ["missed-calls", "revenue"],
    author: "u/hvac_owner_88",
    quote:
      "We added a callback list and recovered $18k in one month. The leads were already calling us. We just never called back.",
    summary: "Callback list recovered $18k.",
  },
  {
    channel: "reddit_comment",
    segment: "owner-operator",
    daysAgo: 17,
    tags: ["ai-sdr", "positioning"],
    author: "u/ducttapeandprayers",
    quote: "Nobody wants an AI SDR. We want a receptionist that does not forget.",
    summary: "Buyer rejects AI SDR framing.",
  },
  {
    channel: "reddit_comment",
    segment: "owner-operator",
    daysAgo: 18,
    tags: ["after-hours", "urgency"],
    author: "u/coldacnhotlead",
    quote:
      "The after-hours caller is a different buyer. They are panicking. They will pay for speed.",
    summary: "After-hours buyer is urgency-driven.",
  },
  {
    channel: "reddit_comment",
    segment: "dispatcher",
    daysAgo: 19,
    tags: ["dispatch", "tooling"],
    author: "u/dispatch_life",
    quote:
      "Our dispatch board is a whiteboard and three phones. Software that adds another dashboard is useless.",
    summary: "Dispatchers reject another dashboard.",
  },

  // X-style posts
  {
    channel: "x_post",
    segment: "owner-operator",
    daysAgo: 20,
    tags: ["ai-sdr", "lead-quality"],
    author: "@hvac_ops",
    quote: "Tried an AI SDR for a month. 3 meetings, 2 were with other AI companies. Never again.",
    summary: "AI SDR produced low-quality meetings.",
  },
  {
    channel: "x_post",
    segment: "dispatcher",
    daysAgo: 21,
    tags: ["dispatcher", "growth"],
    author: "@dispatch_daily",
    quote:
      "The best growth hire for an HVAC company is not a marketer. It is a dispatcher who follows up.",
    summary: "Follow-up dispatcher is the growth lever.",
  },
  {
    channel: "x_post",
    segment: "owner-operator",
    daysAgo: 22,
    tags: ["fsm", "workflow"],
    author: "@service_biz",
    quote: "If your HVAC software only reports missed calls, it is a scoreboard, not a fix.",
    summary: "Reporting is not recovery.",
  },
  {
    channel: "x_post",
    segment: "homeowner",
    daysAgo: 23,
    tags: ["after-hours", "buyer"],
    author: "@hot_house_az",
    quote: "My AC died at 9pm. I called four companies. The first one that picked up got the job.",
    summary: "Homeowner buys whoever answers first.",
  },

  // Reviews
  {
    channel: "review",
    segment: "owner-operator",
    daysAgo: 24,
    tags: ["missed-calls", "review"],
    author: "G2-style review",
    quote:
      "Great scheduling, but we still lose calls when the front desk is busy. Would pay for callback recovery.",
    summary: "Review asks for callback recovery.",
  },
  {
    channel: "review",
    segment: "owner-operator",
    daysAgo: 25,
    tags: ["reporting", "profitability"],
    author: "Capterra-style review",
    quote:
      "The reports are beautiful. I still cannot tell which jobs were profitable until the month is over.",
    summary: "Reports do not show job profitability in time.",
  },
  {
    channel: "review",
    segment: "owner-operator",
    daysAgo: 26,
    tags: ["ai-sdr", "trust"],
    author: "Review site",
    quote: "Support is good. The AI voice feature is creepy. Please let a human call me back.",
    summary: "AI voice is creepy; human callback preferred.",
  },

  // Call transcripts
  {
    channel: "call",
    segment: "owner-operator",
    daysAgo: 27,
    tags: ["missed-calls", "positioning"],
    quote: "I do not need more leads. I need the ones I already paid for to get a call back.",
    summary: "Owner wants recovery, not more leads.",
  },
  {
    channel: "call",
    segment: "owner-operator",
    daysAgo: 28,
    tags: ["ai-sdr", "trust"],
    quote: "Can it call them back sounding like a human, or does it sound like a robot?",
    summary: "Owner's first question is whether it sounds human.",
  },
  {
    channel: "call",
    segment: "ops-manager",
    daysAgo: 29,
    tags: ["dispatch", "adoption"],
    quote: "The dispatcher would quit if we added another screen to check.",
    summary: "Adoption risk is another screen.",
  },

  // Survey free text
  {
    channel: "survey",
    segment: "owner-operator",
    daysAgo: 30,
    tags: ["missed-calls", "volume"],
    quote:
      "Biggest operational leak: calls we miss during the morning rush. Estimated 10-20 per week.",
    summary: "Morning rush causes 10-20 missed calls.",
  },
  {
    channel: "survey",
    segment: "ops-manager",
    daysAgo: 30,
    tags: ["callback", "no-shows"],
    quote:
      "Would switch for automatic callbacks, no-show reminders, and a quote follow-up sequence.",
    summary: "Buyer wants three recovery workflows.",
  },
  {
    channel: "survey",
    segment: "owner-operator",
    daysAgo: 30,
    tags: ["pricing", "trust"],
    quote: "Budget is not the issue. Trust is. I need to see it work on my own missed calls first.",
    summary: "Trust requires a pilot on real missed calls.",
  },
];

function dateAt(daysAgo: number, hour = 16): string {
  const date = new Date(base.getTime() - daysAgo * 86_400_000);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

function receiptTable(signals: { id: string; quote: string; url: string }[]): string {
  return [
    "## Receipts",
    "",
    "<!-- generated by growthOS from the claims above; do not edit by hand -->",
    "",
    "| ID | Quote | Source |",
    "| --- | --- | --- |",
    ...signals.map(
      (signal) =>
        `| ${signal.id} | "${signal.quote.replace(/\s+/g, " ").replace(/\|/g, "\\|")}" | ${signal.url} |`,
    ),
    "",
  ].join("\n");
}

removeDir(target);
ensureDir(path.join(target, ".growthos"));
ensureDir(path.join(target, "growth", "signals"));
ensureDir(path.join(target, "growth", "memos", "rejected"));
ensureDir(path.join(target, "growth", "experiments"));
ensureDir(path.join(target, "growth", "learnings"));
ensureDir(path.join(target, "growth", "metrics"));
ensureDir(path.join(target, "growth", "agents"));
ensureDir(path.join(target, "growth", "cockpit"));

writeText(
  path.join(target, ".growthos", "config.yaml"),
  `schema: growthos/config@1
spec: "0.1"
repo:
  name: Summit Air
  timezone: America/Denver

providers:
  default: command
  command:
    cmd: ["claude", "-p"]
    timeout_seconds: 900

score:
  min_signals: 20
  require_public_for_certified: true

cockpit:
  title: Summit Air
  theme: dark
`,
);

writeText(
  path.join(target, "growth", "company.md"),
  `# Summit Air

> **Synthetic demo company.** Summit Air is fictional. Every signal is marked \`provenance: synthetic\`.

- **Name:** Summit Air
- **What we sell:** Missed-call recovery for owner-operated HVAC companies
- **Who buys it:** Owners and ops managers at 5–30 technician shops
- **The pain we remove:** Revenue leaking through missed calls, no-shows, and unsent replacement quotes
- **What buyers use instead:** Field service software reports, a whiteboard dispatch board, and a receptionist who is already busy
- **Our unfair insight:** The buyer does not want more leads. They want the calls they already paid for to get a callback.
- **What we are not:** An AI SDR, a voice robot, or another analytics dashboard
- **Current stage:** Pre-seed synthetic demo
- **Primary conversion event:** Qualified demo request
`,
);

writeText(
  path.join(target, "growth", "icp.md"),
  `# Ideal Customer Profile

## Primary segment

- **Role:** Owner-operator or ops manager
- **Company size:** 5–30 technicians
- **Industry:** Residential and light commercial HVAC
- **Trigger events:** Hiring a dispatcher, opening a new location, a spike in bad reviews, a new field-service software rollout
- **Where they hang out:** r/hvacadvice, service-business X, local contractor groups
- **What they read:** Field-service forums, trade newsletters, peer owner groups

## Buying committee

| Person | Cares about | Objection |
| --- | --- | --- |
| Owner | Recovered revenue, not seats | "I already have software." |
| Ops manager | Fewer angry callbacks | "My dispatcher will not adopt another screen." |
| Dispatcher | A short, honest queue | "This will just create more work for me." |

## Anti-ICP

National HVAC roll-ups with in-house call centers. They already have 24/7 dispatch and do not feel the pain.
`,
);

writeText(
  path.join(target, "growth", "voice.md"),
  `# Summit Air Voice

## We sound like

- A dispatcher who actually picks up.
- Specific about recovered jobs and lost revenue.
- Calm, not hypey.

## We never sound like

- An AI SDR that "personalizes at scale."
- A dashboard vendor talking about "visibility."
- A growth hacker with fake scarcity.

## Sentences we have actually said

- "Stop losing replacement revenue after every service call."
- "The leads already called you. You just never called back."

## Words customers use

- missed calls, callbacks, no-shows, dispatch, replacement quote, after hours, front desk.

## Words we avoid

- AI SDR, omnichannel, synergy, 10x, revolutionary.
`,
);

const signalRecords: {
  id: string;
  quote: string;
  url: string;
  kind: string;
}[] = [];

seeds.forEach((seed, index) => {
  const id = newId("sig");
  const captured = dateAt(seed.daysAgo, 16);
  const published = dateAt(seed.daysAgo + 1, 14);
  const url = `https://example.com/demo/summit-air/${index + 1}`;
  const quoteHash = computeQuoteHash({
    quote: seed.quote,
    url,
    publishedAt: published,
  });
  const data = {
    schema: "growthos/signal@1",
    id,
    status: "active",
    provenance: "synthetic",
    captured_at: captured,
    source: {
      kind: seed.channel,
      url,
      author: seed.author ?? "Synthetic demo source",
      published_at: published,
      retrieved_at: captured,
    },
    quote: seed.quote,
    summary: seed.summary,
    segment: seed.segment,
    sentiment: "negative",
    tags: seed.tags,
    consent: "public",
    integrity: {
      quote_hash: quoteHash,
      canonical_url: url,
    },
    supersedes: null,
  };
  const filename = `${isoDate(new Date(captured))}-${seed.channel}-${slugify(seed.quote, 42)}.md`;
  writeText(
    path.join(target, "growth", "signals", filename),
    stringifyFrontmatter(data, `Synthetic demo signal. ${seed.summary}\n`),
  );
  signalRecords.push({ id, quote: seed.quote, url, kind: seed.channel });
});

const sig = (n: number) => signalRecords[n - 1] as { id: string; quote: string; url: string };

const claimReceipts = [
  [1, 9, 15],
  [2, 10, 19],
  [3, 11, 20],
  [4, 12, 16],
  [5, 17, 21],
  [6, 13, 22],
].flat();

const receiptIds = new Set(claimReceipts.map((n) => sig(n).id));
if (receiptIds.size !== 18) throw new Error(`Expected 18 receipts, got ${receiptIds.size}`);

const exp1 = newId("exp");
const exp2 = newId("exp");
const exp3 = newId("exp");

const passingMemo = `# What the market is telling us — Week 45

## Executive summary

Summit Air owners do not want another analytics dashboard. The repeated pain is revenue leaking through missed calls, no-shows, and unsent replacement quotes. They want recovery, not reporting.

## Claims

- **Owner-operated HVAC shops lose 10–15 calls a week, and those callers often buy from the next company.** [@${sig(1).id}] [@${sig(9).id}] [@${sig(15).id}]
- **Owners reject "AI SDR": one tried it for a month and got "3 meetings, 2 were with other AI companies."** [@${sig(2).id}] [@${sig(10).id}] [@${sig(19).id}]
- **Dispatchers decide which callbacks happen first: "The owner thinks he runs the board."** [@${sig(3).id}] [@${sig(11).id}] [@${sig(20).id}]
- **Price sensitivity drops when ROI is framed as recovered jobs: "If you show me eight recovered jobs a month, I do not care what the software costs."** [@${sig(4).id}] [@${sig(12).id}] [@${sig(16).id}]
- **After-hours calls are a separate wedge: "They will pay for speed."** [@${sig(5).id}] [@${sig(17).id}] [@${sig(21).id}]
- **Existing field-service tools report missed calls but do not run recovery: "it is a scoreboard, not a fix."** [@${sig(6).id}] [@${sig(13).id}] [@${sig(22).id}]

## What we are not saying

- We are not saying owners want a fully autonomous voice agent. The evidence says the opposite: they want a human-sounding callback and a human to close the job.
- We are not saying this generalizes to national roll-ups with 24/7 call centers. We have zero signals from that segment.
- We are not saying price is irrelevant. We are saying buyers compare recovered jobs, not software seats.

## What to test next

Test a missed-call recovery landing page against a "no-show calculator" lead magnet. The primary metric is qualified demo requests. [@${exp1}]

## Receipts

<!-- generated by growthOS from the claims above; do not edit by hand -->

| ID | Quote | Source |
| --- | --- | --- |
${claimReceipts
  .map((n) => sig(n))
  .map(
    (signal) =>
      `| ${signal.id} | "${signal.quote.replace(/\s+/g, " ").replace(/\|/g, "\\|")}" | ${signal.url} |`,
  )
  .join("\n")}
`;

writeText(
  path.join(target, "growth", "memos", "2026-11-05-whatthemarketistellingus.md"),
  stringifyFrontmatter(
    {
      schema: "growthos/memo@1",
      id: newId("memo"),
      period: "2026-W45",
      status: "draft",
      generated_by: "job_customer-truth",
      claim_count: 6,
      receipt_count: 18,
      source_diversity: 4,
      created_at: new Date(Date.now() - 3_600_000).toISOString(),
      published_at: null,
      supersedes: null,
    },
    passingMemo,
  ),
);

const failingMemo = `# Draft — missed call AI angle

## Claims

- **HVAC owners are overwhelmed by too many leads.** [@${sig(15).id}]
- **HVAC owners want an AI SDR.**
- **Dispatchers are the main buyer.** [@${sig(20).id}]
- **Software should be cheaper.** [@${sig(12).id}]

## What to test next

Test the AI SDR angle on LinkedIn.
`;

writeText(
  path.join(target, "growth", "memos", "2026-11-03-draft-missed-call-ai.md"),
  stringifyFrontmatter(
    {
      schema: "growthos/memo@1",
      id: newId("memo"),
      period: "2026-W45",
      status: "draft",
      generated_by: "job_customer-truth",
      claim_count: 4,
      receipt_count: 3,
      source_diversity: 3,
      created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      published_at: null,
      supersedes: null,
    },
    failingMemo,
  ),
);

writeText(
  path.join(target, "growth", "memos", "rejected", "rejected-vague-claims.md"),
  stringifyFrontmatter(
    {
      schema: "growthos/memo@1",
      id: newId("memo"),
      period: "2026-W45",
      status: "rejected",
      generated_by: "job_customer-truth",
      created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      published_at: null,
      supersedes: null,
    },
    `# Rejected — vague claims

Rejected because every claim was a summary, not evidence.

- Customers want better collaboration.
- The market is shifting toward AI.
- Businesses need more automation.
- Owners care about efficiency.

**Why rejected:** no receipt, no segment, no behavior, no number. This is the kind of memo that makes a company feel informed while teaching it nothing.
`,
  ),
);

function experimentFile(
  id: string,
  input: {
    status: string;
    hypothesis: string;
    signalIds: string[];
    channel: string;
    audience: string;
    metric: string;
    target: number;
    observed: number | null;
    decision: string | null;
    learning: string | null;
    resultRow: string | null;
  },
): string {
  const frontmatter = {
    schema: "growthos/experiment@1",
    id,
    status: input.status,
    hypothesis: input.hypothesis,
    signal_ids: input.signalIds,
    channel: input.channel,
    audience: input.audience,
    owner: "human",
    start_at: "2026-11-05T16:00:00Z",
    end_at: "2026-11-19T16:00:00Z",
    primary_metric: {
      name: input.metric,
      baseline: 0,
      target: input.target,
      observed: input.observed,
    },
    guardrails: ["no_fake_scarcity", "human_follow_up_only"],
    decision: input.decision,
    learning: input.learning,
  };
  const body = `## Design

${input.hypothesis}

## Asset

See \`asset.md\`.

## Results

| Date | Metric | Value | Receipt |
| --- | --- | --- | --- |
${input.resultRow ?? ""}
`;
  return stringifyFrontmatter(frontmatter, body);
}

writeText(
  path.join(target, "growth", "experiments", exp1, "experiment.md"),
  experimentFile(exp1, {
    status: "complete",
    hypothesis:
      "A missed-call recovery landing page will produce 8 qualified demo requests in 14 days.",
    signalIds: [sig(1).id, sig(9).id, sig(15).id],
    channel: "landing_page",
    audience: "hvac-owner-operator",
    metric: "qualified_demo_requests",
    target: 8,
    observed: 11,
    decision: "scale",
    learning:
      "Recovery framing beat 'more leads' by 2.4x. The winning headline named the lost job, not the software.",
    resultRow: "| 2026-11-19 | qualified_demo_requests | 11 | growth/metrics/2026-11-05.json |",
  }),
);
writeText(
  path.join(target, "growth", "experiments", exp1, "asset.md"),
  "# Asset — missed-call recovery landing page\n\nHeadline: **Every missed call is a job your competitor got.**\n\nCTA: Get a free missed-call audit.\n",
);

writeText(
  path.join(target, "growth", "experiments", exp2, "experiment.md"),
  experimentFile(exp2, {
    status: "complete",
    hypothesis: "A no-show calculator lead magnet will produce 25 email captures in 14 days.",
    signalIds: [sig(5).id, sig(17).id, sig(21).id],
    channel: "lead_magnet",
    audience: "ops-manager",
    metric: "email_captures",
    target: 25,
    observed: 9,
    decision: "iterate",
    learning:
      "The calculator was interesting but not urgent. Ops managers downloaded it and did nothing. The recovery audit produced calls; the calculator produced emails.",
    resultRow: "| 2026-11-19 | email_captures | 9 | growth/metrics/2026-11-05.json |",
  }),
);
writeText(
  path.join(target, "growth", "experiments", exp2, "asset.md"),
  "# Asset — no-show calculator\n\nInputs: average job value, no-show rate, tech count.\n\nOutput: monthly lost revenue estimate.\n",
);

writeText(
  path.join(target, "growth", "experiments", exp3, "experiment.md"),
  experimentFile(exp3, {
    status: "running",
    hypothesis:
      "A founder video about the $48k missed call will produce 10 qualified replies on X.",
    signalIds: [sig(2).id, sig(19).id],
    channel: "x_video",
    audience: "hvac-owner-operator",
    metric: "qualified_replies",
    target: 10,
    observed: 4,
    decision: null,
    learning: null,
    resultRow:
      "| 2026-11-05 | qualified_replies | 4 | https://example.com/demo/summit-air/x-video |",
  }),
);
writeText(
  path.join(target, "growth", "experiments", exp3, "asset.md"),
  "# Asset — founder video\n\n90 seconds, screen recording plus captions. No face. One claim: the missed call is the most expensive call.\n",
);

writeText(
  path.join(target, "growth", "learnings", `${exp1}.md`),
  stringifyFrontmatter(
    {
      schema: "growthos/learning@1",
      experiment: exp1,
      decision: "scale",
      created_at: "2026-11-20T16:00:00Z",
    },
    `# Learning — missed-call recovery landing page\n\n**Decision:** scale\n\nRecovery framing beat "more leads" by 2.4x. The winning headline named the lost job, not the software. Next: test the same angle on after-hours calls.\n`,
  ),
);
writeText(
  path.join(target, "growth", "learnings", `${exp2}.md`),
  stringifyFrontmatter(
    {
      schema: "growthos/learning@1",
      experiment: exp2,
      decision: "iterate",
      created_at: "2026-11-20T16:00:00Z",
    },
    "# Learning — no-show calculator\n\n**Decision:** iterate\n\nThe calculator was interesting but not urgent. Ops managers downloaded it and did nothing. The recovery audit produced calls; the calculator produced emails. Kill the calculator as a primary CTA.\n",
  ),
);

writeText(
  path.join(target, "growth", "metrics", "2026-11-05.json"),
  `${JSON.stringify(
    {
      week: "2026-W45",
      signals: 31,
      pipeline: {
        conversations: 14,
        qualified: 7,
        meetings: 3,
        pipeline_usd: 42000,
      },
      experiments: {
        running: 1,
        complete: 2,
      },
      source: "synthetic demo",
      provenance: "synthetic",
    },
    null,
    2,
  )}\n`,
);

writeText(
  path.join(target, "PROOF.md"),
  `# Proof

> Synthetic demo. These are example numbers, not customer results.

## What this is

Summit Air is a fictional HVAC SaaS company used to demonstrate the growthOS evidence loop end to end. The mechanics are real. The customers are not.

## Week 0 (2026-11-05)

- Signals captured: 31
- Claims in the primary memo: 6
- Receipts: 18
- Source channels in the memo: 4
- Experiments: 3 (2 closed, 1 running)
- Qualified conversations: 7
- Meetings booked: 3
- Growth OS Score: 88/100 (System)

## Receipts

- [@${sig(1).id}]
- [@${sig(9).id}]
- [@${sig(15).id}]
- [@${exp1}]

## Failed experiment

The no-show calculator produced 9 email captures against a target of 25. We kept the failure in the repo because a proof page that only shows wins is not proof.
`,
);

writeText(
  path.join(target, "README.md"),
  `# Summit Air — synthetic growthOS demo

Summit Air is a fictional HVAC SaaS company. This repo shows the full growthOS loop:

- 31 synthetic signals across 7 channels
- 1 memo that **fails** because a claim has no receipt
- 1 memo that **passes** with 6 claims and 18 receipts
- 3 experiments, including a failed one
- A generated cockpit with a Growth OS Score of 88/100

\`\`\`bash
npx growthos doctor --strict
npx growthos score --explain
npx growthos cockpit --open
\`\`\`

Every signal carries \`provenance: synthetic\` and an \`example.com\` URL. Synthetic signals cannot back a published claim.
`,
);

for (const file of ["AGENTS.md", "CLAUDE.md"]) {
  const source = path.join(root, "templates", "base", file);
  writeText(path.join(target, file), readFileSync(source, "utf8"));
}

for (const job of [
  "customer-truth.job.md",
  "founder-content.job.md",
  "outbound-signal.job.md",
  "creative-testing.job.md",
  "ai-search-visibility.job.md",
  "growth-cockpit.job.md",
]) {
  const source = path.join(root, "templates", "base", "growth", "agents", job);
  writeText(path.join(target, "growth", "agents", job), readFileSync(source, "utf8"));
}

console.log(`Generated ${target}`);
console.log(`Signals: ${signalRecords.length}`);
console.log(`Experiments: ${exp1}, ${exp2}, ${exp3}`);
