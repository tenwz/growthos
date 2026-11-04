# Concepts

The mental model behind growthOS. Read this before writing your first memo.

## The repo is the memory

A normal marketing stack stores data in a SaaS database you cannot read. A Growth OS stores it in a folder you can open in your editor, diff in a pull request, and hand to an agent.

Plain text is not a limitation. It is the interface: every agent already knows how to read and write files.

## Signal

A **signal** is one thing a customer said or did, recorded with:

- a verbatim quote (or an event-count/metric evidence block);
- a source kind and URL;
- who it came from (segment, optional author);
- when it was captured and published;
- consent and provenance;
- a SHA-256 hash of quote + canonical URL + published date.

Signals are append-only. If a quote was wrong, do not edit it. Capture a new signal with `supersedes` and mark the old one `superseded`.

Why hashes? Because the most common failure in AI marketing is a quote that slowly mutates into something more useful. A hash makes mutation visible.

## Receipt

A **receipt** is a citation `[@sig_...]` that connects a claim to a signal. A claim without a receipt is not a claim; it is an opinion.

Receipts are cheap to check and expensive to fake at scale. They also make memos useful months later: a reader can click back to the source.

## Memo

A **memo** is a small set of specific claims about what the market is telling you, each citing receipts. Good memos have:

- 4–7 claims;
- multiple channels;
- a "What we are not saying" section;
- counterevidence if it exists;
- one or more next tests.

Published memos are immutable. If new evidence changes the conclusion, write a new memo that supersedes the old one.

## Experiment

An **experiment** ties a hypothesis to the signals that motivated it, a channel, one primary metric, and guardrails.

It has four states: `proposed`, `running`, `complete`, `abandoned`. Every result row needs a receipt. It can only close with a decision (`scale`, `iterate`, `kill`, `inconclusive`) and a written learning.

The refusal to close without a receipt is deliberate. It turns "we tried that" into a record someone can audit.

## Learning

A **learning** is a short file at `growth/learnings/<exp_id>.md`. It states what the result implies and what changes next. It is separate from the experiment so it can be read, quoted, and counted by the score.

## Job

A **job** is a reusable agent task spec at `growth/agents/*.job.md`. It declares:

- data sources;
- schedule;
- filters;
- outputs;
- quality bar (receipts per claim, verbatim quotes, source URL, diversity);
- whether human approval is required;
- the success metric;
- what to write back.

The CLI compiles a job into a prompt, a context file, an output schema, and a manifest. The agent does not get to invent its own quality bar.

## Prompt compiler

`task compile` selects signals by recency, segment, and tag, dedupes by hash, caps the count, and wraps each signal in `<untrusted_signal>`. This is a security boundary: customer text can contain instructions, and those instructions are data, not commands.

## Provider

A **provider** calls a model. Two ship in v0.1:

- `command`: sends the prompt to a local command such as `claude -p`, `codex exec`, or `ollama run`, and reads stdout. No API key logic in growthOS.
- `openai-compatible`: calls any `/chat/completions` endpoint.

You can use growthOS without any provider by pasting `prompt.md` into your agent manually.

## Cockpit

The **cockpit** is a single self-contained HTML file plus `badge.json`, `badge.svg`, and `share-card.svg`. It is generated from the repo, not from a server. You can commit it and host it on GitHub Pages.

## Score

The **Growth OS Score** is a deterministic 100-point measure of system health. It is not revenue and not a vanity metric. It rewards evidence coverage, freshness, closed loops, defined jobs, memo craft, and public proof.

Synthetic repos are labeled and cannot be certified. The score reads file timestamps, so regenerating the cockpit does not reset freshness.

## Consent and provenance

| Provenance | Meaning | Public URL required |
| --- | --- | --- |
| `public` | Anyone can see the source | Yes |
| `internal` | Private call, ticket, or note | No |
| `synthetic` | Demo data | No; cannot back a published memo |

| Consent | Meaning |
| --- | --- |
| `public` | The source is public |
| `internal` | Private, may be used internally |
| `anonymized` | Private, names and identifiers removed |

When in doubt, anonymize and use `internal`. A useful memo with a redacted quote is better than a lawsuit.

## What growthOS refuses

- Claims without receipts.
- Published memos backed by synthetic data.
- Experiments closed without a receipted result.
- Jobs that publish or send without human approval.
- Secrets committed into the repo.
- Instructions hidden inside customer text.

The refusals are the product. Everything else is plumbing.
