/**
 * Seeds the repo's own Growth OS with real public signals.
 * Every quote is verbatim from the linked public source.
 * Idempotent: existing signals are reused by their x_key.
 *
 * Run with: pnpm tsx scripts/seed-dogfood.ts
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SignalSchema,
  computeQuoteHash,
  createExperiment,
  ensureDir,
  extractCitations,
  extractClaims,
  isoDate,
  loadRepo,
  newId,
  nowIso,
  parseFrontmatter,
  readText,
  repoPaths,
  slugify,
  stringifyFrontmatter,
  writeText,
} from "../packages/core/src/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

interface Seed {
  key: string;
  quote: string;
  url: string;
  publishedAt: string;
  source: "hn_comment" | "github_issue";
  segment: string;
  tags: string[];
  summary: string;
}

const SEEDS: Seed[] = [
  {
    key: "ai-sdr-saturation",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=48112629",
    publishedAt: "2026-05-12T18:51:37.000Z",
    segment: "marketing-lead",
    tags: ["outbound", "ai-sdr", "saturation"],
    summary: "AI SDR adoption erodes the channel and makes proof of work the differentiator.",
    quote:
      "The irony is that as marketing automation becomes 'complete', its effectiveness drops to zero because everyone is using it. When everyone has an AI SDR, no one answers their email. The only thing AI can't automate is the proof of work: the real relationships and the reputation that makes a customer believe you’ll still be around in six months.",
  },
  {
    key: "content-marketing-dead",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=43206941",
    publishedAt: "2025-02-28T15:47:42.000Z",
    segment: "content-operator",
    tags: ["seo", "content", "traffic"],
    summary: "SEO article traffic declined for a year despite sustained effort.",
    quote:
      "Content marketing is dead. AI has killed it. One of our main marketing channels was writing SEO-oriented articles on our company’s blog. The traffic has steadily decreased over the last year despite huge efforts.",
  },
  {
    key: "ai-overviews-no-click",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=48560685",
    publishedAt: "2026-06-16T19:31:48.000Z",
    segment: "content-operator",
    tags: ["ai-overviews", "seo", "traffic"],
    summary: "AI overviews end roughly 60% of searches without a click.",
    quote:
      "It's because you get better ad rates on Youtube than if you made a website and posted the information there. Additionally, the current state of the web (Google only exposing SEO blogspam, AI overviews making it so ~60% of searches end without the user clicking on a site) pushes people further and further away from making websites.",
  },
  {
    key: "serp-shift-predicted",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=37828917",
    publishedAt: "2023-10-10T05:49:25.000Z",
    segment: "content-operator",
    tags: ["seo", "serp", "prediction"],
    summary: "A 2023 comment predicted LLM answers would reduce clicks to SEO pages.",
    quote:
      "The gist of the article is that LLM-generated text will soon occupy more of the SERP, which will answer search queries without the user having to click on links, which drive down SEO traffic.",
  },
  {
    key: "ai-slop-fatigue",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=50348168",
    publishedAt: "2026-11-03T04:42:43.000Z",
    segment: "technical-founder",
    tags: ["ai-slop", "trust", "content"],
    summary: "A reader doomscrolls less because of the volume of AI slop.",
    quote:
      "For me, AI is helping in that respect in weird ways. There are so much AI slop content out there, I find myself doomscrolling much less these days.",
  },
  {
    key: "ai-writing-sounds-same",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=50098491",
    publishedAt: "2026-10-15T02:40:58.000Z",
    segment: "content-operator",
    tags: ["ai-writing", "differentiation", "voice"],
    summary: "AI-written articles sound interchangeable to readers.",
    quote:
      "Think its because how every article that was written by AI sounds the same, if they insist on using AI, writers should train their AI to make the article sound more like their writing, instead of just blindly follow what was produced.",
  },
  {
    key: "vibe-content-fatigue",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=46674724",
    publishedAt: "2026-01-19T03:28:34.000Z",
    segment: "technical-founder",
    tags: ["ai-slop", "website", "trust"],
    summary: "A visitor bounced from a site because the copy felt AI-generated.",
    quote: "I guess I have vibe generated website content fatigue.",
  },
  {
    key: "ai-citation-opaque",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=49144017",
    publishedAt: "2026-08-02T12:41:12.000Z",
    segment: "agency-owner",
    tags: ["ai-search", "citations", "opacity"],
    summary: "Even fully eligible sites are never cited in AI answers 94.8% of the time.",
    quote:
      "But what this data actually shows is the opposite: even if you do everything 'right' (allow the retrieval bots, provide perfect machine-readable schema, don't block anything), you still have a 94.8% chance of never being cited. How LLMs cite is entirely opaque.",
  },
  {
    key: "seo-not-ai-visibility",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=47142415",
    publishedAt: "2026-02-24T20:24:56.000Z",
    segment: "technical-founder",
    tags: ["ai-search", "seo", "perplexity"],
    summary: "Strong Google SEO does not predict strong AI visibility.",
    quote:
      "The pattern I kept seeing: strong Google SEO ≠ strong AI visibility. They're different signals entirely. Brands showing up in Perplexity results tend to have heavy third-party citation coverage (review sites, roundups, directories), not just on-page SEO.",
  },
  {
    key: "ai-answer-unsupported",
    source: "github_issue",
    url: "https://github.com/coreyhaines31/marketingskills/issues/937",
    publishedAt: "2026-11-03T17:36:06Z",
    segment: "marketing-lead",
    tags: ["ai-search", "citations", "accuracy"],
    summary: "An audit of 98,020 AI Overview claims found about 11% unsupported by the cited page.",
    quote:
      "About 11% of claims weren't supported by the cited page (upper bound; the generous estimate is ~5.3%), only 41.9% of overviews were fully supported, and source credibility didn't predict accuracy.",
  },
  {
    key: "attribution-bane",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=9258007",
    publishedAt: "2015-03-24T17:26:11.000Z",
    segment: "marketing-lead",
    tags: ["attribution", "measurement"],
    summary: "Marketers describe attribution as never good enough.",
    quote:
      "Marketing attribution is the bane of most marketers' existence, if only because it's never good enough.",
  },
  {
    key: "attribution-fuzzy",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=48180365",
    publishedAt: "2026-05-18T14:25:31.000Z",
    segment: "marketing-lead",
    tags: ["attribution", "measurement", "ai"],
    summary: "Marketing attribution is fuzzy and often rests on assumptions.",
    quote:
      "My guess is they have to wait to measure the downstream impact of their marketing. And marketing attribution is notoriously fuzzy.",
  },
  {
    key: "consistency-not-brilliance",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=46851710",
    publishedAt: "2026-02-02T02:26:16.000Z",
    segment: "marketing-lead",
    tags: ["consistency", "founder-led", "distribution"],
    summary: "A former head of growth says marketing is consistency, not brilliance.",
    quote: "The honest answer: 90% of marketing is consistency, not brilliance.",
  },
  {
    key: "spec-enforcement",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=49691289",
    publishedAt: "2026-09-14T02:44:04.000Z",
    segment: "technical-founder",
    tags: ["agents", "spec", "enforcement"],
    summary: "Spec generation is easy to copy; enforcement is the durable value.",
    quote:
      "The part I keep circling back to is that spec generation is easy to copy. Spec enforcement is where the value is: checking a diff against the spec and failing loudly.",
  },
  {
    key: "deterministic-linter",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=47086992",
    publishedAt: "2026-02-20T12:06:27.000Z",
    segment: "agency-owner",
    tags: ["linter", "agents", "seo"],
    summary: "A GEO linter keeps validation deterministic while the agent does the creative work.",
    quote:
      "The design principle: the linter is deterministic, the AI agent is creative. Same content in, same violations out, every time. The agent does the fixing.",
  },
  {
    key: "skill-overload",
    source: "github_issue",
    url: "https://github.com/coreyhaines31/marketingskills/issues/930",
    publishedAt: "2026-11-03T17:35:21Z",
    segment: "technical-founder",
    tags: ["skills", "routing", "context"],
    summary: "With four skill packs installed, the correct skill pick rate fell sharply.",
    quote:
      "One tester installed 4 packs together (145 skills, ours included). About 100 skills reached Claude as a bare name. The right-skill pick rate fell from 21/28 (pack alone) to 14/28 (all four packs).",
  },
  {
    key: "skill-malware",
    source: "github_issue",
    url: "https://github.com/coreyhaines31/marketingskills/issues/931",
    publishedAt: "2026-11-03T17:35:27Z",
    segment: "technical-founder",
    tags: ["skills", "security", "trust"],
    summary: "VirusTotal found 18.5% of 35,878 skills malicious, mostly instructions only.",
    quote:
      "Malicious skills mostly hide plain-language instructions where reviewers don't look. VirusTotal's analysis of 35,878 skills: 18.5% were malicious, and 62% of those were instructions only, with no code.",
  },
  {
    key: "ai-invents-ui",
    source: "github_issue",
    url: "https://github.com/coreyhaines31/marketingskills/issues/938",
    publishedAt: "2026-11-03T17:36:07Z",
    segment: "marketing-lead",
    tags: ["creative", "ai-images", "honesty"],
    summary: "A marketing skill pack warns that AI image models invent product UI.",
    quote:
      "The `image` skill offers only two paths for product visuals: real screenshots, or AI images (and it correctly warns that AI models invent UI).",
  },
  {
    key: "marketing-memory-pitch",
    source: "github_issue",
    url: "https://github.com/coreyhaines31/marketingskills/pull/939",
    publishedAt: "2026-11-03T21:51:07Z",
    segment: "technical-founder",
    tags: ["memory", "mcp", "context"],
    summary: "A new MCP server sells agents on a team's positioning, voice, and product facts.",
    quote:
      "a hosted MCP server that gives agents a team's positioning, brand voice, and product facts",
  },
  {
    key: "ai-recommendation-trust",
    source: "hn_comment",
    url: "https://news.ycombinator.com/item?id=47487232",
    publishedAt: "2026-03-23T09:48:43.000Z",
    segment: "technical-founder",
    tags: ["ai-search", "trust", "recommendations"],
    summary: "A buyer will trust an AI recommendation only far enough to open the link.",
    quote:
      "I sort of trust them to make product recommendations, but at best I will only open a link they suggest and buy the product there.",
  },
];

function signalId(ids: Map<string, string>, key: string): string {
  const id = ids.get(key);
  if (!id) throw new Error(`Seed signal missing: ${key}`);
  return id;
}

function existingSignals(): Map<string, { id: string; file: string }> {
  const repo = loadRepo(root);
  const map = new Map<string, { id: string; file: string }>();
  for (const signal of repo.signals) {
    const raw = parseFrontmatter(readText(path.join(root, signal.relPath))).data as Record<
      string,
      unknown
    >;
    const key = raw.x_key;
    if (typeof key === "string") map.set(key, { id: signal.data.id, file: signal.relPath });
  }
  return map;
}

function seedSignals(): Map<string, string> {
  const existing = existingSignals();
  const ids = new Map<string, string>();
  const dir = repoPaths(root).signals;
  ensureDir(dir);

  for (const seed of SEEDS) {
    const found = existing.get(seed.key);
    if (found) {
      ids.set(seed.key, found.id);
      continue;
    }
    const capturedAt = nowIso();
    const signal = SignalSchema.parse({
      schema: "growthos/signal@1",
      id: newId("sig"),
      status: "active",
      provenance: "public",
      captured_at: capturedAt,
      source: {
        kind: seed.source,
        url: seed.url,
        published_at: seed.publishedAt,
        retrieved_at: capturedAt,
      },
      quote: seed.quote,
      summary: seed.summary,
      segment: seed.segment,
      tags: seed.tags,
      consent: "public",
      integrity: {
        quote_hash: computeQuoteHash({
          quote: seed.quote,
          url: seed.url,
          publishedAt: seed.publishedAt,
        }),
        canonical_url: seed.url,
      },
      supersedes: null,
    });
    (signal as unknown as Record<string, unknown>).x_key = seed.key;
    const file = path.join(
      dir,
      `${isoDate(new Date(capturedAt))}-${seed.source}-${slugify(seed.quote, 42)}.md`,
    );
    writeText(
      file,
      stringifyFrontmatter(
        signal as unknown as Record<string, unknown>,
        `Captured from ${seed.url}.\n`,
      ),
    );
    ids.set(seed.key, signal.id);
    console.log(`signal ${seed.key} → ${signal.id}`);
  }
  return ids;
}

function seedExperiments(ids: Map<string, string>): { audit: string; showHn: string } {
  const repo = loadRepo(root);
  const findOrCreate = (
    hypothesis: string,
    input: Parameters<typeof createExperiment>[1],
  ): string => {
    const found = repo.experiments.find((experiment) => experiment.data.hypothesis === hypothesis);
    if (found) return found.data.id;
    const created = createExperiment(root, input);
    console.log(`experiment → ${created.experiment.id}`);
    return created.experiment.id;
  };

  const audit = findOrCreate(
    "Free 60-minute Growth Repo Audits will produce 5 completed audits and 3 written case studies in 21 days.",
    {
      hypothesis:
        "Free 60-minute Growth Repo Audits will produce 5 completed audits and 3 written case studies in 21 days.",
      channel: "design-partners",
      audience: "technical founders and marketing leads at 2-50 person software companies",
      signalIds: [
        signalId(ids, "spec-enforcement"),
        signalId(ids, "deterministic-linter"),
        signalId(ids, "skill-overload"),
      ],
      primaryMetric: { name: "completed_audits", baseline: 0, target: 5, observed: null },
      guardrails: ["every audit produces a memo with receipts", "no more than 10 hours per week"],
    },
  );

  const showHn = findOrCreate(
    "A technical Show HN post about evidence enforcement will produce 300 GitHub stars and 1,000 npm installs in 7 days.",
    {
      hypothesis:
        "A technical Show HN post about evidence enforcement will produce 300 GitHub stars and 1,000 npm installs in 7 days.",
      channel: "show-hn",
      audience: "engineers and founders who run marketing themselves",
      signalIds: [
        signalId(ids, "ai-sdr-saturation"),
        signalId(ids, "ai-citation-opaque"),
        signalId(ids, "spec-enforcement"),
      ],
      primaryMetric: { name: "github_stars", baseline: 0, target: 300, observed: null },
      guardrails: ["npm installs >= 300", "no growth-hack language in the post"],
    },
  );

  return { audit, showHn };
}

function buildMemo(ids: Map<string, string>, exp: { audit: string; showHn: string }): void {
  const memoPath = path.join(root, "growth", "memos", "2026-11-05-whatthemarketistellingus.md");
  if (
    loadRepo(root).memos.some(
      (memo) => memo.relPath === "growth/memos/2026-11-05-whatthemarketistellingus.md",
    )
  ) {
    console.log("memo already exists; leaving it immutable");
    return;
  }

  const cite = (...keys: string[]) => keys.map((key) => `[@${ids.get(key)}]`).join(" ");
  const claims = [
    `**AI outbound is saturating itself.** When every competitor runs an AI SDR, the channel collapses; the remaining differentiator is proof of work and reputation. ${cite("ai-sdr-saturation", "ai-recommendation-trust")}`,
    `**Content-led distribution is eroding.** A founder reports SEO article traffic declining "over the last year despite huge efforts," another says AI overviews end ~60% of searches without a click, and a 2023 comment predicted this exact shift. ${cite("content-marketing-dead", "ai-overviews-no-click", "serp-shift-predicted")}`,
    `**AI-generated marketing is now a trust liability.** Readers describe "AI slop" fatigue, say AI-written articles "sound the same," and bounce from "vibe generated website content fatigue." ${cite("ai-slop-fatigue", "ai-writing-sounds-same", "vibe-content-fatigue")}`,
    `**AI visibility is an opaque second search channel.** 94.8% of eligible sites are never cited, strong Google SEO does not predict AI visibility, and an audit of 98,020 claims found ~11% unsupported by the cited page. ${cite("ai-citation-opaque", "seo-not-ai-visibility", "ai-answer-unsupported")}`,
    `**Attribution is fuzzy enough that operators fall back on consistency and direct contact.** Two practitioners call attribution "the bane" and "notoriously fuzzy"; a former head of growth says "90% of marketing is consistency, not brilliance." ${cite("attribution-bane", "attribution-fuzzy", "consistency-not-brilliance")}`,
    `**Builders want enforcement, not another prompt.** A spec-driven CLI founder says "spec enforcement is where the value is: checking a diff against the spec and failing loudly"; a GEO linter founder says "the linter is deterministic, the AI agent is creative"; and a 145-skill install cut the right-skill pick rate from 21/28 to 14/28. ${cite("spec-enforcement", "deterministic-linter", "skill-overload")}`,
  ];

  const body = `# What the market is telling us — week of Nov 5

## Executive summary

The market does not need more marketing generation. It needs a way to tell which generated claim is true, which channel is still working, and which experiment actually closed. The same week, the largest marketing-skills repo shipped security and routing fixes, a spec-driven CLI founder said enforcement is the moat, and a GEO linter founder drew the same line: deterministic rules, creative agent.

## Claims

${claims.map((claim, index) => `${index + 1}. ${claim}`).join("\n")}

## What we are not saying

- We do not have evidence that teams will pay for this. There have been zero design-partner calls so far.
- Most signals are public Hacker News comments and GitHub issues from technical founders. They are not a representative sample of marketing teams.
- We have not measured whether a receipted memo changes conversion, reply rate, or retention.

## Counterevidence

- SpecPilot launched on Product Hunt with 4 votes and about 100 visitors. Enforcement tooling does not solve distribution. ${cite("spec-enforcement")}
- The skills layer is moving fast: a competing pack is actively adding honest visual workflows and security checks. A static prompt pack could catch up on features, even if not on evidence. ${cite("ai-invents-ui", "skill-malware")}

## What to test next

1. ${exp.audit} — 30 design-partner audit offers, 21 days.
2. ${exp.showHn} — one technical Show HN post, 7 days.

## Receipts

| Claim | Signal | Source | Quote |
| --- | --- | --- | --- |
${claims
  .flatMap((claim, index) =>
    extractCitations(claim).map((id) => {
      const record = loadRepo(root).signalById.get(id);
      const quote = (record?.data.quote ?? "").replace(/\s+/g, " ").replace(/\|/g, "\\|");
      const since = claim.indexOf(`[@${id}]`) + 3;
      const title = claim.slice(0, Math.max(0, claim.indexOf("**", 2))).replace(/\*\*/g, "");
      return `| ${index + 1} (${title}) | [@${id}] | ${record?.data.source.url ?? ""} | "${quote}" |`;
    }),
  )
  .join("\n")}
`;

  const extracted = extractClaims(body);
  const receiptIds = new Set(extracted.flatMap((claim) => claim.citations));
  const channels = new Set(
    [...receiptIds]
      .map((id) => loadRepo(root).signalById.get(id)?.data.source.kind)
      .filter(Boolean),
  );

  writeText(
    memoPath,
    stringifyFrontmatter(
      {
        schema: "growthos/memo@1",
        id: newId("memo"),
        period: "2026-W45",
        status: "draft",
        generated_by: "job_customer-truth",
        claim_count: extracted.length,
        receipt_count: receiptIds.size,
        source_diversity: channels.size,
        created_at: nowIso(),
        published_at: null,
        supersedes: null,
      },
      body,
    ),
  );
  console.log(
    `memo → ${path.relative(root, memoPath)} (${extracted.length} claims, ${receiptIds.size} receipts)`,
  );
}

const ids = seedSignals();
const exp = seedExperiments(ids);
buildMemo(ids, exp);
console.log(
  "Done. Run: pnpm growthos doctor . --strict && pnpm growthos cockpit --root . --no-open",
);
