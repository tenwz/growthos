# FAQ

## Is this just another prompt pack?

No. The skills are intentionally thin. The product is the evidence engine: a deterministic validator that fails a build when a claim has no receipt, plus an experiment ledger that refuses to close without a result.

Prompt packs teach an agent what to say. growthOS gives it something to say that is true and traceable.

## Do I need an LLM to use it?

No.

- `demo`, `init`, `capture`, `doctor`, `status`, `score`, `cockpit`, `experiment`, and `mcp` are deterministic and offline.
- Only `task run` calls a model.
- You can also use `task compile` and paste the prompt into any agent manually.

## Which models does it work with?

Any model that can follow a prompt and emit file blocks. Two providers ship:

- `command`: pipe the prompt to `claude -p`, `codex exec`, `ollama run`, or your own script.
- `openai-compatible`: OpenAI, OpenRouter, LM Studio, vLLM, and others.

There is no SDK lock-in and no telemetry.

## How is this different from marketingskills?

[marketingskills](https://github.com/coreyhaines31/marketingskills) is excellent at copy craft, positioning, and channel tactics. Use it for the "what to write" layer.

growthOS is the layer underneath: customer memory, receipts, and the experiment loop. It can call those skills; it does not replace them.

## Does it scrape X, Reddit, or LinkedIn?

No. `capture` takes a quote you or an approved agent already saw, plus a URL. There is no scraper, browser automation, or bulk profile collection.

This is a product decision and a legal one. Scraped data is also weak evidence: you cannot quote it confidently or consent to its use.

## Does it send emails or DMs?

No. The outbound skill produces drafts in `growth/outbound/drafts/`. A human reviews and sends. The MCP server has no send tool.

## Can I use internal customer calls?

Yes, with `--provenance internal --consent anonymized`. Remove names, emails, and phone numbers. The score only certifies repos with enough public signals, but internal signals still contribute to evidence and learning.

## Why Markdown and YAML?

Because agents, humans, and git all understand them. A pull request can show exactly which claim gained a receipt. A diff can reveal a quote that changed. No database migration, no export, no vendor.

## Why TypeScript?

The CLI needs to be installable with one command, work on macOS/Linux/Windows, and run without a Python or Rust toolchain. TypeScript with Node 20 is the shortest path to `npx growthos demo` working everywhere.

## Is the score gameable?

Not cheaply. Citations do not earn points by count; source diversity, hash integrity, and memo quality do. Synthetic repos cannot be certified. Experiments cannot close without receipts. `PROOF.md` needs real numbers. If you optimize the number without changing behavior, you hit a refusal or a cap.

## Why is my score capped at 60?

You have fewer than `score.min_signals` active signals (default 20). Capture more evidence. Do not lower the threshold on a public repo just to raise the number.

## Why does `doctor` fail on the demo?

By design. The demo contains a draft memo with an unsupported claim. The failure is the demonstration. Remove that file and `doctor --strict` passes.

## What happens if a published memo is wrong?

Do not edit it. Write a new memo that `supersedes` the old one and capture the correcting signal. The audit trail is the point.

## Can I publish the cockpit?

Yes. `growth/cockpit/index.html` is self-contained. Commit it and serve it with GitHub Pages, S3, or any static host. There are no external requests and no analytics.

## Does it work in Chinese?

The code and schemas are language-agnostic. CLI output is English in v0.1; documentation is available in English and Chinese. Memos, signals, and content can be written in any language. Chinese tokenization affects the duplicate-claim similarity check, which is conservative.

## What is the roadmap?

- v0.1: evidence core, three systems, six job specs, MCP, cockpit, score.
- v0.2: GitHub Action distribution, better experiment statistics, more provider adapters.
- v0.3: team workflows (review queues, approval records), localization.

The roadmap is driven by what real users run, not by feature count. Open an issue with your actual workflow.

## How do I contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md). The highest-value contributions are:

- a real repo using growthOS, with a link;
- a failing case the validator misses;
- a provider adapter;
- a translation of the docs;
- a design-partner case study with receipts.

## License?

MIT. Use it commercially, fork it, embed it. Attribution is appreciated, not required.
